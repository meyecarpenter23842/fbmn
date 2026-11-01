import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ExcelJS from "exceljs";
import {readXlsxSkuRows} from "../backend/catalogue/xlsx-adapter.mjs";
import {planSheetSync} from "../backend/catalogue/sheet-sync.mjs";
import {handleCatalogue} from "../backend/admin-api/catalogue-service.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const parsed=(rows)=>({source_sheet:"SAN PHAM",rows:rows.map((v,i)=>({
  __row:i+2,sku_cong_ty:v.sku,ten_san_pham:v.title??"",
  barcode:v.barcode??"",paper_size:v.paper_size??"",...(v.error?{__error:v.error}:{})
})),evidence:rows.map(v=>({specifications:{pages:v.pages??null,ruling:v.ruling??null}}))});
const old=(sku,revision=1)=>({sku_cong_ty:sku,revision,review_status:"draft",
  ten_san_pham:"Tập cũ",barcode:"ABC",paper_size:"A5",product_spec:{pages:"100",ruling:"Ngang",gsm:"70"}});
const url="https://admin.example.test/v1/admin/catalogue/";
const owner={role:"owner",subject:"p3-owner"};
const request=(method,body)=>new Request(url+"sync",{method,headers:{"Content-Type":"application/json"},
  body:JSON.stringify(body)});
function memoryDb(opts={}){
  const queries=[];
  const db=async work=>work({query:async(sql,args=[])=>{
    queries.push({sql,args});
    if(sql.startsWith("UPDATE fbmn_catalog.skus s"))
      return {rowCount:opts.updateConflict?0:JSON.parse(args[0]).length,rows:[]};
    if(sql.startsWith("INSERT INTO fbmn_catalog.skus"))
      return {rowCount:opts.createConflict?0:JSON.parse(args[0]).length,rows:[]};
    return {rowCount:0,rows:[]};
  }});
  return {db,queries};
}
test("P3 Excel parser permits blank title for existing SKU but planner rejects nameless new SKU",async()=>{
  const book=new ExcelJS.Workbook(),sheet=book.addWorksheet("SAN PHAM");
  sheet.addRow(["Mã công ty","Tên sản phẩm","Mã vạch","Khổ","Số trang","Dòng kẻ"]);
  sheet.addRow(["0114","","012345","","",""]);
  const parsedExcel=await readXlsxSkuRows(new Uint8Array(await book.xlsx.writeBuffer()));
  assert.equal(parsedExcel.rows[0].__error,undefined);
  const existingPlan=planSheetSync(parsedExcel,[old("0114")]);
  assert.equal(existingPlan.totals.update,1);
  assert.deepEqual(existingPlan.operations[0].changes,{barcode:"012345"});
  const newPlan=planSheetSync(parsedExcel,[]);
  assert.equal(newPlan.totals.error,1);
});
test("P3 mixed sheet preserves 0114 text and generates precise changes only",()=>{
  const plan=planSheetSync(parsed([{sku:"0114",title:"Tập mới",paper_size:"A5",pages:"200"},
    {sku:"0714",title:"Tập bổ sung",barcode:"0123"},
    {sku:"C5921",title:"Tập cũ",paper_size:"A5",barcode:"ABC",pages:"100",ruling:"Ngang"}]),
    [old("0114",3),old("C5921",2)]);
  assert.deepEqual(plan.totals,{create:1,update:1,unchanged:1,conflict:0,error:0});
  assert.equal(plan.operations[0].sku_cong_ty,"0114");
  assert.equal(plan.operations[0].expected_revision,3);
  assert.deepEqual(plan.operations[0].changes,{ten_san_pham:"Tập mới",product_spec:{pages:"200"}});
  assert.equal(plan.operations[1].sku_cong_ty,"0714");
  assert.equal(plan.items[0].diffs.find(x=>x.field==="Số trang").from,"100");
  assert.equal(plan.items[0].diffs.find(x=>x.field==="Số trang").to,"200");
});
test("P3 exporting a source-only title then re-importing it is idempotent",()=>{
  const sourceOnly={...old("0114"),ten_san_pham:null,ten_goc_xnt:"Tập tên gốc"};
  const plan=planSheetSync(parsed([{sku:"0114",title:"Tập tên gốc",paper_size:"A5",
    barcode:"ABC",pages:"100",ruling:"Ngang"}]),[sourceOnly]);
  assert.equal(plan.totals.unchanged,1);
  assert.equal(plan.operations.length,0);
});
test("P3 empty optional Excel cells retain old values, including unknown optional specifications",()=>{
  const plan=planSheetSync(parsed([{sku:"0114",title:"Tập cũ",barcode:"",paper_size:"",pages:"",ruling:""}]),[old("0114")]);
  assert.equal(plan.totals.unchanged,1);
  assert.equal(plan.operations.length,0);
});
test("P3 duplicate SKU, case fold collision, numeric/error SKU and locked records are not saved",()=>{
  const dup=planSheetSync(parsed([{sku:"0114",title:"A"},{sku:"0114",title:"B"}]),[]);
  assert.equal(dup.totals.error,1);
  const locked={...old("C592"),review_status:"approved"};
  assert.equal(planSheetSync(parsed([{sku:"C592",title:"Đổi"}]),[locked]).totals.conflict,1);
  const caseDiff=planSheetSync(parsed([{sku:"c592",title:"Đổi"}]),[old("C592")]);
  assert.equal(caseDiff.totals.conflict,1);
  assert.equal(planSheetSync(parsed([{sku:"",title:"Tập",error:"sku_must_be_literal_text"}]),[]).totals.error,1);
  assert.throws(()=>planSheetSync({source_sheet:"DOI CHIEU 613 SKU",rows:[],evidence:[]},[]),/invalid_sync_input/);
});
test("P3 Owner sync accepts mixed creates+updates in one DB transaction, never publishes",async()=>{
  const a=memoryDb();
  const body={confirm:"SYNC_SAN_PHAM",expectedCreate:1,expectedUpdate:1,operations:[
    {kind:"create",sku_cong_ty:"0714",ten_san_pham:"Tập mới",barcode:"",paper_size:"A5",
      product_spec:{pages:"200",ruling:"Ngang"}},
    {kind:"update",sku_cong_ty:"0114",expected_revision:3,changes:{product_spec:{pages:"200"}}}
  ]};
  const denied=await handleCatalogue({request:request("POST",body),
    actor:{role:"editor",subject:"p3-editor"},db:a.db});
  assert.equal(denied.status,403);
  const accepted=await handleCatalogue({request:request("POST",body),actor:owner,db:a.db});
  assert.equal(accepted.status,201);
  assert.deepEqual((await accepted.json()).data,{created:1,updated:1,published:0});
  const update=a.queries.find(x=>x.sql.startsWith("UPDATE fbmn_catalog.skus s"));
  assert.match(update.sql,/s.revision=x.expected_revision/);
  assert.match(update.sql,/s.product_spec \|\|/);
  assert.equal(JSON.parse(update.args[0])[0].sku_cong_ty,"0114");
  assert.equal(JSON.parse(update.args[0])[0].expected_revision,3);
  assert.ok(a.queries.some(x=>x.sql==="COMMIT"));
  assert.ok(!JSON.stringify(a.queries).includes("net_price"));
});
test("P3 revision mismatch rolls back whole sync with HTTP 409 and zero creates",async()=>{
  const a=memoryDb({updateConflict:true});
  const payload={confirm:"SYNC_SAN_PHAM",expectedCreate:1,expectedUpdate:1,operations:[
    {kind:"update",sku_cong_ty:"0114",expected_revision:1,changes:{barcode:"99"}},
    {kind:"create",sku_cong_ty:"0714",ten_san_pham:"Tập B",product_spec:{}}
  ]};
  const res=await handleCatalogue({request:request("POST",payload),actor:owner,db:a.db});
  assert.equal(res.status,409);
  assert.ok(a.queries.some(x=>x.sql==="ROLLBACK"));
  assert.ok(!a.queries.some(x=>x.sql.startsWith("INSERT INTO fbmn_catalog.skus")));
});
test("P3 rejects forbidden columns, duplicate changes, missing confirmation",async()=>{
  const a=memoryDb();
  const base={kind:"update",sku_cong_ty:"0114",expected_revision:1};
  const bad=await handleCatalogue({request:request("POST",{
    confirm:"SYNC_SAN_PHAM",expectedCreate:0,expectedUpdate:1,
    operations:[{...base,changes:{net_price:"5000"}}]}),actor:owner,db:a.db});
  assert.equal(bad.status,400);
  const dup=await handleCatalogue({request:request("POST",{
    confirm:"SYNC_SAN_PHAM",expectedCreate:0,expectedUpdate:2,
    operations:[{...base,changes:{barcode:"2"}},{...base,changes:{barcode:"3"}}]
  }),actor:owner,db:a.db});
  assert.equal(dup.status,400);
  assert.equal(a.queries.length,0);
});
test("P3 UI uses a single save action and private export, old-to-new details",()=>{
  const importer=read("apps/admin/app/catalogue-import-preview.tsx");
  const manager=read("apps/admin/app/catalogue-manager.tsx");
  const preview=read("apps/admin/app/api/catalogue/preview/route.ts");
  const sync=read("apps/admin/app/api/catalogue/sync/route.ts");
  const exportRoute=read("apps/admin/app/api/catalogue/export/route.ts");
  assert.match(importer,/oneSheet\?"/);
  assert.match(importer,/previewFingerprint/);
  assert.match(importer,/import-diff-table/);
  assert.match(importer,/SYNC_SAN_PHAM/);
  assert.match(importer,/oneSheet&&!window.confirm/);
  assert.match(manager,/exportCatalogue\("xlsx"\)/);
  assert.match(manager,/exportCatalogue\("csv"\)/);
  assert.match(preview,/planSheetSync/);
  assert.match(sync,/digest!==fingerprint/);
  assert.match(sync,/catalogue\/sync/);
  assert.match(exportRoute,/addWorksheet\("SAN PHAM"\)/);
  assert.match(exportRoute,/getColumn\(1\).numFmt="@"/);
  assert.doesNotMatch(exportRoute,/source_price_vnd|net_price|warehouse_quantity/);
  assert.equal(read("backend/catalogue/sheet-sync.mjs"),read("apps/admin/lib/sheet-sync.mjs"));
});
