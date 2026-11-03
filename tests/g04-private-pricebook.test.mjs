import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createAdminApi} from "../backend/admin-api/handler.mjs";
import {handlePricebook} from "../backend/admin-api/pricebook-service.mjs";

const sku="0114";
const id="10000000-0000-0000-0000-000000000001";
const owner={role:"owner",enabled:true,subject:"owner-subject"};
const pricing={role:"pricing",enabled:true,subject:"pricing-subject"};
const make=(path,method="GET",body,auth="Bearer example")=>new Request("https://staging.example.test"+path,{
  method,headers:{Authorization:auth,...(body?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
});
const sample={sku_cong_ty:sku,price_kind:"net_internal",customer_id:null,
  amount_vnd:0,currency:"VND",vat_included:false,vat_rate_bps:800,
  source_document:"Bảng giá gốc có chứng từ",effective_from:"2026-11-03",
  effective_until:null,confirm:"LUU_GIA_NHAP"};
function fakeDb({conflict=false}={}){
 const queries=[];
 const db=async work=>work({query:async(sql,args=[])=>{
   queries.push({sql,args});
   if(sql.startsWith("SELECT id::text AS id,sku_cong_ty")){
     return {rowCount:1,rows:[{id,sku_cong_ty:sku,price_kind:"source",
       amount_vnd:"0",currency:"VND",vat_included:false,source_document:"SOURCE",
       approval_state:"draft",revision:1}]};
   }
   if(sql.startsWith("INSERT INTO fbmn_catalog_private.pricebook_entries"))
     return {rowCount:1,rows:[{id,revision:1,approval_state:"draft"}]};
   if(sql.startsWith("UPDATE fbmn_catalog_private.pricebook_entries"))
     return conflict?{rowCount:0,rows:[]}:{rowCount:1,rows:[{id,revision:2,approval_state:"draft"}]};
   return {rowCount:0,rows:[]};
 }});
 return {db,queries};
}
function api(role,db){
 return createAdminApi({
  allowedOrigins:[],verifyToken:async()=>role.subject,
  loadActor:async()=>role,
  listChannels:async()=>[],recordAudit:async()=>{},catalogueDb:db});
}
test("G04 blocks anonymous and generic catalogue roles before private database query",async()=>{
 const f=fakeDb();
 assert.equal((await api(owner,f.db).fetch(make("/v1/admin/pricing/entries?sku=0114","GET",null,""))).status,401);
 for(const role of ["viewer","editor","publisher"]){
   assert.equal((await api({...owner,role},f.db).fetch(make("/v1/admin/pricing/entries?sku=0114"))).status,403);
 }
 assert.equal(f.queries.length,0);
 assert.equal((await api(owner,f.db).fetch(make("/v1/public/pricing/entries?sku=0114"))).status,404);
 assert.equal(f.queries.length,0);
});
test("G04 private lookup never returns missing SKU as zero VND and filters account scope by SQL",async()=>{
 const f=fakeDb();
 const res=await api(pricing,f.db).fetch(make("/v1/admin/pricing/entries?sku=0114"));
 assert.equal(res.status,200);
 assert.equal(res.headers.get("Cache-Control"),"private, no-store");
 const query=f.queries.find(q=>q.sql.startsWith("SELECT id::text AS id,sku_cong_ty"));
 assert.match(query.sql,/price_kind<>'dealer_contract' OR \$2::boolean/);
 assert.deepEqual(query.args,[sku,false]);
 assert.equal((await res.json()).data.entries[0].amount_vnd,"0");
 const o=fakeDb();
 await api(owner,o.db).fetch(make("/v1/admin/pricing/entries?sku=0114"));
 assert.deepEqual(o.queries.find(q=>q.sql.startsWith("SELECT id::text AS id,sku_cong_ty")).args,[sku,true]);
 for(const bad of ["/v1/admin/pricing/entries","/v1/admin/pricing/entries?sku=0114&customer=other",
   "/v1/admin/pricing/entries?sku=0114&sku=0115"]){
   assert.equal((await api(owner,f.db).fetch(make(bad))).status,400);
 }
 const empty=await handlePricebook({request:make("/v1/admin/pricing/entries?sku=0114"),
   actor:pricing,db:async f=>f({query:async()=>({rows:[]})})});
 assert.equal((await empty.json()).data.empty,true);
});
test("G04 Owner creates only explicit draft source/NET/retail/contract prices, no publish",async()=>{
 const f=fakeDb();
 assert.equal((await api(pricing,f.db).fetch(make("/v1/admin/pricing/entries","POST",sample))).status,403);
 assert.equal(f.queries.length,0);
 const res=await api(owner,f.db).fetch(make("/v1/admin/pricing/entries","POST",sample));
 assert.equal(res.status,201);
 assert.equal((await res.json()).data.approval_state,"draft");
 const insert=f.queries.find(q=>q.sql.startsWith("INSERT INTO fbmn_catalog_private.pricebook_entries"));
 assert.deepEqual(insert.args,[sku,"net_internal",null,0,false,800,sample.source_document,"2026-11-03",null,owner.subject]);
 assert.ok(f.queries.some(q=>q.sql.startsWith("INSERT INTO fbmn_catalog_private.pricebook_audit")));
 assert.ok(f.queries.some(q=>q.sql==="COMMIT"));
 assert.ok(f.queries.every(q=>!/futurebook.sku_prices|UPDATE fbmn_catalog.skus|fbmn_public/.test(q.sql)));
});
test("G04 reject unsupported currencies, VAT ambiguity, fabricated source and cross-account scope",async()=>{
 for(const patch of [
  {currency:"USD"},{source_document:""},{vat_included:null},{amount_vnd:-1},
  {amount_vnd:"0"},{vat_rate_bps:12000},{price_kind:"dealer_contract",customer_id:null},
  {price_kind:"retail_public",customer_id:id},{effective_until:"2020-01-01"},
  {effective_from:"2026-02-30"},{confirm:"AUTO_PUBLISH"}
 ]){
   const f=fakeDb();
   const result=await handlePricebook({request:make("/v1/admin/pricing/entries","POST",{...sample,...patch}),
     actor:owner,db:f.db});
   assert.equal(result.status,400,JSON.stringify(patch));
   assert.equal(f.queries.length,0);
 }
 const f=fakeDb();
 const dealer={...sample,price_kind:"dealer_contract",customer_id:id};
 const yes=await handlePricebook({request:make("/v1/admin/pricing/entries","POST",dealer),actor:owner,db:f.db});
 assert.equal(yes.status,201);
});
test("G04 revision-locked updates do not silently replace price or change price scope",async()=>{
 const input={id,expected_revision:1,amount_vnd:12500,vat_included:true,
   vat_rate_bps:800,source_document:"Số liệu đã kiểm tra",effective_until:null,
   confirm:"CAP_NHAT_GIA_NHAP"};
 const f=fakeDb();
 const ok=await handlePricebook({request:make("/v1/admin/pricing/entries","PATCH",input),actor:owner,db:f.db});
 assert.equal(ok.status,200);
 const update=f.queries.find(q=>q.sql.startsWith("UPDATE fbmn_catalog_private.pricebook_entries"));
 assert.match(update.sql,/WHERE id=\$7 AND revision=\$8 AND approval_state='draft'/);
 assert.deepEqual(update.args.slice(-2),[id,1]);
 assert.doesNotMatch(update.sql,/SET (sku_cong_ty|customer_id|price_kind|currency)=/);
 assert.ok(f.queries.some(q=>q.sql==="COMMIT"));
 const stale=fakeDb({conflict:true});
 assert.equal((await handlePricebook({request:make("/v1/admin/pricing/entries","PATCH",input),actor:owner,db:stale.db})).status,409);
 assert.ok(stale.queries.some(q=>q.sql==="ROLLBACK"));
});
test("G04 migrations are private, draft-only, preserve legacy price rows and enforce explicit scopes",()=>{
 const up=readFileSync(new URL("../backend/neon/migrations/20261103_g04_pricebook.up.sql",import.meta.url),"utf8");
 const down=readFileSync(new URL("../backend/neon/migrations/20261103_g04_pricebook.down.sql",import.meta.url),"utf8");
 assert.match(up,/CREATE TABLE fbmn_catalog_private.pricebook_entries/);
 assert.match(up,/ALTER TABLE fbmn_admin.audit_events DROP CONSTRAINT audit_events_action_check/);
 assert.match(up,/'catalogue.manage','pricing.private'/);
 assert.match(down,/ROLLBACK refused|rollback refused/);
 assert.match(down,/ALTER TABLE fbmn_admin.audit_events ADD CONSTRAINT audit_events_action_check/);
 assert.match(up,/approval_state text NOT NULL DEFAULT 'draft' CHECK \(approval_state = 'draft'\)/);
 assert.match(up,/CHECK \(\(price_kind = 'dealer_contract'\) = \(customer_id IS NOT NULL\)\)/);
 assert.match(up,/g04_pricebook_non_dealer_unique/);
 assert.match(up,/GRANT SELECT,INSERT,UPDATE \(amount_vnd/);
 assert.doesNotMatch(up,/GRANT .*fbmn_public_reader|GRANT .*fbmn_admin_runtime|INSERT INTO .*pricebook_entries|UPDATE futurebook.sku_prices/);
 assert.doesNotMatch(down,/DROP TABLE fbmn_catalog.skus|DROP TABLE futurebook.sku_prices/);
});
