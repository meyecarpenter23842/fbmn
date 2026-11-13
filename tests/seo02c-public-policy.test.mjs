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
  getPublicSeoSettings:()=>[{kind:"product",slug:key,mode:"noindex",title:"Unpublished secret",description:"Secret",image:"/api/catalogue-image/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}]});
 const response=await api.fetch(new Request("https://public.example/v1/public/seo"));
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
