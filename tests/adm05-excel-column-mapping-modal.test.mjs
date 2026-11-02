import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {readFileSync} from "node:fs";
import {readXlsxSkuRows,inspectXlsxColumns,validateColumnMapping,previewXlsxImport}
  from "../backend/catalogue/xlsx-adapter.mjs";
import {planSheetSync} from "../backend/catalogue/sheet-sync.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
async function book(headers,rows){
  const b=new ExcelJS.Workbook(),s=b.addWorksheet("SAN PHAM");
  s.addRow(headers);s.getColumn(1).numFmt="@";
  for(const row of rows)s.addRow(row);
  return new Uint8Array(await b.xlsx.writeBuffer());
}
const existing={sku_cong_ty:"0114",ten_san_pham:"Sổ cũ",barcode:"8990000000012",
  paper_size:"A5",revision:2,review_status:"draft",product_spec:{gsm:"70",unit:"quyển",pages:"96"}};
test("mapping inspector returns 1-sheet column headers and 3 samples, no writes",async()=>{
  const bytes=await book(["Mã công ty","GSM nguồn","Ghi chú riêng"],[
    ["0114","80","Không nhập"],["0714","90","Khác"]]);
  const profile=await inspectXlsxColumns(bytes);
  assert.equal(profile.columns.length,3);
  assert.equal(profile.total_rows,2);
  assert.equal(profile.columns[0].suggested,"sku");
  assert.equal(profile.columns[1].suggested,"ignore");
  assert.equal(profile.columns[0].samples[0],"0114");
  assert.equal(profile.columns[1].samples[1],"90");
});
test("manual per-column mapping updates only explicit fields despite unfamiliar Excel titles",async()=>{
  const bytes=await book(["Mã công ty","GSM nguồn","Ghi chú riêng","Sản phẩm đổi tên"],[
    ["0114","80","NEVER_WRITE_ME","Sổ mới"]]);
  const columnMapping=["sku","gsm","ignore","title"];
  const parsed=await readXlsxSkuRows(bytes,{columnMapping});
  assert.equal(parsed.rows[0].sku_cong_ty,"0114");
  assert.equal(parsed.rows[0].ten_san_pham,"Sổ mới");
  assert.equal(parsed.evidence[0].specifications.gsm,"80");
  const plan=planSheetSync(parsed,[existing]);
  assert.deepEqual(plan.totals,{create:0,update:1,unchanged:0,conflict:0,error:0});
  assert.deepEqual(plan.operations[0].changes,{ten_san_pham:"Sổ mới",product_spec:{gsm:"80"}});
  assert.equal(plan.operations[0].expected_revision,2);
  assert.doesNotMatch(JSON.stringify(plan.operations),/NEVER_WRITE_ME|price|NET/);
  const preview=await previewXlsxImport(bytes,[existing],{columnMapping});
  assert.equal(preview.applied,false);
});
test("sheet auto-headers unchanged, invalid mappings rejected and numeric SKU not reconstructed",async()=>{
  const simple=await book(["Mã công ty","Định lượng GSM"],[["0114","80"]]);
  const automatic=await readXlsxSkuRows(simple);
  assert.equal(automatic.evidence[0].specifications.gsm,"80");
  assert.deepEqual(validateColumnMapping(["sku","gsm"],2),["sku","gsm"]);
  assert.throws(()=>validateColumnMapping(["ignore","gsm"],2),/invalid_column_mapping/);
  assert.throws(()=>validateColumnMapping(["sku","sku"],2),/invalid_column_mapping/);
  assert.throws(()=>validateColumnMapping(["sku","net_price"],2),/invalid_column_mapping/);
  assert.throws(()=>validateColumnMapping(["sku","ignore"],2),/missing_mapped_fields/);
  assert.throws(()=>validateColumnMapping(["sku","gsm","gsm"],3),/duplicate_column_mapping/);
  const numeric=await book(["any","GSM"],[[114,"80"]]);
  const result=await readXlsxSkuRows(numeric,{columnMapping:["sku","gsm"]});
  assert.equal(result.rows[0].__error,"sku_must_be_literal_text");
});
test("mapping preview and confirm re-use exact mapping and bound hash; no unapproved save",()=>{
  const ui=read("apps/admin/app/catalogue-import-preview.tsx");
  const preview=read("apps/admin/app/api/catalogue/preview/route.ts");
  const sync=read("apps/admin/app/api/catalogue/sync/route.ts");
  const inspect=read("apps/admin/app/api/catalogue/inspect/route.ts");
  const css=read("apps/admin/app/import-preview.css");
  assert.match(ui,/Ghép cột Excel với thuộc tính cần cập nhật/);
  assert.match(ui,/COLUMN_FIELDS\.map/);
  assert.match(ui,/\(\(mode==="update"\|\|columns\.length>0\)\&\&!mappingReady\)/);
  assert.match(ui,/columns\.length===0\|\|mappingReady/);
  assert.match(ui,/onChange=\{e=>changeMapping\(i,e.target.value\)\}/);
  assert.match(ui,/setPreview\(null\)/);
  assert.match(ui,/\/api\/catalogue\/inspect/);
  assert.ok((ui.match(/form\.append\("mapping",JSON\.stringify\(mapping\)\)/g)||[]).length===2);
  assert.match(preview,/\.update\(JSON\.stringify\(columnMapping\?\?null\)\)/);
  assert.match(sync,/\.update\(JSON\.stringify\(columnMapping\?\?null\)\)/);
  assert.match(sync,/digest!==fingerprint/);
  assert.match(inspect,/\/v1\/admin\/session/);
  assert.match(inspect,/origin_forbidden/);
  assert.match(inspect,/readCap\(request\)/);
  assert.match(css,/\.fb-product-modal-wide\{width:min\(96vw,1480px\)\}/);
  assert.match(css,/\.catalogue-mapping-scroll\{overflow:auto/);
  assert.doesNotMatch(inspect,/INSERT INTO|UPDATE fbmn_catalog|net_price|source_price_vnd/);
});
