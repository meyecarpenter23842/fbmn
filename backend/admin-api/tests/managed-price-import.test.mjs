import test from "node:test";
import assert from "node:assert/strict";
import {handleManagedPriceImport} from "../managed-price-import-service.mjs";
const listId="11111111-1111-4111-8111-111111111111";
const actor={role:"owner",subject:"owner-test"};
function input(rows=[
 {line:2,sku_cong_ty:"0114",amount_vnd:"19900"},
 {line:3,sku_cong_ty:"0115",amount_vnd:"23000"}
]){
 return {list_id:listId,source_document:"BANG_GIA_XAC_MINH.xlsx",
  valid_from:"2027-01-01",valid_until:null,vat_included:false,rows};
}
function fakeDb({existing=[],approval="draft"}={}){
 const calls=[];
 const db=async fn=>fn({query:async(sql,args=[])=>{
  calls.push({sql,args});
  if(sql.includes("FROM fbmn_catalog_private.managed_price_lists WHERE id=$1"))
   return {rowCount:1,rows:[{id:listId,list_code:"BG_MIENTAY",list_name:"Bảng giá miền Tây",
    approval_state:approval,revision:1}]};
  if(sql.includes("FROM fbmn_catalog.skus WHERE sku_cong_ty=ANY"))
   return {rowCount:2,rows:[{sku_cong_ty:"0114",ten_san_pham:"Tập 96 trang"},
    {sku_cong_ty:"0115",ten_san_pham:"Tập 200 trang"}]};
  if(sql.includes("SELECT DISTINCT ON (sku_cong_ty)")){
   const at=args[2],latest=new Map();
   for(const item of existing.filter(x=>x.valid_from<=at)
    .sort((a,b)=>b.valid_from.localeCompare(a.valid_from))){
    if(!latest.has(item.sku_cong_ty))latest.set(item.sku_cong_ty,item);
   }
   return {rowCount:latest.size,rows:[...latest.values()]};
  }
  if(sql.includes("SELECT sku_cong_ty,valid_from::text,valid_until::text")){
   const start=args[2],end=args[3];
   const conflicts=existing.filter(item=>item.approval_state==="approved"&&
    item.valid_from<=(end||"9999-12-31")&&
    (item.valid_until===null||item.valid_until===undefined||item.valid_until>=start));
   return {rowCount:conflicts.length,rows:conflicts.map(x=>({
    sku_cong_ty:x.sku_cong_ty,valid_from:x.valid_from,valid_until:x.valid_until??null}))};
  }
  if(sql.startsWith("INSERT INTO fbmn_catalog_private.managed_price_list_prices")){
   const items=JSON.parse(args[1]);
   return {rowCount:items.length,rows:items.map((item,i)=>({
    id:"00000000-0000-4000-8000-"+String(i+1).padStart(12,"0"),
    sku_cong_ty:item.sku
   }))};
  }
  return {rowCount:0,rows:[]};
 }});
 return {db,calls};
}
async function invoke(action,config,actorValue=actor,db){
 const fixture=db||fakeDb();
 const result=await handleManagedPriceImport({action,input:config,actor:actorValue,db:fixture.db});
 return {status:result.status,payload:await result.json(),calls:fixture.calls,fixture};
}
test("Only Owner can preview or apply custom price-list Excel",async()=>{
 const x=fakeDb();
 for(const action of ["bulk-preview","bulk-apply"]){
  const result=await invoke(action,input(),{role:"pricing",subject:"not-owner"},x);
  assert.equal(result.status,403);
 }
 assert.equal(x.calls.length,0);
});
test("Two-column Excel rows resolve names from SKU master, preview is read-only",async()=>{
 const result=await invoke("bulk-preview",input());
 assert.equal(result.status,200);
 assert.equal(result.payload.data.created,2);
 assert.equal(result.payload.data.invalid,0);
 assert.equal(result.payload.data.changes[0].ten_san_pham,"Tập 96 trang");
 assert.equal(result.payload.data.changes[0].sku_cong_ty,"0114");
 assert.match(result.payload.data.preview_fingerprint,/^[0-9a-f]{64}$/);
 assert.ok(result.calls.every(x=>!x.sql.startsWith("INSERT")&&!x.sql.startsWith("UPDATE")));
});
test("All rows are revalidated and applied atomically with audit trail",async()=>{
 const db=fakeDb();
 const request=input();
 const preview=await invoke("bulk-preview",request,actor,db);
 assert.equal(preview.status,200);
 const apply=await invoke("bulk-apply",{
  ...request,preview_fingerprint:preview.payload.data.preview_fingerprint,
  confirm:"XAC_NHAN_GIA_NHAP"
 },actor,db);
 assert.equal(apply.status,200);
 assert.equal(apply.payload.data.applied,2);
 assert.equal(apply.payload.data.created,2);
 assert.ok(db.calls.some(x=>x.sql==="BEGIN"));
 assert.ok(db.calls.some(x=>x.sql==="COMMIT"));
 assert.ok(db.calls.some(x=>x.sql.includes("managed_price_audit")));
 assert.ok(db.calls.some(x=>x.sql.includes("ON CONFLICT (list_id,sku_cong_ty,valid_from)")));
});
test("Stale preview, invalid SKUs, duplicates and missing VAT cannot save",async()=>{
 const db=fakeDb();
 const request=input();
 const preview=await invoke("bulk-preview",request,actor,db);
 const stale=await invoke("bulk-apply",{
  ...request,rows:[{line:2,sku_cong_ty:"0114",amount_vnd:"20000"}],
  preview_fingerprint:preview.payload.data.preview_fingerprint,confirm:"XAC_NHAN_GIA_NHAP"
 },actor,db);
 assert.equal(stale.status,409);
 assert.equal(stale.payload.error.code,"preview_stale");
 const duplicate=await invoke("bulk-preview",input([
  {line:2,sku_cong_ty:"0114",amount_vnd:"12000"},
  {line:3,sku_cong_ty:"0114",amount_vnd:"12500"}
 ]));
 assert.equal(duplicate.payload.data.invalid,1);
 assert.equal(duplicate.payload.data.changes[1].issue,"duplicate_sku");
 const missingVat=await invoke("bulk-preview",{
  ...input(),vat_included:null
 });
 assert.equal(missingVat.payload.data.invalid,2);
 assert.equal(missingVat.payload.data.changes[0].issue,"vat_required");
});
test("Approved SKU prices cannot be silently overwritten; no fake UAT amounts saved",async()=>{
 const old=[{id:"some-id",sku_cong_ty:"0114",amount_vnd:"15000",
  vat_included:false,revision:1,approval_state:"approved",valid_from:"2027-01-01"}];
 const p=await invoke("bulk-preview",input(),actor,fakeDb({existing:old}));
 assert.equal(p.payload.data.changes[0].issue,"approved_price_locked");
 const fake=await invoke("bulk-apply",{
  ...input(),source_document:"TEST_KHONG_AP_DUNG.xlsx",
  preview_fingerprint:"a".repeat(64),confirm:"XAC_NHAN_GIA_NHAP"
 });
 assert.equal(fake.status,409);
 assert.equal(fake.payload.error.code,"test_file_preview_only");
});

test("new dated price is allowed after a past approved price expires",async()=>{
 const old=[{id:"old-approved",sku_cong_ty:"0114",amount_vnd:"15000",
  vat_included:false,revision:1,approval_state:"approved",valid_from:"2026-01-01",
  valid_until:"2026-12-31"}];
 const preview=await invoke("bulk-preview",input([
  {line:2,sku_cong_ty:"0114",amount_vnd:"18000"}
 ]),actor,fakeDb({existing:old}));
 assert.equal(preview.status,200);
 assert.equal(preview.payload.data.invalid,0);
 assert.equal(preview.payload.data.created,1);
 assert.equal(preview.payload.data.changes[0].old_amount_vnd,"15000");
});

test("reimporting an existing period preserves its SKU expiry, not the parent expiry",async()=>{
 const existing=[
  {id:"january-draft",sku_cong_ty:"0114",amount_vnd:"15000",vat_included:false,
   revision:1,approval_state:"draft",valid_from:"2027-01-01",valid_until:"2027-06-30"},
  {id:"july-approved",sku_cong_ty:"0114",amount_vnd:"19000",vat_included:false,
   revision:1,approval_state:"approved",valid_from:"2027-07-01",valid_until:null}
 ];
 const db=fakeDb({existing});
 const data=input([{line:2,sku_cong_ty:"0114",amount_vnd:"16000"}]);
 const preview=await invoke("bulk-preview",data,actor,db);
 assert.equal(preview.status,200);
 assert.equal(preview.payload.data.invalid,0);
 assert.equal(preview.payload.data.updated,1);
 assert.equal(preview.payload.data.changes[0].valid_until,"2027-06-30");
 const saved=await invoke("bulk-apply",{...data,
  preview_fingerprint:preview.payload.data.preview_fingerprint,
  confirm:"XAC_NHAN_GIA_NHAP"},actor,db);
 assert.equal(saved.status,200);
 const sql=db.calls.find(x=>x.sql.startsWith("INSERT INTO fbmn_catalog_private.managed_price_list_prices"));
 assert.equal(JSON.parse(sql.args[1])[0].until_date,"2027-06-30");
 const audit=db.calls.find(x=>x.sql.startsWith("INSERT INTO fbmn_catalog_private.managed_price_audit"));
 assert.equal(JSON.parse(audit.args[2])[0].new_value.valid_until,"2027-06-30");
});
