import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {selectHomeCatalog} from "../lib/catalog/home.ts";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const cat=(id,slug,name)=>({id,slug,name,sortOrder:1,group:"stationery"});
const p=(id,categoryId)=>({id,categoryId,name:"Hàng công khai "+id,slug:"sku-"+id,
 variants:[{sku:"00"+id,name:id,price:null,specifications:{paperSize:"A4"}}],media:[]});
test("DL8: holding category never becomes an indexed homepage tile or semantic category",()=>{
 const hold=cat("p5-uncategorized","chua-phan-loai","Chưa phân loại");
 const data={categories:[hold],products:[p("a",hold.id),p("b",hold.id)]};
 const visible=selectHomeCatalog(data);
 assert.deepEqual(visible.categories,[],"internal category is not public navigation");
 assert.deepEqual(visible.products.map(x=>x.id),["a","b"],"do not erase valid published SKUs");
 assert.equal(data.categories[0].name,"Chưa phân loại","original DTO is untouched");
 const named=cat("cat-real","so-ghi-chep","Sổ ghi chép");
 const mixed=selectHomeCatalog({categories:[hold,named],products:[...data.products,p("c",named.id)]});
 assert.deepEqual(mixed.categories.map(x=>x.id),["cat-real"]);
 assert.deepEqual(mixed.products.map(x=>x.id),["c"]);
 for(const hidden of [
  cat("custom","chua-phan-loai","VPP"),
  cat("custom2","other","Chưa phân loại")]){
  assert.deepEqual(selectHomeCatalog({categories:[hidden],products:[p("t",hidden.id)]}).categories,[]);
 }
 const homepage=source("app/page.tsx");
 assert.match(homepage,/categories\.length>0&&<CategoryNavigation/);
 assert.match(homepage,/href="\/san-pham"/);
});
test("DL8: missing product/category must throw notFound before metadata; holding category noindex",()=>{
 const product=source("app/san-pham/[slug]/page.tsx");
 const category=source("app/danh-muc/[slug]/page.tsx");
 const site=source("app/sitemap.ts");
 assert.match(product,/generateMetadata[\s\S]*if\(!product\)notFound\(\);/);
 assert.match(category,/generateMetadata[\s\S]*if\(!category\)notFound\(\);/);
 assert.match(category,/holdingCategory[\s\S]*robots:\{index:false,follow:true\}/);
 assert.match(site,/category\.id!=="p5-uncategorized"/);
});
test("DL8: intake is same-origin, validation before proxy, committed success only",()=>{
 for(const path of ["app/api/contact/route.ts","app/api/gia-cong/route.ts"]){
  const route=source(path);
  assert.match(route,/request\.headers\.get\("origin"\)!==url\.origin/);
  assert.match(route,/request\.headers\.get\("sec-fetch-site"\)==="cross-site"/);
  assert.match(route,/content-length/);
  assert.match(route,/const body=await boundedJson\(request\),checked=validate/);
  assert.match(route,/if\(!checked\.ok\)return fail\(400,checked\.error\)/);
  assert.match(route,/response\.status===201/);
  assert.match(route,/if\(result\?\.ok===true\)return Response\.json\(\{ok:true\},\{status:201/);
  assert.match(route,/Cache-Control":"no-store"/);
 }
 const contact=source("components/contact-request-form.tsx");
 assert.match(contact,/r\.status===201&&result\?\.ok===true/);
 assert.match(contact,/INTERESTS\.map/);
 assert.match(contact,/PROVINCES\.map/);
 assert.match(contact,/consent/);
});
test("DL8: no private pricing exposed in SEO + strict noindex policies",()=>{
 const seo=source("lib/seo/structured-data.ts");
 const site=source("app/sitemap.ts");
 const policy=source("app/policy/page.tsx");
 const products=source("components/catalog-ui.tsx");
 assert.doesNotMatch(seo,/aggregateRating|@type:"Offer"|dealershipNetPrice/);
 assert.doesNotMatch(site,/api\/ceo|\/admin\//);
 assert.match(policy,/robots: \{ index: true, follow: true \}/);
 assert.match(products,/formatRetail/);
 assert.match(source("app/san-pham/page.tsx"),/robots:\{index:false,follow:true\}/);
});
test("DL8: browser audit is read-only and covers Chromium/WebKit and a11y",()=>{
 const script=source("scripts/dl8-browser-audit.mjs"),flow=source(".github/workflows/dl8-browser-audit.yml");
 assert.match(script,/chromium,webkit/);
 assert.match(script,/axe\.run/);
 assert.match(script,/read-only/);
 assert.match(script,/POST","PUT","PATCH","DELETE"/);
 assert.match(script,/360/);
 assert.match(script,/390/);
 assert.match(script,/1280/);
 assert.match(script,/1440/);
 assert.match(flow,/pull_request:/);
 assert.match(flow,/permissions:\s*\n  contents: read/);
 assert.match(flow,/upload-artifact/);
 assert.doesNotMatch(flow,/VERCEL_TOKEN|NEON|R2_SECRET|deploy --prod/);
});
