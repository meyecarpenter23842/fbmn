import test from "node:test";
import assert from "node:assert/strict";
import {safeDraft,handleCatalogue} from "../catalogue-service.mjs";
const url="https://admin.example.test/v1/admin/catalogue/";
const owner={role:"owner",subject:"owner-test"};
function request(path,method="GET",body){
  return new Request(url+path,{method,
    ...(body?{headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:{})});
}
function memoryDb(existing=[]){
  const queries=[];
  const db=async work=>work({query:async(sql,args=[])=>{
    queries.push({sql,args});
    if(sql.startsWith("SELECT sku_cong_ty FROM fbmn_catalog"))return {rows:existing,rowCount:existing.length};
    if(sql.includes("RETURNING sku_cong_ty")&&sql.startsWith("INSERT")){
      const rows=JSON.parse(args[0]);
      return {rows:rows.map(x=>({sku_cong_ty:x.sku_cong_ty})),rowCount:rows.length};
    }
    if(sql.includes("ORDER BY s.sku_cong_ty"))return {rows:existing,rowCount:existing.length};
    if(sql.includes("RETURNING id::text"))return {rows:[{id:"00000000-0000-0000-0000-000000000001",
      family_label:"Tập A5"}],rowCount:1};
    if(sql.startsWith("SELECT id FROM fbmn_catalog.families"))return {rows:[{id:args[0]}],rowCount:1};
    if(sql.startsWith("UPDATE")) {
      if(sql.includes("BTRIM(ten_goc_xnt)") && !String(args[2]||"").trim() &&
        !existing.some(x=>x.sku_cong_ty===args[0] && (x.ten_goc_xnt?.trim()||x.ten_goc_bang_gia?.trim())))
        return {rows:[],rowCount:0};
      return {rows:[{sku_cong_ty:args[0],revision:2}],rowCount:args[1]?.length||1};
    }
    return {rows:[],rowCount:0};
  }});
  return {db,queries};
}
test("Exact SKU text and missing price/image are allowed; numeric SKU forbidden",()=>{
  const row=safeDraft({sku_cong_ty:"0114",ten_san_pham:"Tập Futurebook",warnings:["image_missing"]});
  assert.equal(row.sku_cong_ty,"0114");
  assert.equal(row.review_status,"draft");
  assert.equal(safeDraft({sku_cong_ty:"C5921",ten_goc_xnt:"Sổ"}).sku_cong_ty,"C5921");
  assert.throws(()=>safeDraft({sku_cong_ty:114,ten_san_pham:"No"}),/invalid_sku/);
  assert.throws(()=>safeDraft({sku_cong_ty:" 0114",ten_san_pham:"No"}),/invalid_sku/);
});
test("Only Owner can confirm batch; inserts exactly as text and never publishes",async()=>{
  const a=memoryDb();
  const payload={confirm:"NHAP_BAN_NHAP",expectedCreate:2,rows:[
    {sku_cong_ty:"0114",ten_san_pham:"Tập A",warnings:["image_missing"]},
    {sku_cong_ty:"114",ten_san_pham:"Tập B",warnings:["similar_sku_review"]},
  ]};
  const forbidden=await handleCatalogue({request:request("apply","POST",payload),
    actor:{role:"editor",subject:"editor"},db:a.db});
  assert.equal(forbidden.status,403);
  const ok=await handleCatalogue({request:request("apply","POST",payload),actor:owner,db:a.db});
  assert.equal(ok.status,201);
  const body=await ok.json();
  assert.deepEqual(body.data,{drafts_saved:2,published:0});
  const insert=a.queries.find(x=>x.sql.startsWith("INSERT INTO fbmn_catalog.skus"));
  assert.deepEqual(JSON.parse(insert.args[0]).map(x=>x.sku_cong_ty),["0114","114"]);
  assert.deepEqual(JSON.parse(insert.args[0]).map(x=>x.review_status),["draft","needs_review"]);
  assert.ok(!JSON.stringify(a.queries).includes("net_price"));
  assert.ok(!JSON.stringify(a.queries).includes("source_price_vnd"));
  assert.ok(a.queries.some(x=>x.sql==="COMMIT"));
});
test("Existing SKU blocks entire batch, no partial insert and rollbacks",async()=>{
  const a=memoryDb([{sku_cong_ty:"0114"}]);
  const resp=await handleCatalogue({request:request("apply","POST",{
    confirm:"NHAP_BAN_NHAP",expectedCreate:1,rows:[{sku_cong_ty:"0114",ten_san_pham:"Có"}]
  }),actor:owner,db:a.db});
  assert.equal(resp.status,409);
  assert.ok(a.queries.some(x=>x.sql==="ROLLBACK"));
  assert.ok(!a.queries.some(x=>x.sql.startsWith("INSERT INTO fbmn_catalog.skus")));
});
test("No confirmation, duplicate, casefold duplicate or guessed SKU",async()=>{
  const a=memoryDb();
  const bad=await handleCatalogue({request:request("apply","POST",{
    expectedCreate:1,rows:[{sku_cong_ty:"0114",ten_san_pham:"Có"}]
  }),actor:owner,db:a.db});
  assert.equal(bad.status,400);
  const dup=await handleCatalogue({request:request("apply","POST",{
    confirm:"NHAP_BAN_NHAP",expectedCreate:2,rows:[
      {sku_cong_ty:"ABC",ten_san_pham:"Tên"},
      {sku_cong_ty:"abc",ten_san_pham:"Tên"}]
  }),actor:owner,db:a.db});
  assert.equal(dup.status,409);
  assert.equal(a.queries.length,0);
});
test("Manual family grouping needs Owner and exact list, never rekeys SKUs",async()=>{
  const a=memoryDb();
  const payload={family_id:"00000000-0000-0000-0000-000000000001",sku_cong_ty:["0114","0714"]};
  const role=await handleCatalogue({request:request("group","POST",payload),
    actor:{role:"admin",subject:"admin"},db:a.db});
  assert.equal(role.status,403);
  const ok=await handleCatalogue({request:request("group","POST",payload),actor:owner,db:a.db});
  assert.equal(ok.status,200);
  const changed=a.queries.find(q=>q.sql.startsWith("UPDATE fbmn_catalog.skus"));
  assert.deepEqual(changed.args[1],["0114","0714"]);
  assert.equal((await ok.json()).data.published,0);
});

test("Spreadsheet source names with line breaks are valid for the same Owner preview contract",()=>{
  const row=safeDraft({sku_cong_ty:"0114",ten_goc_xnt:"Tập 200 trang\nkhổ A5",
    ten_san_pham:"Futurebook\nmẫu mới"});
  assert.equal(row.sku_cong_ty,"0114");
  assert.equal(row.ten_san_pham,"Futurebook\nmẫu mới");
});
test("Server must reject an attempt to erase a draft's only valid product name",async()=>{
  const a=memoryDb();
  const response=await handleCatalogue({request:request("skus","PATCH",{
    sku_cong_ty:"0114",expected_revision:1,ten_san_pham:"",review_status:"draft"
  }),actor:owner,db:a.db});
  assert.equal(response.status,409);
  assert.ok(a.queries.some(x=>x.sql.includes("BTRIM(ten_goc_xnt)")));
  assert.ok(a.queries.some(x=>x.sql==="ROLLBACK"));
});
test("Source-only draft allows review-status edit without inventing standardized title",async()=>{
  const a=memoryDb([{sku_cong_ty:"0114",ten_goc_xnt:"Tên nguồn gốc"}]);
  const response=await handleCatalogue({request:request("skus","PATCH",{
    sku_cong_ty:"0114",expected_revision:1,ten_san_pham:"",review_status:"needs_review"
  }),actor:owner,db:a.db});
  assert.equal(response.status,200);
  assert.equal((await response.json()).data.sku_cong_ty,"0114");
});

