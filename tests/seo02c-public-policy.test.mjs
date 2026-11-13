import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createPublicApi} from "../backend/public-api/handler.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const defaultGetCatalog=()=>({categories:[],products:[]});
const defaultGetContent=()=>({company:null,articles:[],promotions:[],dealerInformation:null});
test("SEO02C public settings route is explicitly gated",async()=>{
 const api=createPublicApi({getPublicCatalog:defaultGetCatalog,getPublicContent:defaultGetContent,
  getPublicSeoSettings:()=>[{kind:"product",slug:"sku-"+"a".repeat(32),mode:"noindex"}]});
 const response=await api.fetch(new Request("https://public.example/v1/public/seo"));
 assert.equal(response.status,404);
});
test("SEO02C does not leak private titles on noindex entries",async()=>{
 const key="sku-"+"a".repeat(32);
 const api=createPublicApi({getPublicCatalog:defaultGetCatalog,getPublicContent:defaultGetContent,seoEnabled:true,
  getPublicSeoSettings:({contentSource})=>{
   assert.equal(contentSource,"legacy");
   return [{kind:"product",slug:key,mode:"noindex",title:"Unpublished secret",description:"Secret",image:"/api/catalogue-image/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}];
  }});
 const response=await api.fetch(new Request("https://public.example/v1/public/seo?contentSource=legacy"));
 assert.equal(response.status,200);
 assert.deepEqual((await response.json()).data.items,[{kind:"product",slug:key,mode:"noindex"}]);
});
test("SEO02C filters unpublished settings before public API, and sitemap honors noindex",()=>{
 const model=read("backend/public-api/read-model.mjs");
 assert.match(model,/const products=new Map/);
 assert.match(model,/activeCategoryIds/);
 assert.match(model,/legacySlugs/);
 assert.match(model,/content\.articles/);
 assert.match(read("app/sitemap.ts"),/!isNoindex\(seo,"product",product.slug\)/);
 assert.match(read("app/sitemap.ts"),/!isNoindex\(seo,"category",category.slug\)/);
 assert.match(read("backend/neon/migrations/20261113_seo02c_public_projection.up.sql"),/security_barrier=true/);
});

test("SEO02C canonical mode auto cancels a saved legacy override",()=>{
 const policy=read("backend/public-api/read-model.mjs");
 assert.ok(policy.includes('!["auto","custom","noindex"].includes(mode)'));
 assert.ok(policy.includes('return [...settings.values()].filter(item=>item.mode!=="auto")'));
 assert.ok(read("backend/neon/migrations/20261113_seo02c_public_projection.up.sql")
  .includes("IN ('auto','custom','noindex')"));
});
test("SEO02C selects the same content source as Web CMS, with fail-closed fallback",()=>{
 assert.ok(read("lib/seo/public-settings.ts").includes('cmsEnabled()?"cms":"legacy"'));
 assert.ok(read("backend/public-api/read-model.mjs").includes('contentSource==="cms"?this.getPublicCms():this.getPublicContent()'));
 assert.ok(read("lib/content/adapter.ts").includes('if(process.env.FBMN_SEO02_ENABLED==="true")'));
});
test("SEO02C Owner-selected image may be any published variant",()=>{
 assert.ok(read("app/san-pham/[slug]/page.tsx").includes("productApprovedSeoImages(product)"));
 assert.ok(read("lib/seo/structured-data.ts").includes("for(const item of product.media){"));
});
test("SEO02C rejects missing or invalid CMS/legacy selection",async()=>{
 const api=createPublicApi({getPublicCatalog:defaultGetCatalog,getPublicContent:defaultGetContent,seoEnabled:true,
  getPublicSeoSettings:()=>{throw Error("Should not be called");}});
 for(const suffix of ["","?contentSource=unexpected"]){
  const r=await api.fetch(new Request("https://public.example/v1/public/seo"+suffix));
  assert.equal(r.status,400);
 }
});
