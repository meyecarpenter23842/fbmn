import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createPublicApi} from "../backend/public-api/handler.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const catalog=()=>({categories:[],products:[]});
const content=()=>({company:null,articles:[],promotions:[],dealerInformation:null});
test("SEO02C endpoint must be opt-in and read no other endpoint",async()=>{
 const api=createPublicApi({getPublicCatalog:catalog,getPublicContent:content,
  getPublicSeoSettings:()=>[{kind:"product",slug:"sku-"+"a".repeat(32),mode:"noindex"}]});
 const r=await api.fetch(new Request("https://example.com/v1/public/seo"));
 assert.equal(r.status,404);
});
test("SEO02C public DTO never includes noindex hidden title/image",async()=>{
 const slug="sku-"+"a".repeat(32);
 const api=createPublicApi({getPublicCatalog:catalog,getPublicContent:content,
  seoEnabled:true,getPublicSeoSettings:()=>[{
    kind:"product",slug,mode:"noindex",title:"Secret",description:"Secret",image:"/api/catalogue-image/00000000-0000-0000-0000-000000000000"
  }]});
 const res=await api.fetch(new Request("https://example.com/v1/public/seo"));
 assert.equal(res.status,200);
 assert.deepEqual((await res.json()).data.items,[{kind:"product",slug,mode:"noindex"}]);
 assert.equal(res.headers.get("cache-control"),"no-store");
});
test("SEO02C schema is a narrow read-only public projection with a publication check",()=>{
 const sql=read("backend/neon/migrations/20261113_seo02c_public_projection.up.sql");
 const model=read("backend/public-api/read-model.mjs");
 const worker=read("backend/public-api/staging-worker.mjs");
 assert.match(sql,/security_barrier=true/);
 assert.match(sql,/REVOKE ALL ON/);
 assert.match(sql,/GRANT SELECT ON fbmn_public.v_web_seo_settings TO fbmn_public_reader/);
 assert.doesNotMatch(sql,/GRANT (INSERT|UPDATE|DELETE)/);
 assert.match(model,/products\.set\(product\.slug,product\)/);
 assert.match(model,/categories\.has\(requested\)/);
 assert.match(model,/getPublicCms/);
 assert.match(worker,/PUBLIC_SEO02_ENABLED==="true"/);
 assert.doesNotMatch(read("backend/public-api/handler.mjs"),/seo_price|net_price|pricebook/);
});
