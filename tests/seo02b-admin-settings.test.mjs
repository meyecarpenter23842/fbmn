import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseSeoSetting,handleSeoSettings} from "../backend/admin-api/seo-service.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const valid={operation:"save",kind:"product",slug:"sku-"+"a".repeat(32),mode:"noindex",
 title:"",description:"",ogImagePath:null,revision:0};
test("SEO02B enforces stable public keys, modes, no arbitrary og hosts",()=>{
 assert.ok(parseSeoSetting(valid));
 assert.equal(parseSeoSetting({...valid,slug:"../../admin"}),null);
 assert.equal(parseSeoSetting({...valid,kind:"category"}),null);
 assert.ok(parseSeoSetting({...valid,kind:"category",slug:"chua-phan-loai"}));
 assert.equal(parseSeoSetting({...valid,mode:"custom",title:"<script>"}),null);
 assert.equal(parseSeoSetting({...valid,mode:"custom"}),null);
 assert.equal(parseSeoSetting({...valid,mode:"auto",title:"unsafe"}),null);
 assert.equal(parseSeoSetting({...valid,ogImagePath:"https://example.com/x"}),null);
});
test("SEO02B only Owner can reach DB",async()=>{
 let hit=false;
 const response=await handleSeoSettings({request:new Request("https://x.test/v1/admin/website/seo"),
  actor:{role:"editor"},db:()=>{hit=true;}});
 assert.equal(response.status,403);assert.equal(hit,false);
});
test("SEO02B migration grants only private Owner writer and has audit",()=>{
 const src=read("backend/neon/migrations/20261113_seo02b_admin_settings.up.sql");
 assert.match(src,/web_seo_settings_audit/);
 assert.match(src,/REVOKE ALL ON/);
 assert.doesNotMatch(src,/GRANT (SELECT|INSERT) ON fbmn_catalog_private\.web_seo_settings TO fbmn_public_reader/);
 assert.match(read("backend/admin-api/handler.mjs"),/handleSeoSettings\(params\)/);
});

test("SEO02B limits GET to bounded pages without exposing private other data",async()=>{
 let lastSql="";
 const db=async run=>run({query:async (sql,params)=>{lastSql=sql;
  assert.deepEqual(params,[200]);return {rows:Array.from({length:201},(_,i)=>({slug:"x-"+i}))};}});
 const r=await handleSeoSettings({request:new Request("https://x.test/v1/admin/website/seo?page=2"),
  actor:{role:"owner"},db});
 assert.equal(r.status,200);
 const data=(await r.json()).data;
 assert.equal(data.items.length,200);assert.equal(data.page,2);assert.equal(data.hasMore,true);
 assert.match(lastSql,/LIMIT 201 OFFSET \$1/);
});
