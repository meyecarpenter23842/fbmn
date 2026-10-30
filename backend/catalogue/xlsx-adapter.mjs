// ADM-02 #19: local-only XLSX -> allowlisted CSV/preview. NO database, pricing or stock writes.
import ExcelJS from "exceljs";
import { previewSkuRows } from "./import-preview.mjs";

export const MASTER_SHEET = "DOI CHIEU 613 SKU";
const MAX_FILE_BYTES = 8_000_000;
const MAX_SHEET_ROWS = 20_000;
const PRICE_MERGED_SKUS = new Set(["P0041", "P0042", "P0051", "P006", "P0081", "P0082"]);
const IMPORT_FIELDS = ["sku_cong_ty", "ten_goc_xnt", "ten_san_pham", "barcode", "paper_size"];
const COL = Object.freeze({
  sku: "SKU công ty", xntName: "Tên XNT",
  suggestedName: "Tên trong bảng giá (đề xuất)", origin: "Có trong",
  stock: "Tồn XNT (thùng)", barcode: "Mã vạch", size: "Khổ",
  pages: "Số trang / tờ", ruling: "Dòng kẻ",
  price: "Giá bảng PDF (VAT 8%)", media: "Ảnh đang liên kết",
  mediaState: "Trạng thái ảnh", warnings: "Cảnh báo cần rà soát",
});
const VALID_ORIGINS = new Map([
  ["CHỈ XNT", "xnt_only"], ["CẢ HAI", "both"], ["CHỈ BẢNG GIÁ", "price_only"],
]);
const isBlank = value => value === null || value === undefined || value === "";
const isFormula = value => value && typeof value === "object" && Object.hasOwn(value, "formula");
const cellText = cell => {
  const v = cell.value;
  if (isBlank(v)) return "";
  if (isFormula(v)) throw new Error("source_formula_not_allowed");
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "object" && Array.isArray(v.richText)) return v.richText.map(part => part.text || "").join("");
  if (typeof v === "object" && typeof v.text === "string") return v.text;
  throw new Error("unsupported_cell_type");
};
function textAt(row, indexes, name) {
  return cellText(row.getCell(indexes.get(name)));
}
function csvEscape(value) {
  const text = String(value ?? "");
  return '"' + text.replaceAll('"', '""') + '"';
}
/** A machine-only, privacy-filtered CSV using exactly the existing CSV preview contract. */
export function toImportCsv(rows) {
  if (!Array.isArray(rows)) throw new Error("invalid_rows");
  return [IMPORT_FIELDS.join(","), ...rows.map(row =>
    IMPORT_FIELDS.map(field => csvEscape(row[field])).join(",")
  )].join("\n") + "\n";
}
function cleanPreviewFields(row) {
  const clean = { __row: row.__row };
  if (row.__error) clean.__error = row.__error;
  for (const field of IMPORT_FIELDS) if (Object.hasOwn(row, field)) clean[field] = row[field];
  return clean;
}
/** Parse the canonical reconciliation sheet ONLY. No image/price/stock values leave the adapter. */
export async function readXlsxSkuRows(bytes, options = {}) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0 || bytes.byteLength > MAX_FILE_BYTES)
    throw new Error("invalid_xlsx_size");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(bytes));
  const sheetName = options.sheetName || MASTER_SHEET;
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) throw new Error("missing_master_sheet");
  if (sheet.rowCount > MAX_SHEET_ROWS + 1) throw new Error("too_many_rows");
  const indexes = new Map();
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, n) => {
    const h = cellText(cell).trim();
    if (indexes.has(h)) throw new Error("duplicate_header");
    indexes.set(h, n);
  });
  for (const required of [COL.sku, COL.xntName, COL.suggestedName, COL.origin, COL.barcode, COL.size,
    COL.stock, COL.pages, COL.ruling, COL.price, COL.media, COL.mediaState, COL.warnings]) {
    if (!indexes.has(required)) throw new Error("missing_column:" + required);
  }
  const sourceFile = options.sourceFile || "Futurebook_Doi_Chieu_XNT_BangGia_Anh_28102026.xlsx";
  const rows = [], evidence = [];
  for (let n = 2; n <= sheet.rowCount; n++) {
    const r = sheet.getRow(n);
    if (!r.hasValues) continue;
    let sku;
    let rowError = null;
    try {
      const cell = r.getCell(indexes.get(COL.sku));
      // Numeric SKU storage is lossy for leading zeros: reject, never silently infer it.
      if (typeof cell.value === "number" || isFormula(cell.value)) {
        rowError = "sku_must_be_literal_text";
        sku = "";
      } else sku = cellText(cell);
    } catch {
      rowError = "sku_must_be_literal_text"; sku = "";
    }
    const raw = {};
    try {
      for (const [key, header] of Object.entries(COL)) {
        if (key !== "sku") raw[key] = textAt(r, indexes, header);
      }
    } catch { rowError ||= "unsupported_or_formula_cell"; }
    if (!sku && !rowError && Object.values(raw).every(isBlank)) continue;
    const origin = VALID_ORIGINS.get(raw.origin) || "unknown";
    const mediaCandidates = raw.media ? raw.media.split(/\s*\|\s*/).filter(Boolean).length : 0;
    const stockCell = r.getCell(indexes.get(COL.stock)).value;
    const stockNegative = typeof stockCell === "number" && stockCell < 0;
    const hasPriceSource = !isBlank(r.getCell(indexes.get(COL.price)).value);
    const warnings = [];
    if (origin === "xnt_only") warnings.push("price_unverified");
    if (origin === "price_only") warnings.push("missing_xnt");
    if (origin === "unknown") warnings.push("unknown_source");
    if (!mediaCandidates) warnings.push("image_missing");
    else warnings.push("image_mapping_unapproved");
    if (stockNegative) warnings.push("negative_stock");
    if (/sai\s*code/i.test(raw.xntName + " " + raw.warnings)) warnings.push("suspected_company_code");
    if (/khác\s+dòng\s+kẻ|lệch\s+mô\s+tả/i.test(raw.warnings)) warnings.push("source_spec_conflict");
    if (PRICE_MERGED_SKUS.has(sku)) warnings.push("merged_pdf_price_cell_verify");
    if (!rowError && (!sku || !VALID_ORIGINS.has(raw.origin))) rowError = "invalid_company_sku_or_source";
    if (!rowError && origin === "xnt_only" && !raw.xntName.trim()) rowError = "missing_original_xnt_name";
    if (!rowError && origin === "price_only" && !raw.suggestedName.trim()) rowError = "missing_price_source_name";
    if (!rowError && origin === "both" && (!raw.xntName.trim() || !raw.suggestedName.trim()))
      rowError = "missing_source_name";
    const record = {
      __row: n, sku_cong_ty: sku,
      ten_goc_xnt: raw.xntName || "",
      // This column is a proposed standardised title, NOT verbatim PDF evidence.
      ten_san_pham: raw.suggestedName || "",
      barcode: raw.barcode || "", paper_size: raw.size || "",
      ...(rowError ? { __error: rowError } : {}),
    };
    rows.push(record);
    evidence.push({
      row: n, sku_cong_ty: sku, provenance: {
        source_file: sourceFile, source_sheet: sheetName, excel_row: n,
        inventory_source: origin === "both" || origin === "xnt_only",
        price_document_source: origin === "both" || origin === "price_only",
      },
      specifications: { paper_size: raw.size || null, pages: raw.pages || null, ruling: raw.ruling || null },
      price_source_present: hasPriceSource, media_candidate_count: mediaCandidates,
      media_missing: mediaCandidates === 0, warnings,
      // No price value, warehouse quantity or image filename in the preview.
    });
  }
  if (!rows.length) throw new Error("empty_master_sheet");
  return { rows, evidence, source_sheet: sheetName, applied: false };
}
/** Pure dry-run; existing snapshots are supplied read-only; never connects to DB. */
export async function previewXlsxImport(bytes, existing = [], options = {}) {
  const parsed = await readXlsxSkuRows(bytes, options);
  const preview = previewSkuRows(parsed.rows.map(cleanPreviewFields), existing);
  const counts = { xnt_only: 0, both: 0, price_only: 0, unknown: 0,
    missing_images: 0, image_candidates: 0, negative_stock: 0, price_unverified: 0,
    suspected_company_code: 0, source_spec_conflict: 0, merged_pdf_price_cells: 0 };
  const seen = new Set();
  const items = preview.items.map((item, i) => {
    const ev = parsed.evidence[i];
    const origin = ev.provenance.inventory_source ?
      (ev.provenance.price_document_source ? "both" : "xnt_only") :
      (ev.provenance.price_document_source ? "price_only" : "unknown");
    counts[origin]++;
    if (ev.media_missing) counts.missing_images++; else counts.image_candidates++;
    for (const [flag, countName] of Object.entries({
      negative_stock: "negative_stock", price_unverified: "price_unverified",
      suspected_company_code: "suspected_company_code",
      source_spec_conflict: "source_spec_conflict",
      merged_pdf_price_cell_verify: "merged_pdf_price_cells",
    })) if (ev.warnings.includes(flag)) counts[countName]++;
    seen.add(ev.sku_cong_ty.toUpperCase());
    return { ...item, media_missing: ev.media_missing, media_candidate_count: ev.media_candidate_count,
      provenance: ev.provenance, specifications: ev.specifications, warnings: ev.warnings,
      source_name_xnt: parsed.rows[i].ten_goc_xnt,
      proposed_name: parsed.rows[i].ten_san_pham,
      price_source_present: ev.price_source_present,
      requires_review: ev.warnings.some(w => w !== "image_missing") || item.status === "conflict",
    };
  });
  return { applied: false, totals: preview.totals, counts: {
    ...counts, total_rows: parsed.rows.length, unique_company_skus: seen.size,
    valid_unique_company_skus: new Set(items.filter(x => x.status !== "error").map(x => x.sku_cong_ty)).size,
  }, source_sheet: parsed.source_sheet, items };
}
