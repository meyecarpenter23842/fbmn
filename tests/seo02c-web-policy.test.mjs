import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("SEO02C metadata from live public policy, canonicals remain real",()=>{
 for(const p of ["app/san-pham/[slug]/page.tsx","app/danh-muc/[slug]/page.tsx",
  "app/tin-tuc/[slug]/page.tsx","app/khuyen-mai/[slug]/page.tsx"]){
  assert.match(read(p),/applySeoSetting/);
  assert.match(read(p),/getPublishedSeo/);
 }
 const product=read("app/san-pham/[slug]/page.tsx");
 assert.match(product,/permanentRedirect/);
 assert.match(product,/\?sku=/);
 assert.match(product,/productSeoImages\(product\)/);
 const site=read("app/sitemap.ts");
 for(const kind of ["product","category","article","promotion"]){
  assert.match(site,new RegExp('isNoindex\\(seo,"'+kind+'"'));
 }
 assert.match(site,/getPublicCatalog\(\)/);
 assert.match(site,/getPublicContent\(\)/);
});
test("SEO02C disabled by default, enabled reads must fail closed and never cache",()=>{
 const file=read("lib/seo/public-settings.ts");
 assert.match(file,/FBMN_SEO02_ENABLED!=="true"/);
 assert.match(file,/throw Error\("SEO02C public data unavailable"\)/);
 assert.match(file,/cache:"no-store"/);
 assert.match(file,/robots:\{index:false,follow:true\}/);
 assert.doesNotMatch(file,/localStorage|sessionStorage/);
});
