import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {readXlsxSkuRows,previewXlsxImport,SIMPLE_SHEET,MASTER_SHEET} from "../backend/catalogue/xlsx-adapter.mjs";
import {readFileSync} from "node:fs";

const COLS=["Mã công ty","Tên sản phẩm","Mã vạch","Khổ","Số trang","Dòng kẻ"];
async function workbook(rows){
  const book=new ExcelJS.Workbook();
  const sheet=book.addWorksheet(SIMPLE_SHEET);
  sheet.addRow(COLS);
  sheet.getColumn(1).numFmt="@";
  sheet.getColumn(3).numFmt="@";
  for(const row of rows)sheet.addRow(row);
  return new Uint8Array(await book.xlsx.writeBuffer());
}
test("ADM-08 one-sheet import preserves original company code text and supports missing optional values",async()=>{
  const bytes=await workbook([["0114","Tập Futurebook A5","","A5","100","Dòng ngang"],
    ["C5921","Sổ bìa cứng","","A4","",""]]);
  const parsed=await readXlsxSkuRows(bytes);
  assert.equal(parsed.source_sheet,"SAN PHAM");
  assert.deepEqual(parsed.rows.map(r=>r.sku_cong_ty),["0114","C5921"]);
  assert.equal(parsed.evidence[0].specifications.pages,"100");
  const result=await previewXlsxImport(bytes,[]);
  assert.deepEqual(result.totals,{create:2,update:0,unchanged:0,conflict:0,error:0});
  assert.equal(result.counts.total_rows,2);
  assert.equal(result.counts.missing_images,2);
  assert.equal(result.applied,false);
  assert.ok(!JSON.stringify(result).includes("source_price_vnd"));
});
test("ADM-08 numeric Excel SKU is rejected, never silently converted or padded",async()=>{
  const bytes=await workbook([[114,"Tập đánh số","","A5","",""]]);
  const parsed=await readXlsxSkuRows(bytes);
  assert.equal(parsed.rows[0].__error,"sku_must_be_literal_text");
  const result=await previewXlsxImport(bytes);
  assert.equal(result.totals.error,1);
});
test("ADM-08 missing required title cannot create a nameless draft",async()=>{
  const result=await previewXlsxImport(await workbook([["0114","","","A5","",""]]));
  assert.equal(result.totals.error,1);
});
test("ADM-08 existing company code is identified as update, never double-created",async()=>{
  const bytes=await workbook([["0114","Tập mới","","A5","",""]]);
  const existing=[{sku_cong_ty:"0114",ten_san_pham:"Tập cũ",review_status:"draft",revision:1}];
  const result=await previewXlsxImport(bytes,existing);
  assert.equal(result.totals.create,0);
  assert.equal(result.totals.update,1);
});
test("ADM-08 original multi-sheet reconciliation format remains supported",async()=>{
  const source=readFileSync(new URL("../apps/admin/lib/sku-xlsx-adapter.mjs",import.meta.url),"utf8");
  assert.ok(source.includes('export const MASTER_SHEET = "DOI CHIEU 613 SKU"'));
  assert.ok(source.includes('workbook.getWorksheet(sheetName)'));
  assert.notEqual(MASTER_SHEET,SIMPLE_SHEET);
});
test("ADM-08 product editing and importing are popups, not inline expanding forms",()=>{
  const manager=readFileSync(new URL("../apps/admin/app/catalogue-manager.tsx",import.meta.url),"utf8");
  const modal=readFileSync(new URL("../apps/admin/app/product-modal.tsx",import.meta.url),"utf8");
  assert.match(manager,/\(create\|\|editing\)&&<ProductModal/);
  assert.match(manager,/<CatalogueProductWorkspace/);
  assert.match(manager,/structurePane&&<ProductModal/);
  assert.match(manager,/<CatalogueStructureManager/);
  assert.match(manager,/showImport&&<ProductModal/);
  assert.match(modal,/role="dialog" aria-modal="true"/);
  assert.match(modal,/createPortal/);
  assert.match(modal,/Escape/);
  assert.match(modal,/document.body.style.overflow="hidden"/);
  assert.match(manager,/sku_cong_ty:editing.sku_cong_ty/);
});
test("ADM-08 template route contains one sheet and explicitly text-formatted company SKU",()=>{
  const source=readFileSync(new URL("../apps/admin/app/api/catalogue/template/route.ts",import.meta.url),"utf8");
  assert.match(source,/addWorksheet\("SAN PHAM"\)/);
  assert.match(source,/getColumn\(1\).numFmt="@"/);
  assert.match(source,/getColumn\(3\).numFmt="@"/);
  assert.doesNotMatch(source,/sheet\.addRow\(\["0114"/);
});

test("ADM-08 import dialog cannot close while a draft write is in flight",()=>{
  const manager=readFileSync(new URL("../apps/admin/app/catalogue-manager.tsx",import.meta.url),"utf8");
  const importer=readFileSync(new URL("../apps/admin/app/catalogue-import-preview.tsx",import.meta.url),"utf8");
  assert.match(manager,/wide locked={importBusy}/);
  assert.match(manager,/onBusyChange={handleImportBusy}/);
  assert.match(manager,/onSaved={importSaved}/);
  assert.match(importer,/onBusyChange\?\.\(busy\|\|approving\|\|inspecting\)/);
  assert.match(importer,/onSaved\?\.\(\)/);
});
