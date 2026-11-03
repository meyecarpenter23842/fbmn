import test from "node:test";
import assert from "node:assert/strict";
import {handleBulkPricebook} from "../pricebook-bulk-service.mjs";
const owner={role:"owner",subject:"owner-test"};
const endpoint="https://internal.example.test/v1/admin/pricing/";
const base={price_kind:"net_internal",vat_included:false,vat_rate_bps:null,
 source_document:"Internal approved test reference",effective_from:"2026-11-03",
 effective_until:null,customer_id:null};
const row=(sku,amount,line=2)=>({sku_cong_ty:sku,amount_vnd:amount,line});
function request(path,method="POST",body){
 return new Request(endpoint+path,{method,
  ...(body?{headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:{})});
}
function fixture(initial=[]){
 const queries=[];let records=initial,committed=[];
 const db=async callback=>callback({query:async(sql,args=[])=>{
  queries.push({sql,args});
  if(sql.startsWith("SELECT sku_cong_ty,ten_san_pham,ten_goc_xnt"))
   return {rows:args[0].filter(x=>/^\d{4}$/.test(x)).map(sku_cong_ty=>({
    sku_cong_ty,ten_san_pham:"Sản phẩm "+sku_cong_ty,ten_goc_xnt:null,ten_goc_bang_gia:null
   })),rowCount:args[0].length};
  if(sql.includes("FROM fbmn_catalog_private.pricebook_entries ")&&sql.includes("ORDER BY sku_cong_ty"))
   return {rows:records,rowCount:records.length};
  if(sql.startsWith("SELECT payload_sha256"))
   return {rows:committed,rowCount:committed.length};
  if(sql.startsWith("INSERT INTO fbmn_catalog_private.pricebook_entries"))
   return {rows:[{id:"00000000-0000-0000-0000-000000000011",revision:1}],rowCount:1};
  if(sql.startsWith("UPDATE fbmn_catalog_private.pricebook_entries"))
   return {rows:[{revision:2}],rowCount:1};
  return {rows:[],rowCount:sql.startsWith("INSERT")?1:0};
 }});
 return {db,queries,setRecords:x=>{records=x},setCommitted:x=>{committed=x}};
}
const old=(revision=1)=>({
 id:"00000000-0000-0000-0000-000000000011",sku_cong_ty:"0114",price_kind:"net_internal",
 customer_id:null,amount_vnd:"11100",vat_included:false,vat_rate_bps:null,
 source_document:"Internal approved test reference",effective_from:"2026-11-03",
 effective_until:null,approval_state:"draft",revision
});
test("403 owner boundary before database for private export and preview",async()=>{
 const a=fixture();
 for(const req of [request("bulk?kind=net_internal","GET"),
  request("bulk/preview","POST",{...base,rows:[row("0114","12000")]})]){
  const response=await handleBulkPricebook({request:req,actor:{role:"pricing",subject:"staff"},db:a.db});
  assert.equal(response.status,403);
 }
 assert.equal(a.queries.length,0);
});
test("dry-run of all 613 SKU rows keeps zero padding and does not write",async()=>{
 const a=fixture();const rows=Array.from({length:613},(_,i)=>row(String(i+1).padStart(4,"0"),String(1000+i),i+2));
 const result=await handleBulkPricebook({request:request("bulk/preview","POST",{...base,rows}),
  actor:owner,db:a.db});
 assert.equal(result.status,200);
 const parsed=(await result.json()).data;
 assert.equal(parsed.created,613);assert.equal(parsed.invalid,0);assert.equal(parsed.changes[0].sku_cong_ty,"0001");
 assert.equal(parsed.changes[612].sku_cong_ty,"0613");
 assert.ok(!a.queries.some(q=>/^(BEGIN|INSERT|UPDATE|COMMIT)/.test(q.sql)));
 assert.ok(!JSON.stringify(parsed).includes("11100"));
});
test("blank is skip rather than price zero; duplicate and missing SKU are invalid",async()=>{
 const a=fixture();
 const result=await handleBulkPricebook({request:request("bulk/preview","POST",
  {...base,rows:[row("0114",""),row("0114","12000",3),row("0114","13000",4),row("999X","15000",5)]}),
  actor:owner,db:a.db});
 const data=(await result.json()).data;
 assert.deepEqual(data.changes.map(x=>x.status),["unchanged","new","invalid","invalid"]);
 assert.deepEqual(data.changes.map(x=>x.issue),["empty_skip",null,"duplicate_row","sku_not_found"]);
 assert.equal(data.invalid,2);
});
test("unverified preview fingerprint or changed revision cannot apply",async()=>{
 const a=fixture([old()]);
 const payload={...base,rows:[row("0114","13000")]};
 const preview=await handleBulkPricebook({request:request("bulk/preview","POST",payload),actor:owner,db:a.db});
 assert.equal(preview.status,200);
 const fingerprint=(await preview.json()).data.preview_fingerprint;
 a.setRecords([old(2)]);
 const saved=await handleBulkPricebook({request:request("bulk/apply","POST",
  {...payload,preview_fingerprint:fingerprint,confirm:"XAC_NHAN_GIA_NHAP",
   request_id:"00000000-0000-0000-0000-000000000012"}),actor:owner,db:a.db});
 assert.equal(saved.status,409);
 assert.ok(a.queries.some(q=>q.sql==="ROLLBACK"));
 assert.ok(!a.queries.some(q=>q.sql.startsWith("INSERT INTO fbmn_catalog_private.pricebook_entries")));
});
test("confirmed create saves draft, audit and batch atomically",async()=>{
 const a=fixture();
 const payload={...base,rows:[row("0114","12000")]};
 const preview=await handleBulkPricebook({request:request("bulk/preview","POST",payload),actor:owner,db:a.db});
 const fingerprint=(await preview.json()).data.preview_fingerprint;
 const saved=await handleBulkPricebook({request:request("bulk/apply","POST",
  {...payload,preview_fingerprint:fingerprint,confirm:"XAC_NHAN_GIA_NHAP",
   request_id:"00000000-0000-0000-0000-000000000012"}),actor:owner,db:a.db});
 assert.equal(saved.status,200);
 const data=(await saved.json()).data;
 assert.equal(data.created_count,1);assert.equal(data.publicly_published,false);
 assert.ok(a.queries.some(q=>q.sql==="COMMIT"));
 assert.ok(a.queries.some(q=>q.sql.startsWith("INSERT INTO fbmn_catalog_private.pricebook_audit")));
 assert.ok(a.queries.some(q=>q.sql.startsWith("INSERT INTO fbmn_catalog_private.pricebook_import_batches")));
});
test("two-column price preview resolves master name and inherits recorded VAT",async()=>{
 const a=fixture([old()]);
 const payload={...base,vat_included:null,source_document:"bang-gia.xlsx",
  rows:[row("0114","13000")]};
 const response=await handleBulkPricebook({request:request("bulk/preview","POST",payload),
  actor:owner,db:a.db});
 assert.equal(response.status,200);
 const result=(await response.json()).data;
 assert.equal(result.invalid,0);
 assert.equal(result.updated,1);
 assert.equal(result.changes[0].ten_san_pham,"Sản phẩm 0114");
 assert.equal(result.changes[0].vat_included,false);
 assert.equal(result.changes[0].source_document,"bang-gia.xlsx");
 assert.ok(!a.queries.some(q=>/^(INSERT|UPDATE|BEGIN)/.test(q.sql)));
});

test("new price with unverified VAT stays in invalid preview and cannot be applied",async()=>{
 const a=fixture();
 const payload={...base,vat_included:null,rows:[row("0114","13000")]};
 const preview=await handleBulkPricebook({request:request("bulk/preview","POST",payload),
  actor:owner,db:a.db});
 assert.equal(preview.status,200);
 const data=(await preview.json()).data;
 assert.equal(data.invalid,1);
 assert.equal(data.changes[0].issue,"vat_required");
 assert.equal(data.changes[0].ten_san_pham,"Sản phẩm 0114");
 const apply=await handleBulkPricebook({request:request("bulk/apply","POST",{
  ...payload,preview_fingerprint:data.preview_fingerprint,confirm:"XAC_NHAN_GIA_NHAP",
  request_id:"00000000-0000-0000-0000-000000000024"}),actor:owner,db:a.db});
 assert.equal(apply.status,409);
 assert.ok(!a.queries.some(q=>q.sql.startsWith("INSERT INTO fbmn_catalog_private.pricebook_entries")));
});

test("dealer export requires explicit customer scope, unknown kind denied",async()=>{
 const a=fixture();
 for(const path of ["bulk?kind=dealer_contract","bulk?kind=banana&customer_id=00000000-0000-0000-0000-000000000011"]){
  const response=await handleBulkPricebook({request:request(path,"GET"),actor:owner,db:a.db});
  assert.equal(response.status,400);
 }
});

test("skipped VAT, source and expiry preserve exact existing draft values",async()=>{
 const current={...old(),vat_included:true,vat_rate_bps:800,source_document:"Prior verified document",
  effective_until:"2026-12-31"};
 const a=fixture([current]);
 const payload={...base,rows:[{...row("0114","13000"),
  preserve_existing_fields:["vat_included","vat_rate_bps","source_document","effective_until"]}]};
 const preview=await handleBulkPricebook({request:request("bulk/preview","POST",payload),actor:owner,db:a.db});
 assert.equal(preview.status,200);
 const data=(await preview.json()).data;
 assert.equal(data.updated,1);
 assert.equal(data.changes[0].vat_included,true);
 assert.equal(data.changes[0].vat_rate_bps,800);
 assert.equal(data.changes[0].source_document,"Prior verified document");
 assert.equal(data.changes[0].effective_until,"2026-12-31");
 const response=await handleBulkPricebook({request:request("bulk/apply","POST",{
  ...payload,preview_fingerprint:data.preview_fingerprint,confirm:"XAC_NHAN_GIA_NHAP",
  request_id:"00000000-0000-0000-0000-000000000013"}),actor:owner,db:a.db});
 assert.equal(response.status,200);
 const updated=a.queries.find(q=>q.sql.startsWith("UPDATE fbmn_catalog_private.pricebook_entries"));
 assert.deepEqual(updated.args.slice(1,5),[true,800,"Prior verified document","2026-12-31"]);
});
test("approvals use shared per-SKU lock to reject overlapping approval races",async()=>{
 const a=fixture();
 const approve=await handleBulkPricebook({request:request("approve","POST",{
  id:"00000000-0000-0000-0000-000000000011",expected_revision:1,
  confirm:"DUYET_GIA_NOI_BO"}),actor:owner,db:a.db});
 // A mock without a selected entry fails closed; the lock condition is required by contract.
 assert.equal(approve.status,409);
 const source=await import("node:fs");
 const code=source.readFileSync(new URL("../pricebook-bulk-service.mjs",import.meta.url),"utf8");
 assert.match(code,/pg_advisory_xact_lock\(hashtext\(\$1\)\).*fbmn-price/);
});

test("mapped blank optional rate and expiry clear existing values rather than preserve",async()=>{
 const current={...old(),vat_rate_bps:800,effective_until:"2026-12-31"};
 const a=fixture([current]);
 const payload={...base,rows:[{...row("0114","13000"),
  vat_rate_bps:null,effective_until:null,preserve_existing_fields:[]}]};
 const preview=await handleBulkPricebook({request:request("bulk/preview","POST",payload),actor:owner,db:a.db});
 assert.equal(preview.status,200);
 const result=(await preview.json()).data;
 assert.equal(result.updated,1);
 assert.equal(result.changes[0].vat_rate_bps,null);
 assert.equal(result.changes[0].effective_until,null);
 const confirmed=await handleBulkPricebook({request:request("bulk/apply","POST",{
  ...payload,preview_fingerprint:result.preview_fingerprint,confirm:"XAC_NHAN_GIA_NHAP",
  request_id:"00000000-0000-0000-0000-000000000014"}),actor:owner,db:a.db});
 assert.equal(confirmed.status,200);
 const update=a.queries.find(q=>q.sql.startsWith("UPDATE fbmn_catalog_private.pricebook_entries"));
 assert.deepEqual(update.args.slice(2,5),[null,"Internal approved test reference",null]);
});
test("idempotency request lock precedes lookup and SKU locks",async()=>{
 const source=(await import("node:fs")).readFileSync(
  new URL("../pricebook-bulk-service.mjs",import.meta.url),"utf8");
 const gate=source.indexOf('["fbmn-batch:"+input.request_id]');
 const lookup=source.indexOf('SELECT payload_sha256,created_count,updated_count');
 const sku=source.indexOf('["fbmn-price:"+s]');
 assert.ok(gate>0&&lookup>gate&&sku>lookup);
});

test("uppercase customer UUID resolves existing dealer draft instead of duplicate insert",async()=>{
 const customer="ABCDEF12-3456-7890-ABCD-000000000011";
 const existing={...old(),price_kind:"dealer_contract",customer_id:customer.toLowerCase()};
 const a=fixture([existing]);
 const payload={...base,price_kind:"dealer_contract",customer_id:customer,rows:[row("0114","13000")]};
 const response=await handleBulkPricebook({request:request("bulk/preview","POST",payload),
  actor:owner,db:a.db});
 assert.equal(response.status,200);
 const data=(await response.json()).data;
 assert.equal(data.invalid,0);
 assert.equal(data.updated,1);
 assert.equal(data.created,0);
 assert.equal(data.changes[0].customer_id,customer.toLowerCase());
});
