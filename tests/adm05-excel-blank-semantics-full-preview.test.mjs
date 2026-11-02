import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ExcelJS from "exceljs";
import {readXlsxSkuRows} from "../backend/catalogue/xlsx-adapter.mjs";
import {planSheetSync} from "../backend/catalogue/sheet-sync.mjs";
import {handleCatalogue} from "../backend/admin-api/catalogue-service.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const root="10000000-0000-0000-0000-000000000001";
const leaf="10000000-0000-0000-0000-000000000002";
const categories=[
  {id:root,parent_id:null,category_label:"Tập học sinh"},
  {id:leaf,parent_id:root,category_label:"Tập 4 ô ly"}
];
const original=()=>({sku_cong_ty:"0114",ten_san_pham:"Vở Song",revision:4,
  review_status:"draft",barcode:"0899988000",paper_size:"A5",category_id:leaf,
  product_spec:{pages:"96 trang",ruling:"4 ô ly",gsm:"70",cover_type:"Bìa UV",
    unit:"quyển",packaging:"Lốc",units_per_pack:"10",legacy_custom:"Giữ nguyên"}});
async function file(){
  const wb=new ExcelJS.Workbook(),sheet=wb.addWorksheet("SAN PHAM");
  sheet.addRow(["Mã công ty","Tên sản phẩm","Mã vạch","Khổ","Số trang","Dòng kẻ",
    "Danh mục","Định lượng GSM","Loại bìa","Đơn vị tính",
    "Quy cách đóng gói","Số đơn vị / đóng gói"]);
  sheet.getColumn(1).numFmt="@";sheet.getColumn(3).numFmt="@";
  sheet.addRow(["0114","Vở Song","","","96 trang","4 ô ly","","70","","quyển","",""]);
  return new Uint8Array(await wb.xlsx.writeBuffer());
}

test("one dropdown: mapped empty optional fields clear, ignored fields remain untouched",async()=>{
  const parsed=await readXlsxSkuRows(await file());
  const mapped=["ten_san_pham","barcode","paper_size","pages","ruling",
    "category_label","gsm","cover_type","unit","packaging","units_per_pack"];
  const p=planSheetSync(parsed,[original()],categories,{mappedFields:mapped});
  assert.equal(p.totals.update,1);
  assert.deepEqual(p.operations[0].changes,{
    barcode:null,paper_size:null,
    product_spec:{cover_type:null,packaging:null,units_per_pack:null},
    category_id:null
  });
  // Planner includes two new optional code states; legacy 11-field mapping is intact.
  assert.equal(p.items[0].field_states.length,13);
  assert.equal(p.items[0].field_states.find(x=>x.key==="category_code").action,"ignore");
  assert.equal(p.items[0].field_states.find(x=>x.key==="family_code").action,"ignore");
  assert.equal(p.items[0].field_states.find(x=>x.key==="barcode").action,"clear");
  assert.equal(p.items[0].field_states.find(x=>x.key==="gsm").action,"same");
  assert.equal(p.items[0].field_states.find(x=>x.key==="category_label").action,"clear");
  const ignored=planSheetSync(parsed,[original()],categories,{mappedFields:["gsm"]});
  assert.equal(ignored.totals.unchanged,1);
  assert.equal(ignored.items[0].field_states.find(x=>x.key==="barcode").action,"ignore");
  assert.deepEqual(ignored.operations,[]);
});
test("older cached UI explicit clearFields [] retains previous keep-on-blank semantics",async()=>{
  const parsed=await readXlsxSkuRows(await file());
  const p=planSheetSync(parsed,[original()],categories,{
    mappedFields:["barcode","paper_size","cover_type","category_label"],
    clearFields:[]});
  assert.equal(p.totals.unchanged,1);
  assert.equal(p.items[0].field_states.find(x=>x.key==="barcode").action,"keep");
  const clear=planSheetSync(parsed,[original()],categories,{
    mappedFields:["barcode","paper_size","cover_type","category_label"],
    clearFields:["barcode","cover_type","category_label"]});
  assert.deepEqual(clear.operations[0].changes,
    {barcode:null,product_spec:{cover_type:null},category_id:null});
  assert.equal(clear.items[0].field_states.find(x=>x.key==="paper_size").action,"keep");
});
test("cached legacy client keeps blank name while updating another selected field",async()=>{
  const wb=new ExcelJS.Workbook(),sheet=wb.addWorksheet("SAN PHAM");
  sheet.addRow(["Mã công ty","Tên sản phẩm","Định lượng GSM"]);
  sheet.addRow(["0114","","80"]);sheet.getColumn(1).numFmt="@";
  const parsed=await readXlsxSkuRows(new Uint8Array(await wb.xlsx.writeBuffer()),{
    columnMapping:["sku","title","gsm"]});
  const plan=planSheetSync(parsed,[original()],categories,{
    mappedFields:["ten_san_pham","gsm"],clearFields:[]});
  assert.equal(plan.totals.update,1);
  assert.deepEqual(plan.operations[0].changes,{product_spec:{gsm:"80"}});
  assert.equal(plan.items[0].field_states.find(x=>x.key==="ten_san_pham").action,"keep");
});
test("clear overrides from legacy clients are allowlisted and cannot touch immutable fields",async()=>{
  const parsed=await readXlsxSkuRows(await file());
  for(const clearFields of [["ten_san_pham"],["sku_cong_ty"],["NET"],["barcode","barcode"]])
    assert.throws(()=>planSheetSync(parsed,[original()],categories,{clearFields}),/invalid_clear_fields/);
  assert.throws(()=>planSheetSync(parsed,[original()],categories,{
    clearFields:["barcode"],mappedFields:["gsm"]}),/invalid_clear_fields/);
});
test("blank mapped required product name is a blocking error, not a silent keep/delete",async()=>{
  const wb=new ExcelJS.Workbook(),sheet=wb.addWorksheet("SAN PHAM");
  sheet.addRow(["Mã công ty","Tên sản phẩm"]);sheet.addRow(["0114",""]);
  sheet.getColumn(1).numFmt="@";
  const parsed=await readXlsxSkuRows(new Uint8Array(await wb.xlsx.writeBuffer()),{
    columnMapping:["sku","title"]});
  const p=planSheetSync(parsed,[original()],categories,{mappedFields:["ten_san_pham"]});
  assert.equal(p.totals.error,1);
  assert.equal(p.items[0].reason,"missing_product_name");
  assert.equal(p.items[0].field_states.find(x=>x.key==="ten_san_pham").action,"required");
  assert.equal(p.operations.length,0);
});
test("Owner-only atomic Worker accepts explicit null optional fields and preserves revision guard",async()=>{
  const statements=[];
  const db=async fn=>fn({query:async(sql,args=[])=>{
    statements.push({sql,args});
    if(sql.startsWith("UPDATE fbmn_catalog.skus s"))
      return {rowCount:1,rows:[{sku_cong_ty:"0114"}]};
    return {rowCount:0,rows:[]};
  }});
  const payload={confirm:"SYNC_SAN_PHAM",expectedCreate:0,expectedUpdate:1,operations:[
    {kind:"update",sku_cong_ty:"0114",expected_revision:4,
      changes:{barcode:null,paper_size:null,category_id:null,product_spec:{cover_type:null}}}
  ]};
  const request=()=>new Request("https://admin.example.test/v1/admin/catalogue/sync",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const denied=await handleCatalogue({request:request(),actor:{role:"editor",subject:"editor"},db});
  assert.equal(denied.status,403);
  const r=await handleCatalogue({request:request(),actor:{role:"owner",subject:"owner"},db});
  assert.equal(r.status,201);
  const update=statements.find(v=>v.sql.startsWith("UPDATE fbmn_catalog.skus s"));
  assert.match(update.sql,/s.revision=x.expected_revision/);
  assert.match(update.sql,/product_spec=s.product_spec \|\| COALESCE/);
  assert.equal(JSON.parse(update.args[0])[0].changes.barcode,null);
  assert.ok(statements.some(v=>v.sql==="COMMIT"));
});

test("new SKU preview shows populated fields as incoming rather than unchanged",async()=>{
  const parsed=await readXlsxSkuRows(await file());
  const plan=planSheetSync(parsed,[],categories,{
    mappedFields:["ten_san_pham","barcode","paper_size","pages","ruling","category_label","gsm"]});
  assert.equal(plan.totals.create,1);
  const states=plan.items[0].field_states;
  assert.equal(states.find(s=>s.key==="ten_san_pham").action,"create");
  assert.equal(states.find(s=>s.key==="ten_san_pham").to,"Vở Song");
  assert.equal(states.find(s=>s.key==="pages").action,"create");
  assert.equal(states.find(s=>s.key==="pages").to,"96 trang");
  assert.equal(states.find(s=>s.key==="barcode").action,"empty");
  assert.equal(states.find(s=>s.key==="unit").action,"ignore");
  const ui=read("apps/admin/app/catalogue-import-preview.tsx");
  assert.ok(ui.includes('key==="title"?"ten_san_pham":key'));
  assert.ok(ui.includes('action==="create"?"Dữ liệu mới"'));
});

test("one selection per column; no repeated source title or blank-policy selector",()=>{
  const ui=read("apps/admin/app/catalogue-import-preview.tsx");
  const css=read("apps/admin/app/import-preview.css");
  assert.ok(ui.includes('<span title={col.header||undefined}>Cột {col.index}</span>'));
  assert.equal(ui.split('<select aria-label={"Thuộc tính cột "').length-1,1);
  assert.doesNotMatch(ui,/catalogue-blank-policy|changeBlankPolicy|clearApproved/);
  assert.ok(!css.includes(".catalogue-blank-policy"));
  assert.ok(ui.includes('mappedPreviewFields=mapping.slice(1)'));
  assert.ok(ui.includes('ô trống sẽ xóa dữ liệu cũ'));
});
test("all fields preview, summary of clears and identical preview-to-save binding",()=>{
  const ui=read("apps/admin/app/catalogue-import-preview.tsx");
  const preview=read("apps/admin/app/api/catalogue/preview/route.ts");
  const sync=read("apps/admin/app/api/catalogue/sync/route.ts");
  assert.ok(ui.includes('item.field_states?.find'));
  assert.ok(ui.includes('clearCount>0'));
  assert.ok(ui.includes('Xóa giá trị'));
  assert.ok(!ui.includes('form.append("clearFields"'));
  assert.ok(preview.includes('.update(JSON.stringify(clearFields??null))'));
  assert.ok(sync.includes('.update(JSON.stringify(clearFields??null))'));
  assert.match(sync,/digest!==fingerprint/);
  assert.doesNotMatch(preview,/net_price|source_price_vnd|warehouse_quantity/);
  assert.equal(read("backend/catalogue/sheet-sync.mjs"),read("apps/admin/lib/sheet-sync.mjs"));
});
