import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {projectPublicCms} from "../backend/public-api/cms-public.mjs";
import {createPublicApi} from "../backend/public-api/handler.mjs";
import {createReadModel,PUBLIC_READ_QUERIES} from "../backend/public-api/read-model.mjs";
import {createStagingWorker} from "../backend/public-api/staging-worker.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const id="11111111-1111-4111-8111-111111111111";
const cms=()=>({
 id,kind:"banner",slug:"banner-duyet",title:"Đã duyệt",summary:"Ưu đãi chính thức",
 paragraphs:[],ctaUrl:"/san-pham",slot:"home.after_products",
 sortOrder:1,publishedAt:"2026-11-08T00:00:00.000Z",startsAt:null,endsAt:null,
 hasDesktop:true,hasMobile:true,popupDelaySeconds:3,
 popupCooldownMinutes:1440,popupMaxPerSession:1,
 sourceRef:"private-source",verifiedBy:"private-user",netPrice:998877,mediaR2Key:"cms/secret",
 customer:"private-customer"
});
test("C4 DTO hides private CMS fields and validates strict public placements",()=>{
 const result=projectPublicCms([cms()]);assert.equal(result.length,1);
 assert.equal(result[0].slot,"home.after_products");
 assert.deepEqual(Object.keys(result[0]).sort(),[
  "id","kind","slug","title","summary","paragraphs","ctaUrl","slot",
  "sortOrder","publishedAt","startsAt","endsAt","hasDesktop","hasMobile",
  "popupDelaySeconds","popupCooldownMinutes","popupMaxPerSession"
 ].sort());
 assert.doesNotMatch(JSON.stringify(result),/private|998877|sourceRef|r2Key|customer/i);
 assert.throws(()=>projectPublicCms([{...cms(),kind:"banner",slot:"dealer_app.home.banner"}]));
 assert.throws(()=>projectPublicCms([{...cms(),hasMobile:false}]));
 assert.throws(()=>projectPublicCms([{...cms(),ctaUrl:"javascript:alert(1)"}]));
 assert.throws(()=>projectPublicCms([{...cms(),title:"<script>alert(1)</script>"}]));
 assert.throws(()=>projectPublicCms([cms(),cms()]));
});
test("C4 Worker CMS route stays 503 until server flag and no-cache after enabling",async()=>{
 const instance=enabled=>createPublicApi({
  getPublicCatalog:async()=>({categories:[],products:[]}),
  getPublicContent:async()=>({company:null,articles:[],promotions:[],dealerInformation:null}),
  getPublicCms:async()=>[cms()],cmsEnabled:enabled,
  allowedOrigins:["https://fbmn-web.vercel.app"]
 });
 const request=path=>new Request("https://worker.example.invalid"+path,{
  headers:{Origin:"https://fbmn-web.vercel.app"}
 });
 const blocked=await instance(false).fetch(request("/v1/public/cms"));
 assert.equal(blocked.status,503);
 const result=await instance(true).fetch(request("/v1/public/cms"));
 assert.equal(result.status,200);
 assert.equal(result.headers.get("cache-control"),"no-store");
 const envelope=await result.json();
 assert.equal(envelope.data.items[0].id,id);
 assert.doesNotMatch(JSON.stringify(envelope),/998877|private-source|private-customer/);
 assert.equal((await instance(true).fetch(request("/v1/public/cms?token=1"))).status,400);
 assert.equal((await instance(true).fetch(new Request("https://worker.example.invalid/v1/public/cms",{
  headers:{Origin:"https://evil.example"}
 }))).status,403);
 assert.equal((await instance(true).fetch(new Request("https://worker.example.invalid/v1/public/cms",{
  method:"POST"
 }))).status,405);
});
test("C4 SQL boundary selects only public views and fresh image rechecks",async()=>{
 const reads=[];
 const model=createReadModel(async(sql,params)=>{
  reads.push({sql,params});
  if(sql===PUBLIC_READ_QUERIES.cmsEntries)return [{
   id,kind:"popup",slug:"popup-duyet",title:"Popup",summary:"Thông báo",
   paragraphs:[],cta_url:"/san-pham",slot:"home.entry",sort_order:1,
   published_at:new Date("2026-11-08T00:00:00Z"),starts_at:null,ends_at:null,
   popup_delay_seconds:3,popup_cooldown_minutes:60,popup_max_per_session:1,
   has_desktop:true,has_mobile:true,
  }];
  if(sql===PUBLIC_READ_QUERIES.cmsImageKey)return [{r2_key:"cms/"+id+"/public_web/desktop/"+id+".webp"}];
  throw Error("Unknown query");
 });
 const entries=await model.getPublicCms();
 assert.equal(entries[0].kind,"popup");
 assert.equal(entries[0].startsAt,null);
 assert.equal(await model.getPublicCmsImageKey(id,"desktop"),"cms/"+id+"/public_web/desktop/"+id+".webp");
 assert.equal(await model.getPublicCmsImageKey("invalid","desktop"),null);
 assert.ok(reads.every(r=>Object.values(PUBLIC_READ_QUERIES).includes(r.sql)));
 assert.match(reads[0].sql,/fbmn_public\.v_cms_web_entries/);
 assert.match(reads[1].sql,/fbmn_public\.v_cms_web_images/);
 assert.deepEqual(reads[1].params,[id,"desktop"]);
});
test("C4 SQL migration filters drafts, approvals, future/expired, withdrawals, channels",()=>{
 const sql=read("backend/neon/migrations/20261108_c4_cms_public_views.up.sql");
 for(const piece of [
  "c.status='published'","c.channel_targets @> ARRAY['public_web']",
  "c.source_ref<>''","c.verified_at IS NOT NULL","c.approved_at IS NOT NULL",
  "c.published_at<=CURRENT_TIMESTAMP","c.starts_at<=CURRENT_TIMESTAMP",
  "c.ends_at>=CURRENT_TIMESTAMP","c.withdrawn_at>CURRENT_TIMESTAMP",
  "c.placements->>'public_web'","m.mime_type='image/webp'",
  "security_barrier=true","GRANT SELECT","TO fbmn_public_reader",
 ])assert.ok(sql.includes(piece),piece);
 assert.doesNotMatch(sql,/GRANT\s+SELECT\s+ON\s+fbmn_catalog_private/i);
 assert.match(sql,/JOIN fbmn_public\.v_cms_web_entries/);
 const rollback=read("backend/neon/migrations/20261108_c4_cms_public_views.down.sql");
 assert.match(rollback,/rollback_confirmed/);
 assert.doesNotMatch(rollback,/DROP TABLE fbmn_catalog_private/);
});
test("C4 public image route validates UUID/device and requires published SQL view",async()=>{
 const calls=[];
 const worker=createStagingWorker({createDbClient:()=>{
  return {connect:async()=>{},end:async()=>{},query:async(sql,params)=>{
   calls.push({sql,params});
   if(sql==="SELECT current_user AS role_name")return {rows:[{role_name:"fbmn_p5_public_login"}]};
   if(sql===PUBLIC_READ_QUERIES.cmsImageKey)return {rows:[{r2_key:"cms/"+id+"/public_web/desktop/"+id+".webp"}]};
   throw Error("Invalid SQL");
  }};
 }});
 const bytes=new Uint8Array(150).fill(12);
 const env={
  HYPERDRIVE:{connectionString:"postgres://test"},
  EXPECTED_DB_ROLE:"fbmn_p5_public_login",PUBLIC_P5_ENABLED:"true",
  PUBLIC_CMS_ENABLED:"true",PUBLIC_ALLOWED_ORIGINS:"https://fbmn-web.vercel.app",
  RATE_LIMITER:{limit:async()=>({success:true})},
  IMAGE_RATE_LIMITER:{limit:async()=>({success:true})},
  PUBLIC_MEDIA_R2:{get:async()=>({
   size:bytes.length,body:new Response(bytes).body,
   httpMetadata:{contentType:"image/webp"}
  })}
 };
 const url="https://example.invalid/v1/public/cms/image?id="+id+"&device=desktop";
 const ok=await worker.fetch(new Request(url),env);
 assert.equal(ok.status,200);assert.equal(ok.headers.get("cache-control"),"no-store");
 assert.equal(ok.headers.get("content-type"),"image/webp");
 assert.ok(calls.some(q=>q.sql===PUBLIC_READ_QUERIES.cmsImageKey));
 assert.equal((await worker.fetch(new Request(url+"&key=secret"),env)).status,400);
 assert.equal((await worker.fetch(new Request(url),{...env,PUBLIC_CMS_ENABLED:"false"})).status,404);
});
test("C4 Website and Admin remain behind independent release gates",()=>{
 const stage=read("backend/admin-api/staging-worker.mjs");
 const admin=read("backend/admin-api/cms-service.mjs");
 const ui=read("apps/admin/app/cms-manager.tsx");
 const html=read("app/page.tsx");
 const category=read("app/danh-muc/[slug]/page.tsx");
 const layout=read("app/layout.tsx");
 const cmsWeb=read("lib/content/cms.ts");
 assert.match(stage,/ADMIN_CMS_PUBLIC_READY==="true"/);
 assert.match(admin,/action==="capability"/);
 assert.match(admin,/!publicSurfaceReady/);
 assert.match(admin,/old\.channel_targets\.some\(c=>c!=="public_web"\)/);
 assert.match(ui,/cmsApi<\{ready:boolean;channel:string\}>\("capability"\)/);
 assert.match(ui,/publishReady\?"Xuất bản":"Chờ kết nối Website"/);
 assert.match(html,/slot="home.hero"/);
 assert.match(html,/slot="home.after_products"/);
 assert.match(html,/slot="home.news_featured"/);
 assert.match(html,/slot="home.promotion_featured"/);
 assert.match(category,/slot="category.header"/);
 assert.match(layout,/CmsPopupRuntime/);
 assert.match(cmsWeb,/FBMN_CMS_PUBLIC_ENABLED/);
 assert.match(read("backend/public-api/wrangler.jsonc"),/"PUBLIC_CMS_ENABLED": "false"/);
 assert.match(read("backend/admin-api/wrangler.jsonc"),/"ADMIN_CMS_PUBLIC_READY": "false"/);
 const proxy=read("app/api/cms-image/route.ts");
 assert.match(proxy,/MAX=5\*1024\*1024/);
 assert.match(proxy,/cache:"no-store"/);
 assert.doesNotMatch(proxy,/R2_SECRET|ADMIN_TOKEN|NEXT_PUBLIC_FB/);
});
