import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {projectPublicCms} from "../backend/public-api/cms-public.mjs";
import {handleCmsSlides} from "../backend/admin-api/cms-slides-service.mjs";
import {createReadModel,PUBLIC_READ_QUERIES} from "../backend/public-api/read-model.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const id="11111111-1111-4111-8111-111111111111";
const base=()=>({
 id,kind:"banner",slug:"futurebook-lo-xo",title:"Sổ lò xo Futurebook",summary:"",
 paragraphs:[],ctaUrl:null,slot:"home.hero",sortOrder:0,
 publishedAt:"2026-11-09T00:00:00.000Z",startsAt:null,endsAt:null,
 hasDesktop:true,hasMobile:true,popupDelaySeconds:3,popupCooldownMinutes:1440,popupMaxPerSession:1
});
const motion={enabled:true,autoplay:true,effect:"fade-slide",intervalMs:7000,durationMs:480};
test("C5 public DTO accepts ordered bounded slides and rejects invalid motion",()=>{
 const entry={...base(),slides:[2,1,3],motion};
 const result=projectPublicCms([entry]);assert.deepEqual(result[0].slides,[2,1,3]);
 assert.deepEqual(result[0].motion,motion);
 assert.throws(()=>projectPublicCms([{...entry,slides:[2,3]}]));
 assert.throws(()=>projectPublicCms([{...entry,slides:[1,2,2]}]));
 assert.throws(()=>projectPublicCms([{...entry,slides:[1,6]}]));
 assert.throws(()=>projectPublicCms([{...entry,motion:{...motion,intervalMs:1000}}]));
 assert.throws(()=>projectPublicCms([{...entry,motion:{...motion,effect:"javascript"}}]));
});
test("C5 private slide API fails closed for non-Owner and invalid extra index",async()=>{
 const never=()=>{throw Error("No DB should be touched");};
 const request=new Request("https://admin.invalid/v1/admin/cms/slides?id="+id);
 const forbidden=await handleCmsSlides({request,db:never,r2:null,actor:{role:"editor"},action:"slides"});
 assert.equal(forbidden.status,403);
 const invalid=await handleCmsSlides({request:new Request(
  "https://admin.invalid/v1/admin/cms/slide-image?id="+id+"&slide=99&device=desktop"),
  db:never,r2:{get:async()=>null},actor:{role:"owner"},action:"slide-image"});
 assert.equal(invalid.status,400);
});
test("C5 private slide GET returns legacy pair and extra pair without R2 keys",async()=>{
 const db=async cb=>cb({query:async(sql)=>{
  if(sql.includes("FROM fbmn_catalog_private.cms_entries"))return {rowCount:1,rows:[{kind:"banner",status:"draft",revision:3}]};
  if(sql.includes("FROM fbmn_catalog_private.cms_banner_settings"))return {rows:[]};
  if(sql.includes("FROM fbmn_catalog_private.cms_entry_media"))return {rows:[
   {slide_no:1,device:"desktop",width:1200,height:800,updated_at:new Date()},
   {slide_no:1,device:"mobile",width:800,height:500,updated_at:new Date()}]};
  if(sql.includes("FROM fbmn_catalog_private.cms_banner_slide_media"))return {rows:[
   {slide_no:2,device:"desktop",width:1200,height:800,updated_at:new Date()},
   {slide_no:2,device:"mobile",width:800,height:500,updated_at:new Date()}]};
  throw Error("unapproved query");
 }});
 const res=await handleCmsSlides({request:new Request("https://admin.invalid/v1/admin/cms/slides?id="+id),
  db,r2:{get:()=>{},put:()=>{}},actor:{role:"owner",subject:"owner"},action:"slides"});
 assert.equal(res.status,200);
 const body=(await res.json()).data;
 assert.deepEqual(body.images.map(x=>x.slide_no),[1,1,2,2]);
 assert.deepEqual(body.settings.slide_order,[1,2,3,4,5]);
 assert.doesNotMatch(JSON.stringify(body),/r2_key|source_ref|sha256/);
});
test("C5 public read-model uses allowlisted published view for extra image",async()=>{
 const calls=[];const model=createReadModel(async(sql,params)=>{
  calls.push({sql,params});
  if(sql===PUBLIC_READ_QUERIES.cmsSlideImageKey)
   return [{r2_key:"cms/"+id+"/public_web/desktop/"+id+".webp"}];
  throw Error("unapproved SQL");
 });
 assert.equal(await model.getPublicCmsImageKey(id,"desktop",2),
  "cms/"+id+"/public_web/desktop/"+id+".webp");
 assert.equal(await model.getPublicCmsImageKey(id,"desktop",6),null);
 assert.deepEqual(calls[0].params,[id,"desktop",2]);
 assert.match(calls[0].sql,/v_cms_web_banner_slide_images/);
});
test("C5 migration preserves Slide 1 and gates new slide visibility by publication and paired devices",()=>{
 const sql=read("backend/neon/migrations/20261109_c5_banner_slides.up.sql");
 for(const marker of [
  "cms_banner_slide_media","cms_banner_settings","slide_no BETWEEN 2 AND 5",
  "m.device='desktop'","mobile.device='mobile'","v_cms_web_entries",
  "v_cms_web_banner_slides","v_cms_web_banner_slide_images",
  "fbmn_public_reader","fbmn_admin_http_staging",
  "CHECK(interval_ms BETWEEN 3000 AND 15000)",
  "CHECK(duration_ms BETWEEN 300 AND 800)",
  "banner_slide_upload", "banner_slide_settings", "banner_slide_remove",
  "cms_entry_audit_action_check"
 ])assert.ok(sql.includes(marker),marker);
 assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE fbmn_catalog_private/);
 const down=read("backend/neon/migrations/20261109_c5_banner_slides.down.sql");
 assert.match(down,/rollback_confirmed/);
 assert.match(down,/C5 has stored slide images/);
 assert.match(down,/C5 audit history exists/);
});
test("C5 UI has Add Slide, ordering, motion settings and device safe previews",()=>{
 const editor=read("apps/admin/app/cms-slide-editor.tsx");
 const manager=read("apps/admin/app/cms-manager.tsx");
 const relay=read("apps/admin/app/api/cms/[[...path]]/route.ts");
 const publicImage=read("app/api/cms-image/route.ts");
 const hero=read("components/cms-hero-carousel.tsx");
 assert.match(editor,/Thêm Slide/);
 assert.match(editor,/Lưu motion & thứ tự/);
 assert.match(editor,/slide-upload/);
 assert.match(editor,/slide-remove/);
 assert.match(manager,/uploadCmsSlide/);
 assert.match(manager,/previewSlide=\{previewSlide\}/);
 assert.match(manager,/slideSettingsDraft/);
 assert.match(manager,/saveCmsSlideSettings/);
 assert.match(editor,/onSettingsDraft/);
 assert.match(relay,/slide-image/);
 assert.match(publicImage,/slide===1/);
 assert.match(hero,/item\.slides\?\?\[1\]/);
 assert.match(hero,/current\.motion\.intervalMs/);
 assert.match(hero,/prefers-reduced-motion: reduce/);
 assert.match(hero,/document\.hidden/);
 assert.doesNotMatch(hero,/r2_key|r2Key|source_ref|NET/);
});

test("C5 settings mutation locks revision, audits and validates order before writing",async()=>{
 const queries=[];
 const db=async job=>job({query:async(sql,params=[])=>{
  queries.push({sql,params});
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK")return {rows:[],rowCount:0};
  if(sql.includes("FROM fbmn_catalog_private.cms_entries")&&sql.includes("FOR UPDATE"))
   return {rowCount:1,rows:[{id,kind:"banner",status:"draft",revision:3,
    channel_targets:["public_web"],placements:{public_web:"home.hero"}}]};
  if(sql.includes("SELECT * FROM fbmn_catalog_private.cms_banner_settings"))return {rows:[]};
  if(sql.startsWith("INSERT INTO fbmn_catalog_private.cms_banner_settings"))return {rowCount:1,rows:[]};
  if(sql.startsWith("UPDATE fbmn_catalog_private.cms_entries"))return {rowCount:1,rows:[{revision:4}]};
  if(sql.startsWith("INSERT INTO fbmn_catalog_private.cms_entry_audit"))return {rowCount:1,rows:[]};
  throw Error("Unexpected query "+sql);
 }});
 const action="slide-settings";
 const values={id,expectedRevision:3,enabled:true,autoplay:false,effect:"fade",intervalMs:5000,
  durationMs:400,order:[2,1,3,4,5]};
 const req=(body)=>new Request("https://admin.invalid/v1/admin/cms/"+action,{
  method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
 const invalid=await handleCmsSlides({request:req({...values,order:[2,2,3,4,5]}),
  db,r2:null,actor:{role:"owner",subject:"owner"},action});
 assert.equal(invalid.status,400);assert.equal(queries.length,0);
 const result=await handleCmsSlides({request:req(values),db,r2:null,
  actor:{role:"owner",subject:"owner"},action});
 assert.equal(result.status,200);
 assert.equal((await result.json()).data.revision,4);
 assert.equal(queries.at(-1).sql,"COMMIT");
 assert.ok(queries.some(x=>x.sql.includes("banner_slide_settings")));
 assert.ok(queries.some(x=>x.sql.includes("cms_entry_audit")));
});
test("C5 published Banner rejects mutable settings with revision-safe 409",async()=>{
 let wrote=false;
 const db=async job=>job({query:async(sql)=>{
  if(sql==="BEGIN"||sql==="ROLLBACK")return {rows:[],rowCount:0};
  if(sql.includes("FROM fbmn_catalog_private.cms_entries")&&sql.includes("FOR UPDATE"))
   return {rowCount:1,rows:[{id,kind:"banner",status:"published",revision:3,
    channel_targets:["public_web"],placements:{public_web:"home.hero"}}]};
  wrote=true;throw Error("Published Banner was mutated");
 }});
 const request=new Request("https://admin.invalid/v1/admin/cms/slide-settings",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({id,expectedRevision:3,enabled:true,autoplay:true,effect:"slide",
   intervalMs:5000,durationMs:400,order:[1,2,3,4,5]})
 });
 const response=await handleCmsSlides({request,db,r2:null,
  actor:{role:"owner",subject:"owner"},action:"slide-settings"});
 assert.equal(response.status,409);
 assert.equal((await response.json()).error.code,"hide_before_edit");
 assert.equal(wrote,false);
});
