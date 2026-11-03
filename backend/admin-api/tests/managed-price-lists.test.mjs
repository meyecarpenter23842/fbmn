import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleManagedPriceLists} from "../managed-price-lists-service.mjs";

const root="https://admin.example.test/v1/admin/pricing/managed";
const actor={role:"owner",subject:"owner-fixture"};
const base={list_code:"MIEN_TAY_2027",list_name:"Giá đại lý miền Tây",note:"",
 audience:"dealer",channel_codes:["dealer_app"],scope_customer_type:"dealer",
 scope_customer_id:null,priority:100,valid_from:"2027-01-01",valid_until:null};
function request(path="",method="GET",input){
 return new Request(root+path,{method,
  ...(method==="POST"?{headers:{"Content-Type":"application/json"},body:JSON.stringify(input)}:{})});
}
function mock(initial=[]){
 const queries=[];
 const db=async(fn)=>fn({query:async(sql,args=[])=>{
  queries.push({sql,args});
  if(sql.includes("FROM futurebook.customers WHERE id="))
   return {rowCount:1,rows:[{id:args[0]}]};
  if(sql.startsWith("INSERT INTO fbmn_catalog_private.managed_price_lists "))
   return {rowCount:1,rows:[{id:"10000000-0000-4000-8000-000000000001",
    list_code:args[0],list_name:args[1],revision:1,approval_state:"draft"}]};
  if(sql.startsWith("SELECT * FROM fbmn_catalog_private.managed_price_lists "))
   return {rowCount:initial.length,rows:initial};
  if(sql.startsWith("SELECT approval_state,revision FROM fbmn_catalog_private.managed_price_lists"))
   return {rowCount:1,rows:[{approval_state:"draft",revision:1}]};
  if(sql.startsWith("SELECT sku_cong_ty FROM fbmn_catalog.skus"))
   return {rowCount:1,rows:[{sku_cong_ty:args[0]}]};
  if(sql.startsWith("SELECT * FROM fbmn_catalog_private.managed_price_list_prices "))
   return {rowCount:0,rows:[]};
  if(sql.startsWith("INSERT INTO fbmn_catalog_private.managed_price_list_prices "))
   return {rowCount:1,rows:[{id:"20000000-0000-4000-8000-000000000002",list_id:args[0],
    sku_cong_ty:args[1],amount_vnd:args[2],approval_state:"draft",revision:1}]};
  return {rowCount:0,rows:[]};
 }});
 return {db,queries};
}
test("owner boundary prevents any private list or customer data from non-owner roles",async()=>{
 const a=mock();
 for(const role of ["viewer","pricing","admin","editor"]){
  for(const path of ["","/customers?q=test","/prices?list_id=10000000-0000-4000-8000-000000000001"]){
   const response=await handleManagedPriceLists({request:request(path),actor:{role,subject:"other"},db:a.db});
   assert.equal(response.status,403);
  }
  const create=await handleManagedPriceLists({request:request("/create","POST",base),
   actor:{role,subject:"other"},db:a.db});
  assert.equal(create.status,403);
 }
 assert.equal(a.queries.length,0);
});
test("user-defined code and name, not any of four hardcoded pricing kinds",async()=>{
 const a=mock();
 const response=await handleManagedPriceLists({request:request("/create","POST",base),actor,db:a.db});
 assert.equal(response.status,200);
 const data=(await response.json()).data;
 assert.equal(data.list_code,"MIEN_TAY_2027");
 assert.equal(data.approval_state,"draft");
 assert.ok(a.queries.some(x=>x.sql.includes("INSERT INTO fbmn_catalog_private.managed_price_audit")));
 assert.ok(a.queries.some(x=>x.sql==="COMMIT"));
 assert.equal(a.queries.find(x=>x.sql.includes("INSERT INTO fbmn_catalog_private.managed_price_lists ")).args[4][0],"dealer_app");
});
test("reject unassigned consumer list and mixed NET/dealer-to-public scope",async()=>{
 const a=mock();
 const illegal=[
  {...base,list_code:"",audience:"consumer",channel_codes:["public_web"]},
  {...base,audience:"dealer",channel_codes:["public_web"]},
  {...base,audience:"consumer",channel_codes:["public_web"],scope_customer_type:"dealer"},
  {...base,audience:"internal",channel_codes:["public_web"],scope_customer_type:null},
  {...base,audience:"consumer",channel_codes:[],scope_customer_type:null},
  {...base,channel_codes:["dealer_app","dealer_app"]},
  {...base,scope_customer_type:"dealer",scope_customer_id:"10000000-0000-4000-8000-000000000001"},
 ];
 for(const input of illegal){
  const response=await handleManagedPriceLists({request:request("/create","POST",input),actor,db:a.db});
  assert.equal(response.status,400,JSON.stringify(input));
 }
 assert.equal(a.queries.length,0);
});
test("minimal SKU draft requires a real VND amount, explicit VAT and source",async()=>{
 const a=mock();
 const input={list_id:"10000000-0000-4000-8000-000000000001",
  expected_list_revision:1,sku_cong_ty:"0114",amount_vnd:"12000",vat_included:false,source_document:"Company price source",
  valid_from:"2027-01-01",valid_until:null};
 for(const invalid of [
  {...input,amount_vnd:"-12000"}, {...input,vat_included:null},
  {...input,source_document:""}, {...input,sku_cong_ty:""},
 ]){
  const response=await handleManagedPriceLists({request:request("/price","POST",invalid),actor,db:a.db});
  assert.equal(response.status,400);
 }
 assert.equal(a.queries.length,0);
 const saved=await handleManagedPriceLists({request:request("/price","POST",input),actor,db:a.db});
 assert.equal(saved.status,200);
 assert.equal((await saved.json()).data.approval_state,"draft");
 assert.ok(a.queries.some(x=>x.sql.includes("managed_price_audit")));
 assert.ok(a.queries.some(x=>x.sql==="COMMIT"));
});
test("production read paths remain isolated; immutable code and value audit retained",()=>{
 const handler=readFileSync(new URL("../handler.mjs",import.meta.url),"utf8");
 const service=readFileSync(new URL("../managed-price-lists-service.mjs",import.meta.url),"utf8");
 assert.match(handler,/handleManagedPriceLists/);
 assert.match(service,/actor\?\.role!=="owner"/);
 assert.match(service,/approval_state='approved'/);
 assert.match(service,/revision_conflict/);
 assert.doesNotMatch(service,/UPDATE[^;]*list_code=/);
 assert.doesNotMatch(handler,/\/v1\/public\/.*managed/);
 const schema=readFileSync(new URL("../../neon/migrations/20261103_admin_l03_managed_price_prices.up.sql",import.meta.url),"utf8");
 assert.match(schema,/REVOKE ALL ON/);
 assert.match(schema,/managed_price_audit/);
 assert.match(schema,/GRANT SELECT,INSERT/);
});

test("Owner-only channel preview matches approved customer/channel price",async()=>{
 const seen=[];
 const listed={list_id:"10000000-0000-4000-8000-000000000001",list_code:"DL_MIEN_TAY",
  list_name:"Giá đại lý miền Tây",priority:300,specificity:3,amount_vnd:"25000",
  vat_included:true,source_document:"Approved source",valid_from:"2027-01-01"};
 const db=async(fn)=>fn({query:async(sql,args=[])=>{
  seen.push({sql,args});
  if(sql.startsWith("SELECT id::text,customer_code,customer_type"))
   return {rowCount:1,rows:[{id:"10000000-0000-4000-8000-000000000003",
    customer_code:"DL-A",customer_type:"dealer"}]};
  if(sql.startsWith("SELECT l.id::text AS list_id"))return {rowCount:1,rows:[listed]};
  return {rowCount:0,rows:[]};
 }});
 const res=await handleManagedPriceLists({request:request("/resolve","POST",{
  sku_cong_ty:"0114",channel_code:"dealer_app",customer_code:"DL-A",
  price_at:"2027-06-01"
 }),actor,db});
 assert.equal(res.status,200);
 const out=(await res.json()).data;
 assert.equal(out.status,"resolved");
 assert.equal(out.matched_list_code,"DL_MIEN_TAY");
 assert.equal(out.amount_vnd,"25000");
 const select=seen.find(x=>x.sql.includes("FROM fbmn_catalog_private.managed_price_lists"));
 assert.match(select.sql,/l.approval_state='approved'/);
 assert.match(select.sql,/p.approval_state='approved'/);
 assert.match(select.sql,/l.scope_customer_id=\$4::uuid/);
 assert.deepEqual(select.args.slice(0,4),["0114","dealer_app","2027-06-01",
  "10000000-0000-4000-8000-000000000003"]);
});
test("channel preview fails closed for missing B2B identity and overlapping priorities",async()=>{
 const a=mock();
 const missing=await handleManagedPriceLists({request:request("/resolve","POST",{
  sku_cong_ty:"0114",channel_code:"dealer_app"
 }),actor,db:a.db});
 assert.equal(missing.status,400);
 assert.equal(a.queries.length,0);
 const candidates=[{specificity:1,priority:100,valid_from:"2027-01-01",list_code:"WEB-A"},
  {specificity:1,priority:100,valid_from:"2027-01-01",list_code:"WEB-B"}];
 const db=async(fn)=>fn({query:async()=>({rowCount:2,rows:candidates})});
 const conflict=await handleManagedPriceLists({request:request("/resolve","POST",{
  sku_cong_ty:"0114",channel_code:"public_web",price_at:"2027-05-01"
 }),actor,db});
 assert.equal((await conflict.json()).data.status,"ambiguous_price");
});

test("Owner may create one unscoped list for Website, consumer App and dealer App",async()=>{
 const a=mock();
 const input={...base,list_code:"BG_DA_KENH",list_name:"Bảng giá áp dụng nhiều kênh",
  audience:"mixed",channel_codes:["public_web","consumer_app","dealer_app"],
  scope_customer_type:null,scope_customer_id:null};
 const created=await handleManagedPriceLists({
  request:request("/create","POST",input),actor,db:a.db
 });
 assert.equal(created.status,200);
 const sql=a.queries.find(x=>x.sql.startsWith("INSERT INTO fbmn_catalog_private.managed_price_lists "));
 assert.equal(sql.args[3],"mixed");
 assert.deepEqual(sql.args[4],["public_web","consumer_app","dealer_app"]);
 assert.equal(sql.args[5],null);
 assert.ok(a.queries.some(x=>x.sql.includes("managed_price_audit")));
});
test("mixed channel price list never accepts private customer scope",async()=>{
 const a=mock();
 for(const leak of [
  {...base,audience:"mixed",channel_codes:["public_web","dealer_app"],
    scope_customer_type:"dealer",scope_customer_id:null},
  {...base,audience:"mixed",channel_codes:["consumer_app","dealer_app"],
    scope_customer_type:null,scope_customer_id:"10000000-0000-4000-8000-000000000001"},
  {...base,audience:"mixed",channel_codes:["public_web"],
    scope_customer_type:null,scope_customer_id:null}
 ]){
  const answer=await handleManagedPriceLists({request:request("/create","POST",leak),actor,db:a.db});
  assert.equal(answer.status,400,JSON.stringify(leak));
 }
 assert.equal(a.queries.length,0);
});

test("Owner applies all staged SKU prices in one audited transaction, with no SKU approval endpoint",async()=>{
 const prices=[{id:"20000000-0000-4000-8000-000000000002",
  list_id:"10000000-0000-4000-8000-000000000001",
  sku_cong_ty:"0114",approval_state:"draft",revision:1,amount_vnd:12000}];
 const list={...base,id:"10000000-0000-4000-8000-000000000001",
  revision:1,approval_state:"draft",approved_by:null,approved_at:null};
 const seen=[];
 const db=async(fn)=>fn({query:async(sql,args=[])=>{
  seen.push({sql,args});
  if(sql.startsWith("SELECT * FROM fbmn_catalog_private.managed_price_lists WHERE id="))
   return {rowCount:1,rows:[list]};
  if(sql.startsWith("SELECT * FROM fbmn_catalog_private.managed_price_list_prices WHERE list_id="))
   return {rowCount:prices.length,rows:prices};
  if(sql.startsWith("SELECT 1 FROM fbmn_catalog_private.managed_price_list_prices a"))
   return {rowCount:0,rows:[]};
  if(sql.startsWith("UPDATE fbmn_catalog_private.managed_price_list_prices SET"))
   return {rowCount:1,rows:prices.map(p=>({...p,approval_state:"approved",revision:2}))};
  if(sql.startsWith("UPDATE fbmn_catalog_private.managed_price_lists SET"))
   return {rowCount:1,rows:[{...list,approval_state:"approved",revision:2}]};
  return {rowCount:0,rows:[]};
 }});
 const id=list.id;
 const response=await handleManagedPriceLists({
  request:request("/apply","POST",{id,expected_revision:1}),actor,db});
 assert.equal(response.status,200);
 assert.equal((await response.json()).data.approval_state,"approved");
 assert.ok(seen.some(x=>x.sql.includes("managed_price_list_prices SET")));
 assert.ok(seen.some(x=>x.sql.includes("price.apply")));
 assert.ok(seen.some(x=>x.sql==="COMMIT"));
 for(const action of ["approve","price-approve"]){
  const revoked=await handleManagedPriceLists({request:request("/"+action,"POST",{id}),actor,db});
  assert.equal(revoked.status,404);
 }
});
test("Apply cannot activate empty price lists or change private channel scope silently",async()=>{
 const list={...base,id:"10000000-0000-4000-8000-000000000001",revision:1,approval_state:"draft"};
 const seen=[];
 const db=async(fn)=>fn({query:async(sql,args=[])=>{
  seen.push(sql);
  if(sql.startsWith("SELECT * FROM fbmn_catalog_private.managed_price_lists WHERE id="))
   return {rowCount:1,rows:[list]};
  return {rowCount:0,rows:[]};
 }});
 const res=await handleManagedPriceLists({request:request("/apply","POST",{
  id:list.id,expected_revision:1
 }),actor,db});
 assert.equal(res.status,409);
 assert.equal((await res.json()).error.code,"price_required");
 assert.ok(seen.includes("ROLLBACK"));
 assert.ok(!seen.some(sql=>sql.includes("UPDATE fbmn_catalog_private.managed_price_lists")));
 const activeDb=async(fn)=>fn({query:async(sql)=>{
  if(sql.startsWith("SELECT * FROM fbmn_catalog_private.managed_price_lists WHERE id="))
   return {rowCount:1,rows:[{...list,approval_state:"approved"}]};
  return {rowCount:0,rows:[]};
 }});
 const edit=await handleManagedPriceLists({request:request("/update","POST",{
  ...base,id:list.id,expected_revision:1,audience:"consumer",channel_codes:["public_web"],
  scope_customer_type:null
 }),actor,db:activeDb});
 assert.equal(edit.status,409);
 assert.equal((await edit.json()).error.code,"active_scope_locked");
});
test("Owner saving a price inside an applied list stays applied with audit, not publish",async()=>{
 const seen=[],id="10000000-0000-4000-8000-000000000001";
 const db=async(fn)=>fn({query:async(sql,args=[])=>{
  seen.push({sql,args});
  if(sql.startsWith("SELECT approval_state,revision FROM fbmn_catalog_private.managed_price_lists"))
   return {rowCount:1,rows:[{approval_state:"approved",revision:1}]};
  if(sql.startsWith("SELECT sku_cong_ty FROM fbmn_catalog.skus"))
   return {rowCount:1,rows:[{sku_cong_ty:args[0]}]};
  if(sql.startsWith("INSERT INTO fbmn_catalog_private.managed_price_list_prices "))
   return {rowCount:1,rows:[{id:"20000000-0000-4000-8000-000000000002",
    approval_state:args[8],revision:1}]};
  return {rowCount:0,rows:[]};
 }});
 const answer=await handleManagedPriceLists({request:request("/price","POST",{
  list_id:id,expected_list_revision:1,sku_cong_ty:"0114",amount_vnd:"22000",vat_included:false,
  source_document:"Verified real source",valid_from:"2027-01-01",valid_until:null
 }),actor,db});
 assert.equal(answer.status,200);
 assert.equal((await answer.json()).data.approval_state,"approved");
 assert.ok(seen.some(x=>x.sql.includes("managed_price_audit")));
 assert.ok(!seen.some(x=>x.sql.includes("public_web")||x.sql.includes("/public/")));
});

test("stale open price drawer cannot activate a new SKU after another tab applies the list",async()=>{
 const seen=[];
 const db=async(fn)=>fn({query:async(sql,args=[])=>{
  seen.push({sql,args});
  if(sql.startsWith("SELECT approval_state,revision FROM fbmn_catalog_private.managed_price_lists"))
   return {rowCount:1,rows:[{approval_state:"approved",revision:2}]};
  return {rowCount:0,rows:[]};
 }});
 const response=await handleManagedPriceLists({request:request("/price","POST",{
  list_id:"10000000-0000-4000-8000-000000000001",expected_list_revision:1,
  sku_cong_ty:"0114",amount_vnd:"24000",vat_included:true,
  source_document:"Verified only",valid_from:"2027-01-01",valid_until:null
 }),actor,db});
 assert.equal(response.status,409);
 assert.equal((await response.json()).error.code,"revision_conflict");
 assert.ok(seen.some(x=>x.sql==="ROLLBACK"));
 assert.ok(!seen.some(x=>x.sql.startsWith("INSERT INTO fbmn_catalog_private.managed_price_list_prices")));
});
