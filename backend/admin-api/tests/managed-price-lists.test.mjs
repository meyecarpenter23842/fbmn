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
  if(sql.startsWith("SELECT approval_state FROM fbmn_catalog_private.managed_price_lists"))
   return {rowCount:1,rows:[{approval_state:"draft"}]};
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
  sku_cong_ty:"0114",amount_vnd:"12000",vat_included:false,source_document:"Company price source",
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
