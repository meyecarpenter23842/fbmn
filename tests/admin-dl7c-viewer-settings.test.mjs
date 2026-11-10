import test from "node:test";
import assert from "node:assert/strict";
import {handleCatalogueBooks,validCatalogueViewerSettings}
 from "../backend/admin-api/catalogue-books-service.mjs";

const ROOT="https://admin.example/v1/admin/website/catalogue";
const r2={get:async()=>null,put:async()=>{},delete:async()=>{}};
const record={flip_duration_ms:950,sound_enabled:false,shadow_opacity:"0.26",revision:1};
const logs=[];
function fakeDb(fn){
 return fn({query:async(sql,args=[])=>{
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK")return {rowCount:0,rows:[]};
  if(sql.includes("website_catalogue_viewer_settings")&&sql.startsWith("SELECT"))
   return {rowCount:1,rows:[{...record}]};
  if(sql.startsWith("UPDATE fbmn_catalog_private.website_catalogue_viewer_settings")){
   record.flip_duration_ms=args[0];record.sound_enabled=args[1];
   record.shadow_opacity=args[2];record.revision++;
   return {rowCount:1,rows:[{...record}]};
  }
  if(sql.startsWith("INSERT INTO fbmn_catalog_private.website_catalogue_viewer_settings_audit")){
   logs.push(args);return {rowCount:1,rows:[]};
  }
  throw Error("Unexpected SQL "+sql);
 }});
}
function req(action,body){
 return new Request(ROOT+"/"+action,body?{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)
 }:{method:"GET"});
}
const run=(request,role="owner")=>handleCatalogueBooks({
 request,actor:{role,subject:"owner-test"},db:fakeDb,r2
});
test("DL7C-S Owner can read one global settings record, no R2 is accessed",async()=>{
 const response=await run(req("settings"));
 assert.equal(response.status,200);
 assert.deepEqual((await response.json()).data.settings,{
  flipDurationMs:950,soundEnabled:false,shadowOpacity:0.26,revision:1
 });
 assert.equal((await run(req("settings"),"editor")).status,403);
 assert.equal((await run(new Request(ROOT+"/settings?book=invalid"))).status,400);
});
test("DL7C-S strict allowlist of values and revisions",()=>{
 const good={flipDurationMs:950,soundEnabled:false,shadowOpacity:0.26,revision:1};
 assert.equal(validCatalogueViewerSettings(good),true);
 for(const change of [{flipDurationMs:600},{flipDurationMs:1001},{flipDurationMs:1600},
  {soundEnabled:"true"},{shadowOpacity:0.56},{shadowOpacity:0.265},
  {revision:0},{evil:"hidden"}]){
  assert.equal(validCatalogueViewerSettings({...good,...change}),false,JSON.stringify(change));
 }
});
test("DL7C-S update audits and rejects stale revision",async()=>{
 const change={flipDurationMs:1200,soundEnabled:true,shadowOpacity:0.35,revision:1};
 const good=await run(req("settings",change));
 assert.equal(good.status,200);
 assert.deepEqual((await good.json()).data.settings,{...change,revision:2});
 assert.equal(logs.length,1);
 assert.equal(logs[0][0],2);
 const stale=await run(req("settings",change));
 assert.equal(stale.status,409);
 assert.equal((await stale.json()).error.code,"revision_conflict");
 assert.equal((await run(req("settings",{...change,revision:2,shadowOpacity:1}))).status,400);
});
test("DL7C-S Admin proxy whitelists settings only, no sound control in public reader",async()=>{
 const {readFileSync}=await import("node:fs");
 const get=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
 const proxy=get("apps/admin/app/api/website/catalogue/[[...path]]/route.ts");
 assert.match(proxy,/GET_ACTIONS=new Set\(\["","image","settings","pdf-target"\]\)/);
 assert.match(proxy,/POST_ACTIONS=new Set\(\["settings","create"/);
 const viewer=get("app/catalogue/catalogue-flipbook.tsx");
 assert.doesNotMatch(viewer,/Âm lật: |toggleAudio/);
});
