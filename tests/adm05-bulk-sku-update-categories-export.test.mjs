import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ExcelJS from "exceljs";
import {readXlsxSkuRows} from "../backend/catalogue/xlsx-adapter.mjs";
import {planSheetSync} from "../backend/catalogue/sheet-sync.mjs";
import {handleCatalogue} from "../backend/admin-api/catalogue-service.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const headers=["Mã công ty","Tên sản phẩm","Mã vạch","Khổ","Số trang","Dòng kẻ",
  "Danh mục","Định lượng GSM","Loại bìa","Đơn vị tính","Quy cách đóng gói","Số đơn vị / đóng gói"];
const root="10000000-0000-0000-0000-000000000001";
const leaf="10000000-0000-0000-0000-000000000002";
const categories=[
  {id:root,parent_id:null,category_label:"Tập học sinh"},
  {id:leaf,parent_id:root,category_label:"Tập 4 ô ly"}
];
async function workbook(rows){
  const book=new ExcelJS.Workbook(),sheet=book.addWorksheet("SAN PHAM");
  sheet.addRow(headers);
  sheet.getColumn(1).numFmt="@";
  sheet.getColumn(3).numFmt="@";
  for(const row of rows)sheet.addRow(row);
  return new Uint8Array(await book.xlsx.writeBuffer());
}
const existing=()=>({
  sku_cong_ty:"0114",ten_san_pham:"Tập Futurebook",revision:3,review_status:"draft",
  category_id:null,barcode:"8990000000001",paper_size:"A5",
  product_spec:{pages:"100",ruling:"4 ô ly",gsm:"70",cover_type:"Bìa UV",unit:"quyển",
    packaging:"Lốc",units_per_pack:"10",untouched_legacy:"Bảo toàn"}
});
test("bulk 12-column XLSX imports all specifications and friendly category paths by literal SKU",async()=>{
  const bytes=await workbook([["0114","Tập Futurebook","8990000000001","A5","100","4 ô ly",
    "Tập học sinh / Tập 4 ô ly","80","Bìa UV","quyển","Thùng","12"]]);
  const parsed=await readXlsxSkuRows(bytes);
  assert.equal(parsed.rows[0].sku_cong_ty,"0114");
  assert.equal(parsed.evidence[0].specifications.category_label,"Tập học sinh / Tập 4 ô ly");
  assert.equal(parsed.evidence[0].specifications.gsm,"80");
  const plan=planSheetSync(parsed,[existing()],categories);
  assert.deepEqual(plan.totals,{create:0,update:1,unchanged:0,conflict:0,error:0});
  assert.deepEqual(plan.operations[0].changes,{
    product_spec:{gsm:"80",packaging:"Thùng",units_per_pack:"12"},category_id:leaf
  });
  assert.ok(plan.items[0].diffs.some(v=>v.field==="Danh mục"&&v.to.includes("Tập 4 ô ly")));
  assert.ok(plan.items[0].diffs.some(v=>v.field==="Định lượng GSM"&&v.from==="70"&&v.to==="80"));
  assert.equal(plan.operations[0].expected_revision,3);
  assert.doesNotMatch(JSON.stringify(plan.operations),/untouched_legacy|net_price/);
});
test("empty Excel specification/category cells retain existing values and do not erase other JSONB keys",async()=>{
  const parsed=await readXlsxSkuRows(await workbook([["0114","Tập Futurebook",
    "8990000000001","A5","100","4 ô ly","","","","","",""]]));
  const plan=planSheetSync(parsed,[existing()],categories);
  assert.equal(plan.totals.unchanged,1);
  assert.equal(plan.operations.length,0);
});
test("unknown/ambiguous categories, invalid GSM and pack conversions fail closed",async()=>{
  const invalid=await readXlsxSkuRows(await workbook([["0114","","","","","","Danh mục tự tạo","","","","",""]]));
  assert.equal(planSheetSync(invalid,[existing()],categories).totals.conflict,1);
  const gsm=await readXlsxSkuRows(await workbook([["0114","","","","","","","70g","","","",""]]));
  assert.equal(planSheetSync(gsm,[existing()],categories).totals.error,1);
  const units=await readXlsxSkuRows(await workbook([["0114","","","","","","","","","","","0"]]));
  assert.equal(planSheetSync(units,[existing()],categories).totals.error,1);
  const collision=[...categories,{id:"10000000-0000-0000-0000-000000000003",
    parent_id:null,category_label:"Tập học sinh"}];
  const duplicate=await readXlsxSkuRows(await workbook([["0114","","","","","","Tập học sinh","","","","",""]]));
  assert.equal(planSheetSync(duplicate,[existing()],collision).totals.conflict,1);
});
test("existing six-column import remains backward compatible without requiring extra fields",async()=>{
  const book=new ExcelJS.Workbook(),sheet=book.addWorksheet("SAN PHAM");
  sheet.addRow(headers.slice(0,6));
  sheet.addRow(["0114","","","","",""]);
  const parsed=await readXlsxSkuRows(new Uint8Array(await book.xlsx.writeBuffer()));
  assert.equal(planSheetSync(parsed,[existing()]).totals.unchanged,1);
});
test("category sync is owner-only, validates IDs in transaction, and never publishes/changes company SKU",async()=>{
  const queries=[];
  const db=async fn=>fn({query:async(sql,args=[])=>{
    queries.push({sql,args});
    if(sql.startsWith("SELECT id::text FROM fbmn_catalog.categories"))
      return {rowCount:1,rows:[{id:leaf}]};
    if(sql.startsWith("UPDATE fbmn_catalog.skus s"))
      return {rowCount:1,rows:[{sku_cong_ty:"0114"}]};
    return {rowCount:0,rows:[]};
  }});
  const payload={confirm:"SYNC_SAN_PHAM",expectedCreate:0,expectedUpdate:1,
    operations:[{kind:"update",sku_cong_ty:"0114",expected_revision:3,
      changes:{category_id:leaf,product_spec:{gsm:"80"}}}]};
  const req=()=>new Request("https://admin.example.test/v1/admin/catalogue/sync",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const deny=await handleCatalogue({request:req(),actor:{role:"editor",subject:"someone"},db});
  assert.equal(deny.status,403);
  const response=await handleCatalogue({request:req(),actor:{role:"owner",subject:"owner"},db});
  assert.equal(response.status,201);
  assert.deepEqual((await response.json()).data,{created:0,updated:1,published:0});
  const patch=queries.find(q=>q.sql.startsWith("UPDATE fbmn_catalog.skus s"));
  assert.match(patch.sql,/category_id=CASE WHEN x.changes \? 'category_id'/);
  assert.match(patch.sql,/s.revision=x.expected_revision/);
  assert.equal(JSON.parse(patch.args[0])[0].sku_cong_ty,"0114");
  assert.ok(queries.some(q=>q.sql==="COMMIT"));
});
test("toolbar exposes one Export menu, visible bulk import tabs and 14 editable Excel columns",()=>{
  const manager=read("apps/admin/app/catalogue-manager.tsx");
  const importer=read("apps/admin/app/catalogue-import-preview.tsx");
  const exportRoute=read("apps/admin/app/api/catalogue/export/route.ts");
  const template=read("apps/admin/app/api/catalogue/template/route.ts");
  assert.match(manager,/aria-label="Chọn định dạng xuất"/);
  assert.match(manager,/Xuất Excel \(\.xlsx\)/);
  assert.match(manager,/Xuất CSV \(\.csv\)/);
  assert.match(manager,/Nhập \/ Cập nhật Excel/);
  assert.doesNotMatch(manager,/>Xuất Excel<\/button>/);
  assert.match(importer,/Cập nhật SKU đã có/);
  assert.match(importer,/Nhập mới \/ đồng bộ/);
  assert.match(importer,/mode!=="update"/);
  assert.match(importer,/import-diff-table/);
  assert.match(exportRoute,/Định lượng GSM/);
  assert.match(exportRoute,/pathFor\(row.category_id\)/);
  assert.match(template,/Số đơn vị \/ đóng gói/);
  assert.match(template,/getColumn\(12\).numFmt="@"/);
  assert.match(template,/getColumn\(14\).numFmt="@"/);
  assert.match(exportRoute,/Mã nhóm mẫu/);
  assert.doesNotMatch(exportRoute,/net_price|source_price_vnd|warehouse_quantity/);
  assert.equal(read("backend/catalogue/sheet-sync.mjs"),read("apps/admin/lib/sheet-sync.mjs"));
});

test("NPP-style partial Excel only needs SKU plus one mapped header; unknown rows cannot create nameless SKU",async()=>{
  const book=new ExcelJS.Workbook(),sheet=book.addWorksheet("SAN PHAM");
  sheet.addRow(["Mã công ty","Danh mục","Định lượng GSM"]);
  sheet.addRow(["0114","Tập học sinh / Tập 4 ô ly","80"]);
  const parsed=await readXlsxSkuRows(new Uint8Array(await book.xlsx.writeBuffer()));
  const plan=planSheetSync(parsed,[existing()],categories);
  assert.equal(plan.totals.update,1);
  assert.deepEqual(plan.operations[0].changes,{product_spec:{gsm:"80"},category_id:leaf});
  assert.equal(plan.operations[0].sku_cong_ty,"0114");
  const unknown=planSheetSync(parsed,[],categories);
  assert.equal(unknown.totals.error,1);
});
test("exported long 2-level category path round-trips without a false length conflict",async()=>{
  const a="A".repeat(160),b="B".repeat(160);
  const rootId="20000000-0000-0000-0000-000000000001";
  const childId="20000000-0000-0000-0000-000000000002";
  const cats=[{id:rootId,parent_id:null,category_label:a},
    {id:childId,parent_id:rootId,category_label:b}];
  const book=new ExcelJS.Workbook(),sheet=book.addWorksheet("SAN PHAM");
  sheet.addRow(["Mã công ty","Danh mục"]);
  sheet.addRow(["0114",a+" / "+b]);
  const parsed=await readXlsxSkuRows(new Uint8Array(await book.xlsx.writeBuffer()));
  const plan=planSheetSync(parsed,[existing()],cats);
  assert.equal(plan.totals.update,1);
  assert.equal(plan.operations[0].changes.category_id,childId);
});
