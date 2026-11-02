import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ExcelJS from "exceljs";
import {
  inspectXlsxColumns,readXlsxSkuRows,previewXlsxImport,validateColumnMapping
} from "../backend/catalogue/xlsx-adapter.mjs";
import {planSheetSync} from "../backend/catalogue/sheet-sync.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
async function excel(sheetName,rows,{title=false,styledColumn=0,headers}={}){
  const book=new ExcelJS.Workbook(),sheet=book.addWorksheet(sheetName);
  if(title)sheet.addRow(["BẢNG CẬP NHẬT SẢN PHẨM FUTUREBOOK 2026"]);
  sheet.addRow(headers||["Mã công ty","Tên sản phẩm","Định lượng GSM"]);
  sheet.getColumn(1).numFmt="@";
  if(styledColumn)sheet.getRow(title?2:1).getCell(styledColumn).numFmt="@";
  for(const row of rows)sheet.addRow(row);
  return new Uint8Array(await book.xlsx.writeBuffer());
}
test("realistic 613-SKU one-sheet Excel with arbitrary sheet title no longer returns 422",async()=>{
  const rows=Array.from({length:613},(_,n)=>[String(n+1000).padStart(4,"0"),"Sổ Futurebook "+(n+1),"80"]);
  rows[0][0]="0114"; // Code leading zero remains a literal string.
  const bytes=await excel("Danh sách 613 SKU",rows);
  const inspected=await inspectXlsxColumns(bytes);
  assert.equal(inspected.source_sheet,"SAN PHAM"); // Canonical sync protocol.
  assert.equal(inspected.worksheet_name,"Danh sách 613 SKU");
  assert.equal(inspected.header_row,1);
  assert.equal(inspected.columns.length,3);
  assert.equal(inspected.total_rows,613);
  assert.deepEqual(inspected.columns.map(x=>x.suggested),["sku","title","gsm"]);
  const parsed=await readXlsxSkuRows(bytes,{columnMapping:["sku","title","gsm"]});
  assert.equal(parsed.source_sheet,"SAN PHAM");
  assert.equal(parsed.rows.length,613);
  assert.equal(parsed.rows[0].sku_cong_ty,"0114");
  assert.equal(parsed.evidence[0].provenance.source_sheet,"Danh sách 613 SKU");
  assert.equal(parsed.evidence[0].specifications.gsm,"80");
  assert.deepEqual(validateColumnMapping(["sku","title","gsm"],3),["sku","title","gsm"]);
});
test("worksheet with a title row and style-only far columns has correct header and sample range",async()=>{
  const bytes=await excel("SAN_PHAM",[
    ["0114","Sổ Futurebook","90"],["0115","Sổ tập","100"]
  ],{title:true,styledColumn:200});
  const info=await inspectXlsxColumns(bytes);
  assert.equal(info.header_row,2);
  assert.equal(info.columns.length,3);
  assert.equal(info.columns[0].samples[0],"0114");
  assert.equal(info.columns[2].samples[1],"100");
  const parsed=await readXlsxSkuRows(bytes,{columnMapping:["sku","title","gsm"]});
  assert.equal(parsed.rows.length,2);
  assert.equal(parsed.rows[0].__row,3);
  assert.equal(parsed.rows[1].sku_cong_ty,"0115");
  assert.equal(parsed.evidence[0].provenance.source_sheet,"SAN_PHAM");
  assert.equal(parsed.evidence[0].provenance.excel_row,3);
});
test("alternate company-code title and uppercase known fields work on unmapped and mapped files",async()=>{
  const bytes=await excel("Sheet1",[["0114","Sổ Futurebook","70"]],
    {headers:["SKU CÔNG TY","TÊN SẢN PHẨM","ĐỊNH LƯỢNG GSM"]});
  const inspection=await inspectXlsxColumns(bytes);
  assert.deepEqual(inspection.columns.map(c=>c.suggested),["sku","title","gsm"]);
  const parsed=await readXlsxSkuRows(bytes);
  assert.equal(parsed.rows[0].sku_cong_ty,"0114");
  assert.equal(parsed.rows[0].ten_san_pham,"Sổ Futurebook");
  assert.equal(parsed.evidence[0].specifications.gsm,"70");
  assert.equal((await previewXlsxImport(bytes,[])).totals.create,1);
});
test("mapped file uses same revision-safe plan as preview and retains old values",async()=>{
  const bytes=await excel("TẬP HỌC SINH",[
    ["0114","","80"]
  ],{headers:["SKU công ty","Tên từ nguồn","GSM riêng"]});
  const map=["sku","ignore","gsm"];
  const parsed=await readXlsxSkuRows(bytes,{columnMapping:map});
  const original={sku_cong_ty:"0114",revision:2,review_status:"draft",
    ten_san_pham:"Sổ đang có",product_spec:{gsm:"70",unit:"quyển"}};
  const plan=planSheetSync(parsed,[original]);
  assert.deepEqual(plan.totals,{create:0,update:1,unchanged:0,conflict:0,error:0});
  assert.deepEqual(plan.operations[0].changes,{product_spec:{gsm:"80"}});
  assert.equal(plan.operations[0].expected_revision,2);
  assert.equal(plan.operations[0].sku_cong_ty,"0114");
  assert.equal(plan.applied,false);
});
test("multi-sheet, unknown SKU header and real >40-column workbooks fail with precise safe codes",async()=>{
  const book=new ExcelJS.Workbook();
  book.addWorksheet("SAN PHAM").addRow(["Mã công ty","Tên sản phẩm"]);
  book.addWorksheet("THÔNG TIN KHÁC").addRow(["X","Y"]);
  await assert.rejects(inspectXlsxColumns(new Uint8Array(await book.xlsx.writeBuffer())),
    {message:"multiple_worksheets"});
  const noCode=await excel("Data",[["0114","Sổ Futurebook"]],{headers:["STT","Tên sản phẩm"]});
  await assert.rejects(inspectXlsxColumns(noCode),{message:"missing_company_sku_column"});
  const wide=new ExcelJS.Workbook(),sheet=wide.addWorksheet("Products");
  sheet.getRow(1).getCell(1).value="Mã công ty";
  sheet.getRow(1).getCell(41).value="Cột 41";
  sheet.addRow(["0114","Sổ Futurebook"]);
  await assert.rejects(inspectXlsxColumns(new Uint8Array(await wide.xlsx.writeBuffer())),
    {message:"too_many_columns"});
});
test("legacy 613-SKU reconciliation keeps full source evidence, even when it is one sheet",async()=>{
  const headers=["SKU công ty","Tên XNT","Tên trong bảng giá (đề xuất)","Có trong",
    "Tồn XNT (thùng)","Mã vạch","Khổ","Số trang / tờ","Dòng kẻ",
    "Giá bảng PDF (VAT 8%)","Ảnh đang liên kết","Trạng thái ảnh","Cảnh báo cần rà soát"];
  for(const name of ["DOI CHIEU 613 SKU","Đối chiếu Futurebook"]){
    const book=new ExcelJS.Workbook(),sheet=book.addWorksheet(name);
    sheet.addRow(headers);
    sheet.addRow(["0114","Tên gốc từ XNT","Tên đề xuất từ bảng giá","CẢ HAI",
      "","","A5","100","4 ô ly","","","",""]);
    const bytes=new Uint8Array(await book.xlsx.writeBuffer());
    await assert.rejects(inspectXlsxColumns(bytes),{message:"legacy_reconciliation_sheet"});
    const parsed=await readXlsxSkuRows(bytes);
    assert.equal(parsed.source_sheet,name);
    assert.equal(parsed.rows[0].ten_goc_xnt,"Tên gốc từ XNT");
    assert.equal(parsed.rows[0].ten_san_pham,"Tên đề xuất từ bảng giá");
    assert.equal(parsed.rows[0].sku_cong_ty,"0114");
    assert.equal(parsed.evidence[0].provenance.inventory_source,true);
    assert.equal(parsed.evidence[0].provenance.price_document_source,true);
    assert.equal((await previewXlsxImport(bytes,[])).totals.create,1);
    await assert.rejects(readXlsxSkuRows(bytes,{columnMapping:["sku",...Array(12).fill("ignore")]}),
      {message:"legacy_reconciliation_sheet"});
  }
});
test("literal numeric SKU is never silently converted even when inspector accepts the worksheet",async()=>{
  const bytes=await excel("TẬP 2026",[[114,"Sổ Futurebook","70"]]);
  assert.equal((await inspectXlsxColumns(bytes)).columns.length,3);
  const parsed=await readXlsxSkuRows(bytes,{columnMapping:["sku","title","gsm"]});
  assert.equal(parsed.rows[0].__error,"sku_must_be_literal_text");
});
test("safe 422 messages and backend frontend adapter parity are regression guarded",()=>{
  const backend=read("backend/catalogue/xlsx-adapter.mjs");
  const frontendAdapter=read("apps/admin/lib/sku-xlsx-adapter.mjs");
  // These modules use different relative import paths; the pure parser body is mirrored.
  assert.equal(backend.slice(backend.indexOf("export const MASTER_SHEET")),
    frontendAdapter.slice(frontendAdapter.indexOf("export const MASTER_SHEET")));
  const inspect=read("apps/admin/app/api/catalogue/inspect/route.ts");
  const frontend=read("apps/admin/app/catalogue-import-preview.tsx");
  const preview=read("apps/admin/app/api/catalogue/preview/route.ts");
  const sync=read("apps/admin/app/api/catalogue/sync/route.ts");
  assert.match(inspect,/safeCodes\.has\(reason\)\?reason:"xlsx_decode_failed"/);
  assert.match(frontend,/missing_company_sku_column/);
  assert.match(frontend,/multiple_worksheets/);
  assert.doesNotMatch(frontend,/Chỉ đọc ghép cột trên file 1 sheet SAN PHAM/);
  assert.match(preview,/\.update\(JSON\.stringify\(columnMapping\?\?null\)\)/);
  assert.match(sync,/\.update\(JSON\.stringify\(columnMapping\?\?null\)\)/);
  assert.doesNotMatch(inspect,/INSERT INTO|UPDATE fbmn_catalog|net_price/);
});
