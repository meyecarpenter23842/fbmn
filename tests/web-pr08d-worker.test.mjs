import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createStagingWorker} from "../backend/public-api/staging-worker.mjs";

const url=path=>new Request("https://public.example.invalid"+path);
const env=()=>({
 HYPERDRIVE:{connectionString:"fake-testing-uri"},
 RATE_LIMITER:{limit:async()=>({success:true})},
 EXPECTED_DB_ROLE:"fbmn_public_http_staging",
 PUBLIC_ALLOWED_ORIGINS:"https://fbmn-web.vercel.app"
});
function setup({wrongRole=false,queryFailure=false}={}) {
 const history={connections:0,closes:0,statements:[]};
 const worker=createStagingWorker({createDbClient:()=>({
   async connect(){history.connections++},
   async query(sql){
     history.statements.push(sql);
     if(sql==="SELECT current_user AS role_name")
       return {rows:[{role_name:wrongRole?"neondb_owner":"fbmn_public_http_staging"}]};
     if(queryFailure)throw Error("private-error-token");
     assert.match(sql,/FROM fbmn_public[.]v_/);
     return {rows:[]};
   },
   async end(){history.closes++}
 })});
 return {worker,history};
}
test("200 public categories, products, content with 0 verified publications",async()=>{
 const {worker,history}=setup();
 for(const route of ["/v1/public/categories","/v1/public/products","/v1/public/content"]){
   const r=await worker.fetch(url(route),env());
   assert.equal(r.status,200,route);
   assert.ok((await r.json()).data!==undefined);
 }
 assert.equal(history.connections,3);assert.equal(history.closes,3);
 assert.equal(history.statements.filter(s=>s==="SELECT current_user AS role_name").length,3);
});
test("400 invalid query, 404 unknown route, 405 write, without DB calls",async()=>{
 const {worker,history}=setup();
 assert.equal((await worker.fetch(url("/v1/public/products?net=1"),env())).status,400);
 assert.equal((await worker.fetch(url("/v1/private/prices"),env())).status,404);
 assert.equal((await worker.fetch(new Request("https://x.invalid/v1/public/content",{method:"POST"}),env())).status,405);
 assert.equal(history.connections,0);
});
test("403 origin denied, 200 allowed browser origin",async()=>{
 const {worker,history}=setup();
 const rejected=await worker.fetch(new Request("https://x.invalid/v1/public/content",{headers:{Origin:"https://evil.example"}}),env());
 assert.equal(rejected.status,403);
 assert.equal(rejected.headers.get("access-control-allow-origin"),null);
 const allowed=await worker.fetch(new Request("https://x.invalid/v1/public/content",{headers:{Origin:"https://fbmn-web.vercel.app"}}),env());
 assert.equal(allowed.status,200);
 assert.equal(allowed.headers.get("access-control-allow-origin"),"https://fbmn-web.vercel.app");
 assert.equal(history.connections,1);
});
test("429 mandatory rate binding happens before any DB query",async()=>{
 const {worker,history}=setup(),e=env();
 e.RATE_LIMITER={limit:async()=>({success:false})};
 const r=await worker.fetch(url("/v1/public/products"),e);
 assert.equal(r.status,429);assert.equal(r.headers.get("cache-control"),"no-store");
 assert.equal(history.connections,0);
});
test("503 fail closed on missing bindings, rate failure, wrong role and query error",async()=>{
 const {worker,history}=setup({wrongRole:true}),e=env();
 for(const bad of [{...e,HYPERDRIVE:null},{...e,RATE_LIMITER:null},
   {...e,RATE_LIMITER:{limit:async()=>{throw Error("bad rate")}}}]) {
   const r=await worker.fetch(url("/v1/public/products"),bad);
   assert.equal(r.status,503);
 }
 const wrong=await worker.fetch(url("/v1/public/products"),e);
 assert.equal(wrong.status,503);assert.equal(history.connections,1);assert.equal(history.closes,1);
 assert.doesNotMatch(await wrong.text(),/neondb_owner|password/);
 const x=setup({queryFailure:true});
 const failure=await x.worker.fetch(url("/v1/public/products"),e);
 assert.equal(failure.status,503);
 assert.doesNotMatch(await failure.text(),/private-error-token/);
});
test("OPTIONS preflight does not create DB connections",async()=>{
 const {worker,history}=setup();
 const r=await worker.fetch(new Request("https://x.invalid/v1/public/content",{
  method:"OPTIONS",headers:{Origin:"https://fbmn-web.vercel.app"}
 }),env());
 assert.equal(r.status,204);assert.equal(history.connections,0);
});
test("staging Worker binds the dedicated public read-only Hyperdrive, never B2B",()=>{
 const config=JSON.parse(readFileSync(new URL("../backend/public-api/wrangler.jsonc",import.meta.url),"utf8"));
 assert.equal(config.workers_dev,false);
 assert.notEqual(config.hyperdrive[0].id,"680f8ad608b845039dcb889240ace3d2");
 assert.equal(config.ratelimits[0].name,"RATE_LIMITER");
 assert.equal(config.vars.EXPECTED_DB_ROLE,"fbmn_public_http_staging");
 assert.equal(config.hyperdrive[0].id,"a49c268446874bda9c9f0c0ec2777e7e");
});
