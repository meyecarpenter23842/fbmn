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
test("blank mapped fields default to KEEP, while same values are distinguished from unmapped",async()=>{
  const parsed=await readXlsxSkuRows(await file());
  const p=planSheetSync(parsed,[original()],categories,{
    mappedFields:["ten_san_pham","barcode","paper_size","pages","ruling",
      "category_label","gsm","cover_type","unit","packaging","units_per_pack"],
    clearFields:[]});
  assert.equal(p.totals.unchanged,1);
  assert.equal(p.operations.length,0);
  assert.equal(p.items[0].field_states.length,11);
  assert.equal(p.items[0].field_states.find(x=>x.key==="barcode").action,"keep");
  assert.equal(p.items[0].field_states.find(x=>x.key==="gsm").action,"same");
  const minimal=planSheetSync(parsed,[original()],categories,{mappedFields:["gsm"]});
  assert.equal(minimal.items[0].field_states.find(x=>x.key==="barcode").action,"ignore");
});
test("explicit blank policy clears only chosen optional fields with old-to-null diffs",async()=>{
  const parsed=await readXlsxSkuRows(await file());
  const p=planSheetSync(parsed,[original()],categories,{
    mappedFields:["barcode","paper_size","cover_type","packaging","category_label"],
    clearFields:["barcode","cover_type","category_label"]});
  assert.deepEqual(p.totals,{create:0,update:1,unchanged:0,conflict:0,error:0});
  assert.deepEqual(p.operations[0].changes,{
    barcode:null,product_spec:{cover_type:null},category_id:null
  });
  assert.equal(p.operations[0].expected_revision,4);
  const states=p.items[0].field_states;
  assert.equal(states.find(x=>x.key==="barcode").action,"clear");
  assert.equal(states.find(x=>x.key==="cover_type").action,"clear");
  assert.equal(states.find(x=>x.key==="category_label").action,"clear");
  assert.equal(states.find(x=>x.key==="paper_size").action,"keep");
  assert.equal(states.find(x=>x.key==="pages").action,"ignore");
  assert.deepEqual(p.items[0].diffs.map(x=>x.action),["clear","clear","clear"]);
  assert.doesNotMatch(JSON.stringify(p.operations),/0899988000|legacy_custom|net_price/);
});
test("clear configuration is allowlisted, cannot target title or unmapped SKU field",async()=>{
  const parsed=await readXlsxSkuRows(await file());
  for(const clearFields of [["ten_san_pham"],["sku_cong_ty"],["NET"],["barcode","barcode"]])
    assert.throws(()=>planSheetSync(parsed,[original()],categories,{clearFields}),/invalid_clear_fields/);
  assert.throws(()=>planSheetSync(parsed,[original()],categories,{
    clearFields:["barcode"],mappedFields:["gsm"]}),/invalid_clear_fields/);
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
  assert.ok(ui.includes('field.key==="title"?"ten_san_pham":field.key'));
  assert.ok(ui.includes('action==="create"?"Dữ liệu mới"'));
});
test("full 11-field preview, delete acknowledgement and identical preview/save fingerprint",()=>{
  const ui=read("apps/admin/app/catalogue-import-preview.tsx");
  const preview=read("apps/admin/app/api/catalogue/preview/route.ts");
  const sync=read("apps/admin/app/api/catalogue/sync/route.ts");
  const worker=read("backend/admin-api/catalogue-service.mjs");
  assert.match(ui,/Giữ dữ liệu cũ \(mặc định\)/);
  assert.match(ui,/Xóa dữ liệu cũ khi trống/);
  assert.match(ui,/mapping\[i\]==="title"/);
  assert.match(ui,/clearCount===0\|\|clearApproved/);
  assert.match(ui,/Nhóm \{Math\.min\(fieldPage\+1,fieldPages\)\}/);
  assert.match(ui,/item\.field_states\?\.find/);
  assert.match(ui,/Xóa giá trị/);
  assert.equal((ui.match(/form\.append\("clearFields",JSON\.stringify\(clearOnBlank\)\)/g)||[]).length,2);
  assert.match(preview,/\.update\(JSON\.stringify\(clearFields\)\)/);
  assert.match(sync,/\.update\(JSON\.stringify\(clearFields\)\)/);
  assert.match(sync,/digest!==fingerprint/);
  assert.match(worker,/value===null\)continue/);
  assert.doesNotMatch(preview,/net_price|source_price_vnd|warehouse_quantity/);
  assert.equal(read("backend/catalogue/sheet-sync.mjs"),read("apps/admin/lib/sheet-sync.mjs"));
});
