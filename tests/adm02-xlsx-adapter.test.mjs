import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { mkdtemp, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { readXlsxSkuRows, previewXlsxImport, toImportCsv, MASTER_SHEET } from "../backend/catalogue/xlsx-adapter.mjs";
import { parseCsv } from "../backend/catalogue/import-preview.mjs";

const HEADER = [
  "SKU công ty", "Tên XNT", "Tên trong bảng giá (đề xuất)", "Có trong",
  "Tồn XNT (thùng)", "Mã vạch", "Khổ", "Số trang / tờ", "Dòng kẻ",
  "Giá bảng PDF (VAT 8%)", "Ảnh đang liên kết", "Trạng thái ảnh", "Cảnh báo cần rà soát",
];
function data(sku, origin = "CẢ HAI", props = {}) {
  return [
    sku, origin === "CHỈ BẢNG GIÁ" ? "" : "Tên gốc " + sku,
    origin === "CHỈ XNT" ? "" : "Tên đề xuất " + sku,
    origin, props.stock ?? 4, props.barcode ?? "8930000000000",
    "A5", "120 trang", "Kẻ Ngang", props.price ?? 11200,
    props.images ?? "", props.images ? "Có ảnh gán - CHƯA duyệt" : "Chưa có ảnh",
    props.note ?? "",
  ];
}
async function fixture(rows, sheetName = MASTER_SHEET) {
  const wb = new ExcelJS.Workbook();
  const unrelated = wb.addWorksheet("TONG QUAN");
  unrelated.addRow(["DO NOT IMPORT", "99999", "NET"]);
  const sheet = wb.addWorksheet(sheetName);
  sheet.addRow(HEADER);
  rows.forEach(row => sheet.addRow(row));
  wb.addWorksheet("GIA PDF O GOP").addRow(["Price NOT a SKU", "Internal"]);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

test("Reads canonical XLSX by heading and preserves exact text company SKUs; no new variants", async () => {
  const file = await fixture([
    data("0114", "CẢ HAI", { images: "0114-01.png | 0114-02.png", stock: -3, note: "Sai Code" }),
    data("0714"), data("C592"), data("C5921", "CHỈ BẢNG GIÁ"),
    data("M422", "CẢ HAI", { note: "KHÁC DÒNG KẺ giữa XNT và bảng giá" }),
    data("P0041", "CẢ HAI"),
  ]);
  const parsed = await readXlsxSkuRows(file);
  assert.deepEqual(parsed.rows.map(x => x.sku_cong_ty), ["0114", "0714", "C592", "C5921", "M422", "P0041"]);
  assert.equal(parsed.rows.length, 6);
  assert.equal(parsed.rows[0].ten_goc_xnt, "Tên gốc 0114");
  assert.equal(parsed.rows[0].ten_san_pham, "Tên đề xuất 0114");
  assert.equal(parsed.rows[0].ten_goc_bang_gia, undefined); // proposed name is NOT original PDF text
  const preview = await previewXlsxImport(file);
  assert.deepEqual(preview.totals, { create: 6, update: 0, unchanged: 0, conflict: 0, error: 0 });
  assert.equal(preview.counts.negative_stock, 1);
  assert.equal(preview.counts.suspected_company_code, 1);
  assert.equal(preview.counts.source_spec_conflict, 1);
  assert.equal(preview.counts.merged_pdf_price_cells, 1);
  assert.equal(preview.items[0].media_candidate_count, 2);
  assert.equal(preview.items[1].media_missing, true);
  assert.equal(preview.items[3].provenance.price_document_source, true);
  assert.equal(preview.items[3].provenance.inventory_source, false);
  assert.ok(preview.items.every(x => x.applied === undefined));
  assert.equal(preview.applied, false);
});

test("CSV adapter only exports the five allowlisted fields; no NET, stock, media filenames", async () => {
  const file = await fixture([data("0114", "CẢ HAI", { stock: -999999, price: 87654321, images: "secret-cover.png" })]);
  const parsed = await readXlsxSkuRows(file);
  const csv = toImportCsv(parsed.rows);
  const decoded = parseCsv(csv);
  assert.equal(decoded[0].sku_cong_ty, "0114");
  assert.equal(decoded[0].paper_size, "A5");
  assert.equal(decoded[0].ten_san_pham, "Tên đề xuất 0114");
  assert.ok(!csv.includes("87654321"));
  assert.ok(!csv.includes("999999"));
  assert.ok(!csv.includes("secret-cover.png"));
  const preview = await previewXlsxImport(file);
  const json = JSON.stringify(preview);
  assert.ok(!json.includes("87654321"));
  assert.ok(!json.includes("999999"));
  assert.ok(!json.includes("secret-cover.png"));
});

test("613-SKU synthetic reconciliation matches source split, 541 empty media without dropping SKUs", async () => {
  const rows = Array.from({ length: 613 }, (_, i) => data(
    "TEST" + String(i).padStart(4, "0"),
    i < 224 ? "CẢ HAI" : i < 609 ? "CHỈ XNT" : "CHỈ BẢNG GIÁ",
    { images: i >= 541 ? "TEST-cover.png" : "", stock: i < 2 ? -1 : 0 },
  ));
  const preview = await previewXlsxImport(await fixture(rows));
  assert.deepEqual(preview.totals, { create: 613, update: 0, unchanged: 0, conflict: 0, error: 0 });
  assert.equal(preview.counts.total_rows, 613);
  assert.equal(preview.counts.unique_company_skus, 613);
  assert.equal(preview.counts.valid_unique_company_skus, 613);
  assert.equal(preview.counts.both, 224);
  assert.equal(preview.counts.xnt_only, 385);
  assert.equal(preview.counts.price_only, 4);
  assert.equal(preview.counts.missing_images, 541);
  assert.equal(preview.counts.image_candidates, 72);
  assert.equal(preview.counts.negative_stock, 2);
  assert.equal(preview.counts.price_unverified, 385);
  assert.equal(preview.applied, false);
});

test("Idempotent existing snapshots; approved records conflict, different barcodes may repeat", async () => {
  const file = await fixture([data("0114"), data("0714"), data("C592"), data("C5921")]);
  const existing = [
    { sku_cong_ty: "0114", ten_goc_xnt: "Tên gốc 0114", ten_san_pham: "Tên đề xuất 0114",
      barcode: "8930000000000", paper_size: "A5", review_status: "draft", revision: 1 },
    { sku_cong_ty: "0714", ten_goc_xnt: "Tên cũ", ten_san_pham: "Tên đề xuất 0714",
      barcode: "8930000000000", paper_size: "A5", review_status: "draft", revision: 1 },
    { sku_cong_ty: "C592", ten_goc_xnt: "Tên cũ", review_status: "approved", revision: 2 },
  ];
  const preview = await previewXlsxImport(file, existing);
  assert.deepEqual(preview.totals, { create: 1, update: 1, unchanged: 1, conflict: 1, error: 0 });
  assert.equal(preview.items[2].reason, "approved_or_revision_changed");
  assert.equal(preview.items[3].sku_cong_ty, "C5921");
});

test("Reject numeric/formula SKU storage, duplicates and unknown sheet; do not infer company codes", async () => {
  const file = await fixture([
    data(114), data({ formula: "100+14", result: 114 }), data("0114"), data("0114"),
  ]);
  const preview = await previewXlsxImport(file);
  assert.equal(preview.totals.error, 3);
  assert.equal(preview.totals.create, 1);
  assert.equal(preview.items[0].reason, "sku_must_be_literal_text");
  assert.equal(preview.items[1].reason, "sku_must_be_literal_text");
  assert.equal(preview.items[3].reason, "duplicate_sku_in_upload");
  await assert.rejects(readXlsxSkuRows(file, { sheetName: "WRONG SHEET" }), /missing_master_sheet/);
  await assert.rejects(readXlsxSkuRows(Buffer.from("not a workbook")), /zip|archive|invalid|Unsupported/i);
});

test("Blank numeric/formula SKU-only rows are errors, never silently omitted", async () => {
  const onlyNumber = [114, "", "", "", "", "", "", "", "", "", "", "", ""];
  const onlyFormula = [{ formula: "100+14", result: 114 }, "", "", "", "", "", "", "", "", "", "", "", ""];
  const result = await previewXlsxImport(await fixture([data("0114"), onlyNumber, onlyFormula]));
  assert.deepEqual(result.totals, { create: 1, update: 0, unchanged: 0, conflict: 0, error: 2 });
  assert.equal(result.counts.total_rows, 3);
  assert.ok(result.items.slice(1).every(row => row.reason === "sku_must_be_literal_text"));
});

test("CLI output guard blocks repo paths even from another cwd and via symlinked parent", async () => {
  const dir = await mkdtemp(join(tmpdir(), "fbmn-cli-test-"));
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const cli = resolve(root, "backend/catalogue/preview-xlsx-cli.mjs");
  const input = join(dir, "private.xlsx");
  try {
    await writeFile(input, await fixture([data("0114")]));
    const inRepo = join(root, "adm02-private-export-test.csv");
    const direct = spawnSync(process.execPath, [cli, input, "--csv-out", inRepo], {
      cwd: dir, encoding: "utf8",
    });
    assert.equal(direct.status, 1);
    assert.match(direct.stderr, /output_inside_repository_forbidden/);
    const link = join(dir, "outlink");
    await symlink(root, link, "dir");
    const symlinked = spawnSync(process.execPath, [cli, input, "--report-out", join(link, "adm02-private-export-test.json")], {
      cwd: dir, encoding: "utf8",
    });
    assert.equal(symlinked.status, 1);
    assert.match(symlinked.stderr, /output_inside_repository_forbidden/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
