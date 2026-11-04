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
 sourceRef:"nguon-owner",placements:{public_web:"news.list"},
 popupDelaySeconds:3,popupCooldownMinutes:1440,popupMaxPerSession:1
});
function env({role="owner",failAudit=false,publicReady=false}={}){
 const state={rows:[],cmsAudit:[],queries:[]};
 const db=async work=>work({query:async(sql,params=[])=>{
  state.queries.push(sql);
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK")return {rows:[],rowCount:0};
  if(sql.includes("INSERT INTO fbmn_catalog_private.cms_entries")){
   const row={
    id:UUID,kind:params[0],slug:params[1],title:params[2],summary:params[3],
    paragraphs:params[4],cta_url:params[5],channel_targets:params[6],
    sort_order:params[7],starts_at:params[8],ends_at:params[9],
    source_ref:params[10],placements:JSON.parse(params[11]),
    popup_delay_seconds:params[12],popup_cooldown_minutes:params[13],
    popup_max_per_session:params[14],created_by:params[15],updated_by:params[16],
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
   if(sql.includes("WHERE id=$1::uuid")){
    const row=state.rows.find(x=>x.id===params[0]);
    return {rows:row?[{...row}]:[],rowCount:row?1:0};
   }
   if(!sql.includes("LIMIT 51 OFFSET $2"))throw Error("Unbounded CMS list query");
   const selected=state.rows.filter(x=>params[0]==="marketing"?
    ["banner","popup"].includes(x.kind):["article","promotion"].includes(x.kind));
   const summary=selected.slice(params[1],params[1]+51).map(({paragraphs,cta_url,...row})=>row);
   return {rows:summary,rowCount:summary.length};
  }
  if(sql.includes("UPDATE fbmn_catalog_private.cms_entries")){
   const row=state.rows.find(r=>r.id===params[0]);
   if(sql.includes("title=$2")){
    Object.assign(row,{title:params[1],summary:params[2],paragraphs:params[3],
     cta_url:params[4],channel_targets:params[5],sort_order:params[6],
     starts_at:params[7],ends_at:params[8],source_ref:params[9],
     placements:JSON.parse(params[10]),popup_delay_seconds:params[11],
     popup_cooldown_minutes:params[12],popup_max_per_session:params[13],
     status:"draft",updated_by:params[14]});
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
  cmsPublicSurfaceReady:publicReady,
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
 const list=await a.hit("/v1/admin/cms?mode=editorial&page=1");
 const listed=(await list.json()).data;
 assert.equal(listed.items.length,1);
 assert.equal(listed.hasNext,false);
 assert.equal("paragraphs" in listed.items[0],false);
 const detail=await a.hit("/v1/admin/cms/entry?id="+UUID);
 assert.deepEqual((await detail.json()).data.item.paragraphs,payload().paragraphs);
 assert.equal((await a.hit("/v1/admin/cms?kind=private")).status,400);
 assert.equal((await a.hit("/v1/admin/cms/entry?id=wrong")).status,400);
});

test("CMS publication requires verified source and channels",async()=>{
 const a=env();
 const d=payload();
 await a.hit("/v1/admin/cms/create","POST",{...d,sourceRef:"",channelTargets:[]});
 assert.equal((await a.hit("/v1/admin/cms/publish","POST",
  {id:UUID,expectedRevision:1})).status,400);
 // Updating draft with no source remains possible; publication is not.
 const upd=await a.hit("/v1/admin/cms/update","POST",{
  ...d,sourceRef:"nguon-xac-minh",channelTargets:[],placements:{},
  id:UUID,expectedRevision:1
 });
 assert.equal(upd.status,200);
 assert.equal((await a.hit("/v1/admin/cms/publish","POST",
  {id:UUID,expectedRevision:2})).status,400);
});

test("CMS publish/hide/update uses optimistic revision and append-only audit",async()=>{
 const a=env({publicReady:true});
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

test("CMS lightweight pages remain below proxy cap with many long articles",async()=>{
 const a=env();
 const base=payload();
 for(let i=0;i<60;i++)a.state.rows.push({
  id:String(i).padStart(8,"0")+"-1111-4111-8111-111111111111",
  kind:"article",slug:base.slug+"-"+i,title:base.title,summary:base.summary,
  paragraphs:Array.from({length:30},()=> "x".repeat(3000)),
  cta_url:null,channel_targets:["public_web"],sort_order:0,
  starts_at:null,ends_at:null,source_ref:base.sourceRef,
  status:"draft",revision:1,updated_at:new Date()
 });
 const first=await a.hit("/v1/admin/cms?mode=editorial&page=1");
 assert.equal(first.status,200);
 const body=await first.text();
 assert.ok(body.length<100000,"List must never include full prose");
 const data=JSON.parse(body).data;
 assert.equal(data.items.length,50);
 assert.equal(data.hasNext,true);
 assert.equal(data.items[0].paragraphs,undefined);
 const second=await a.hit("/v1/admin/cms?mode=editorial&page=2");
 assert.equal((await second.json()).data.items.length,10);
 assert.equal((await a.hit("/v1/admin/cms?mode=editorial&page=0")).status,400);
 assert.equal((await a.hit("/v1/admin/cms?mode=editorial&page=1&page=2")).status,400);
 assert.equal((await a.hit("/v1/admin/cms?mode=secret&page=1")).status,400);
 const item=await a.hit("/v1/admin/cms/entry?id=00000000-1111-4111-8111-111111111111");
 assert.equal((await item.json()).data.item.paragraphs.length,30);
 const marketing=await a.hit("/v1/admin/cms?mode=marketing&page=1");
 assert.equal((await marketing.json()).data.items.length,0);
});

test("CMS refuses phantom website/app publication and validates per-channel slots",async()=>{
 const a=env();
 await a.hit("/v1/admin/cms/create","POST",payload());
 const denied=await a.hit("/v1/admin/cms/publish","POST",{id:UUID,expectedRevision:1});
 assert.equal(denied.status,409);
 assert.equal((await denied.json()).error.code,"surface_unavailable");
 const invalid=env();
 const wrong=await invalid.hit("/v1/admin/cms/create","POST",{
  ...payload(),kind:"banner",placements:{public_web:"news.list"}
 });
 assert.equal(wrong.status,400);
 const wrongApp=await invalid.hit("/v1/admin/cms/create","POST",{
  ...payload(),placements:{dealer_app:"home.banner"}
 });
 assert.equal(wrongApp.status,400);
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
 for(const action of ["catalogue.manage","pricing.private","cms.manage"])
  assert.ok(sql.includes("'"+action+"'"),"Preserve historical audit action "+action);
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
