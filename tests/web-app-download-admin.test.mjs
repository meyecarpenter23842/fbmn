import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DEFAULT_APP_DOWNLOAD,validateStoreUrl,validateAppDownload,handleAppDownloadSettings}
 from "../backend/admin-api/app-download-service.mjs";
import {createPublicApi,projectPublicAppDownload} from "../backend/public-api/handler.mjs";
import {getAppStoreLink,parseAppDownloadConfig} from "../lib/app-download/config.ts";
import {getNextAutoPromptDelay} from "../lib/app-download/schedule.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const raw=()=>({...DEFAULT_APP_DOWNLOAD});
const validAndroid="https://play.google.com/store/apps/details?id=vn.fbmn.futurebook";
const validIos="https://apps.apple.com/vn/app/futurebook/id1234567890";

test("Owner App config accepts only verified store hosts and bounded content",()=>{
 assert.equal(validateAppDownload(raw()),true);
 assert.equal(validateAppDownload({...raw(),message:"Tải ứng dụng iOS\nhoặc Android"}),true);
 assert.equal(validateStoreUrl(validIos,"ios"),true);
 assert.equal(validateStoreUrl(validAndroid,"android"),true);
 assert.equal(getAppStoreLink("ios",{...raw(),iosUrl:validIos}),validIos);
 assert.equal(getAppStoreLink("android",{...raw(),androidUrl:validAndroid}),validAndroid);
 const bad=[
  {...raw(),iosUrl:"https://evil.example/collect"},
  {...raw(),iosUrl:"http://apps.apple.com/vn/app/x"},
  {...raw(),iosUrl:"https://apps.apple.com.evil.example/vn/app/x"},
  {...raw(),androidUrl:"https://play.google.com/store/apps/details?redirect=https://evil.test&id=com.foo"},
  {...raw(),androidUrl:"https://play.google.com/store/apps/details?id=bad%0A"},
  {...raw(),cooldownMinutes:0},
  {...raw(),firstDelayMs:120000},
  {...raw(),title:"<img src=x>"},
  {...raw(),secret:"not-public"}
 ];
 for(const x of bad)assert.equal(validateAppDownload(x),false,JSON.stringify(x));
 assert.equal(parseAppDownloadConfig(raw())?.revision,1);
 assert.equal(parseAppDownloadConfig({...raw(),androidUrl:"https://other.example"}),null);
 assert.equal(getNextAutoPromptDelay(10000000,9000000,3000,1800000),800000);
});

test("Owner GET/POST is audited, revision-gated and never fakes save",async()=>{
 const actor={role:"owner",subject:"test-owner"};
 let state={popup_enabled:true,button_enabled:true,first_delay_ms:1400,cooldown_minutes:120,
  title:DEFAULT_APP_DOWNLOAD.title,message:DEFAULT_APP_DOWNLOAD.message,ios_url:null,android_url:null,revision:1};
 const statements=[];
 const db=async fn=>fn({query:async(sql,args=[])=>{
  statements.push(sql);
  if(sql.startsWith("SELECT"))return {rows:[{...state}]};
  if(sql.startsWith("UPDATE")){
   state={popup_enabled:args[0],button_enabled:args[1],
    first_delay_ms:args[2],cooldown_minutes:args[3],title:args[4],message:args[5],
    ios_url:args[6],android_url:args[7],revision:state.revision+1};
   return {rows:[{...state}]};
  }
  return {rows:[]};
 }});
 const url="https://worker.example/v1/admin/website/app-download";
 const request=(body)=>new Request(url,{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify(body)});
 assert.equal((await handleAppDownloadSettings({request:new Request(url),actor:{role:"editor",subject:"x"},db})).status,403);
 assert.equal(statements.length,0,"denied users never touch SQL");
 const get=await handleAppDownloadSettings({request:new Request(url),actor,db});
 assert.equal(get.status,200);
 assert.equal((await get.json()).data.settings.popupEnabled,true);
 assert.equal((await handleAppDownloadSettings({request:request({operation:"save",...raw(),androidUrl:"https://evil.test"}),actor,db})).status,400);
 assert.equal((await handleAppDownloadSettings({request:request({operation:"save",...raw(),androidUrl:validAndroid}),actor,db})).status,200);
 assert.equal(state.revision,2);
 assert.equal(state.android_url,validAndroid);
 assert.ok(statements.some(sql=>sql.startsWith("INSERT INTO")&&sql.includes("_audit")));
 assert.equal((await handleAppDownloadSettings({request:request({operation:"save",...raw()}),actor,db})).status,409);
 assert.equal((await handleAppDownloadSettings({request:new Request(url+"?draft=true"),actor,db})).status,400);
});

test("public route projects only presentation settings; no JWT/admin/private fields",async()=>{
 const cfg={...raw(),iosUrl:validIos,androidUrl:validAndroid};
 const projected=projectPublicAppDownload({...cfg,updatedBy:"private",token:"secret"});
 assert.deepEqual(projected,cfg);
 assert.ok(!JSON.stringify(projected).includes("secret"));
 assert.throws(()=>projectPublicAppDownload({...cfg,iosUrl:"https://example.invalid"}));
 const api=createPublicApi({getPublicCatalog:async()=>({categories:[],products:[]}),
   getPublicContent:async()=>({company:null,articles:[],promotions:[],dealerInformation:null}),
   getPublicAppDownload:async()=>({...cfg,updatedBy:"not-for-clients"})});
 const url="https://worker.example/v1/public/app-download";
 const resp=await api.fetch(new Request(url));
 assert.equal(resp.status,200);
 assert.equal(resp.headers.get("Cache-Control"),"no-store");
 assert.equal((await resp.json()).data.revision,1);
 assert.equal((await api.fetch(new Request(url+"?test=1"))).status,400);
 assert.equal((await api.fetch(new Request(url,{method:"POST"}))).status,405);
});

test("Admin, Worker, Website and Neon migrations form a complete real settings path",()=>{
 const source=[
  read("backend/admin-api/handler.mjs"),read("apps/admin/app/page.tsx"),
  read("apps/admin/app/app-download-settings-manager.tsx"),
  read("backend/public-api/read-model.mjs"),read("backend/public-api/staging-worker.mjs"),
  read("app/api/app-download/route.ts"),read("components/app-download.tsx")
 ];
 assert.match(source[0],/handleAppDownloadSettings\(params\)/);
 assert.match(source[1],/section==="app-download"/);
 assert.match(source[2],/\/api\/website\/app-download/);
 assert.match(source[3],/v_web_app_download_settings LIMIT 2/);
 assert.match(source[4],/getPublicAppDownload/);
 assert.match(source[5],/cache:"no-store"/);
 assert.match(source[6],/parseAppDownloadConfig/);
 assert.match(source[6],/configRefreshing\.current/);
 assert.match(source[6],/settings\.cooldownMinutes\*60_000/);
 assert.match(source[6],/settings\?\.buttonEnabled/);
 const migration=read("backend/neon/migrations/20261114_web_app_download_config.up.sql");
 assert.match(migration,/web_app_download_settings_audit/);
 assert.match(migration,/GRANT SELECT ON fbmn_public\.v_web_app_download_settings TO fbmn_public_reader,fbmn_p5_public_login/);
 assert.match(migration,/security_barrier=true/);
 assert.doesNotMatch(migration,/ALTER TABLE fbmn_catalog\.skus|DROP TABLE fbmn_catalog\.skus/);
 const adminRelay=read("apps/admin/app/api/website/app-download/route.ts");
 assert.match(adminRelay,/origin_forbidden/);
 assert.match(adminRelay,/authorization/);
 assert.doesNotMatch(adminRelay,/Access-Control-Allow-Origin": "\*"/);
});
