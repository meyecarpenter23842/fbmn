import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createAdminApi} from "../backend/admin-api/handler.mjs";
import {parseCmsTimestamp} from "../backend/admin-api/cms-publication-policy.mjs";

const SUB="owner-subject";
const UUID="11111111-1111-4111-8111-111111111111";
const payload=()=>({
 kind:"article",slug:"tin-tuc-futurebook",title:"Thông báo Futurebook",
 summary:"Thông tin đã được xác minh",paragraphs:["Nội dung bản nháp để kiểm tra."],
 ctaUrl:"/san-pham",channelTargets:["public_web"],sortOrder:0,
 startsAt:"2026-11-04T10:00:00+07:00",endsAt:"2026-11-20T10:00:00+07:00",
 sourceRef:"nguon-owner"
});
function env({role="owner",failAudit=false}={}){
 const state={rows:[],cmsAudit:[],queries:[]};
 const db=async work=>work({query:async(sql,params=[])=>{
  state.queries.push(sql);
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK")return {rows:[],rowCount:0};
  if(sql.includes("INSERT INTO fbmn_catalog_private.cms_entries")){
   const row={
    id:UUID,kind:params[0],slug:params[1],title:params[2],summary:params[3],
    paragraphs:params[4],cta_url:params[5],channel_targets:params[6],
    sort_order:params[7],starts_at:params[8],ends_at:params[9],
    source_ref:params[10],created_by:params[11],updated_by:params[12],
    status:"draft",revision:1,verified_at:null,published_at:null,
    approved_at:null,withdrawn_at:null,created_at:new Date(),updated_at:new Date()
   };
   state.rows.push(row);return {rows:[{...row}],rowCount:1};
  }
  if(sql.includes("INSERT INTO fbmn_catalog_private.cms_entry_audit")){
   if(failAudit)throw Error("audit down");
   state.cmsAudit.push({entry:params[0],actor:params[1],action:params[2]});
   return {rows:[],rowCount:1};
  }
  if(sql.includes("SELECT * FROM fbmn_catalog_private.cms_entries")){
   const row=state.rows.find(r=>r.id===params[0]);
   return {rows:row?[{...row}]:[],rowCount:row?1:0};
  }
  if(sql.includes("SELECT id::text,kind,slug,title")){
   const selected=state.rows.filter(x=>!params[0]||x.kind===params[0]);
   return {rows:selected,rowCount:selected.length};
  }
  if(sql.includes("UPDATE fbmn_catalog_private.cms_entries")){
   const row=state.rows.find(r=>r.id===params[0]);
   if(sql.includes("title=$2")){
    Object.assign(row,{title:params[1],summary:params[2],paragraphs:params[3],
     cta_url:params[4],channel_targets:params[5],sort_order:params[6],
     starts_at:params[7],ends_at:params[8],source_ref:params[9],
     status:"draft",updated_by:params[10]});
   } else if(sql.includes("status='published'")){
    Object.assign(row,{status:"published",approved_by:params[1],
     approved_at:new Date(),verified_at:new Date(),published_at:new Date(),
     withdrawn_at:null});
   } else if(sql.includes("status='hidden'")){
    Object.assign(row,{status:"hidden",withdrawn_at:new Date()});
   }else throw Error("unexpected update: "+sql);
   row.revision++;return {rows:[{...row}],rowCount:1};
  }
  throw Error("Unexpected SQL "+sql);
 }});
 const api=createAdminApi({
  verifyToken:async token=>{if(token!=="signed.test.token")throw Error("bad jwt");return SUB;},
  loadActor:async()=>({role,enabled:true,channels:["public_web"]}),
  recordAudit:async()=>{},
  listChannels:async()=>[],
  catalogueDb:db,
  allowedOrigins:["https://admin.example.test"]
 });
 const hit=(path,method="GET",data)=>api.fetch(new Request("https://worker.example.invalid"+path,{
  method,headers:{Authorization:"Bearer signed.test.token",Origin:"https://admin.example.test",
   ...(data?{"Content-Type":"application/json"}:{})},
  ...(data?{body:JSON.stringify(data)}:{})
 }));
 return {state,hit};
}

test("CMS auth and roles fail closed before DB access",async()=>{
 const a=env({role:"editor"}),owner=env();
 assert.equal((await a.hit("/v1/admin/cms")).status,403);
 assert.equal(a.state.queries.length,0);
 assert.equal((await owner.hit("/v1/admin/cms", "GET")).status,200);
 assert.equal((await owner.hit("/v1/admin/cms/missing","POST",{})).status,404);
 const bad=await owner.hit("/v1/admin/cms","GET");
 assert.equal((await bad.json()).data.items.length,0);
 const noAuth=await owner.hit("/v1/admin/cms","GET");
 assert.equal(noAuth.headers.get("cache-control"),"private, no-store");
});

test("CMS creates draft with private audit, no auto publication",async()=>{
 const a=env();
 const res=await a.hit("/v1/admin/cms/create","POST",payload());
 assert.equal(res.status,200);
 const row=(await res.json()).data.item;
 assert.equal(row.status,"draft");
 assert.equal(row.channel_targets[0],"public_web");
 assert.equal(row.revision,1);
 assert.deepEqual(a.state.cmsAudit.map(x=>x.action),["create"]);
 const list=await a.hit("/v1/admin/cms?kind=article");
 assert.equal((await list.json()).data.items.length,1);
 assert.equal((await a.hit("/v1/admin/cms?kind=private")).status,400);
});

test("CMS publication requires verified source and channels",async()=>{
 const a=env();
 const d=payload();
 await a.hit("/v1/admin/cms/create","POST",{...d,sourceRef:"",channelTargets:[]});
 assert.equal((await a.hit("/v1/admin/cms/publish","POST",
  {id:UUID,expectedRevision:1})).status,400);
 // Updating draft with no source remains possible; publication is not.
 const upd=await a.hit("/v1/admin/cms/update","POST",{
  ...d,sourceRef:"nguon-xac-minh",channelTargets:[],
  id:UUID,expectedRevision:1
 });
 assert.equal(upd.status,200);
 assert.equal((await a.hit("/v1/admin/cms/publish","POST",
  {id:UUID,expectedRevision:2})).status,400);
});

test("CMS publish/hide/update uses optimistic revision and append-only audit",async()=>{
 const a=env();
 await a.hit("/v1/admin/cms/create","POST",payload());
 const published=await a.hit("/v1/admin/cms/publish","POST",{id:UUID,expectedRevision:1});
 assert.equal(published.status,200);
 assert.equal((await published.json()).data.item.status,"published");
 assert.equal((await a.hit("/v1/admin/cms/update","POST",{
  ...payload(),id:UUID,expectedRevision:2})).status,409);
 assert.equal((await a.hit("/v1/admin/cms/hide","POST",
  {id:UUID,expectedRevision:1})).status,409);
 assert.equal((await a.hit("/v1/admin/cms/hide","POST",
  {id:UUID,expectedRevision:2})).status,200);
 const updated=await a.hit("/v1/admin/cms/update","POST",{
  ...payload(),title:"Bản sửa",id:UUID,expectedRevision:3
 });
 assert.equal(updated.status,200);
 assert.equal((await updated.json()).data.item.revision,4);
 assert.deepEqual(a.state.cmsAudit.map(x=>x.action),
  ["create","publish","hide","update"]);
 assert.equal(a.state.rows[0].status,"draft");
});

test("CMS validates bad dates, channels, slugs, content and URLs",async()=>{
 const invalids=[
  {slug:"private/path"}, {title:"<script>bad</script>"},
  {sourceRef:"\t"}, {ctaUrl:"javascript:alert(1)"},
  {ctaUrl:"//evil.example"}, {channelTargets:["public_web","public_web"]},
  {channelTargets:["other"]}, {sortOrder:10001},
  {startsAt:"2026-02-30T00:00:00Z"}, {endsAt:"2026-11-03T00:00:00Z"},
  {paragraphs:[]}, {paragraphs:["<img src=x>"]},
 ];
 for(const changes of invalids){
  const f=env();
  const res=await f.hit("/v1/admin/cms/create","POST",{...payload(),...changes});
  assert.equal(res.status,400,JSON.stringify(changes));
  assert.equal(f.state.rows.length,0);
 }
 assert.equal(parseCmsTimestamp("2026-02-30T12:00:00Z"),null);
 assert.notEqual(parseCmsTimestamp("2024-02-29T12:00:00Z"),null);
});

test("CMS audits must be atomic and never send data to public reader",async()=>{
 const f=env({failAudit:true});
 assert.equal((await f.hit("/v1/admin/cms/create","POST",payload())).status,503);
 assert.ok(f.state.queries.includes("ROLLBACK"));
 const sql=readFileSync("backend/neon/migrations/20261104_adm03_cms_entries.up.sql","utf8");
 assert.match(sql,/CREATE TABLE fbmn_catalog_private.cms_entries/);
 assert.match(sql,/CREATE TABLE fbmn_catalog_private.cms_entry_audit/);
 assert.match(sql,/REVOKE ALL ON fbmn_catalog_private.cms_entries/);
 assert.doesNotMatch(sql,/GRANT .*fbmn_public_reader/);
 assert.doesNotMatch(sql,/GRANT DELETE/);
 assert.match(sql,/GRANT UPDATE \(title,summary/);
});

test("CMS Admin is real, uses shared modal/toast and has no invented live publish claim",()=>{
 const page=readFileSync("apps/admin/app/page.tsx","utf8");
 const ui=readFileSync("apps/admin/app/cms-manager.tsx","utf8");
 const proxy=readFileSync("apps/admin/app/api/cms/[[...path]]/route.ts","utf8");
 assert.match(page,/key:"banners",label:"Banner & Popup"/);
 assert.match(page,/key:"content",label:"Tin tức & Khuyến mãi"/);
 assert.match(page,/section==="content"&&<CmsManager mode="editorial"/);
 assert.match(ui,/ProductModal/);
 assert.match(ui,/AdminToast/);
 assert.match(ui,/expectedRevision:item.revision/);
 assert.match(ui,/Nội dung chưa lưu/);
 assert.match(proxy,/origin_forbidden/);
 assert.match(proxy,/method==="POST"/);
 assert.doesNotMatch(ui,/NET_PRICE|fake_price|DEMO_/);
});
