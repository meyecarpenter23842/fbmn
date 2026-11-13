import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("public HTML index enabled; canonical host agrees with Vercel www",()=>{
 const root=read("app/layout.tsx");
 assert.match(root,/metadataBase: new URL\("https:\/\/www\.fbmn\.vn"\)/);
 assert.match(root,/robots: \{ index: true, follow: true \}/);
 assert.doesNotMatch(root,/index: false, follow: false/);
});
test("robots and sitemap expose only published public pages",()=>{
 const robot=read("app/robots.ts"),site=read("app/sitemap.ts");
 assert.match(robot,/www\.fbmn\.vn\/sitemap\.xml/);
 assert.match(robot,/disallow:\["\/api\/","\/admin\/","\/ceo\/"\]/);
 assert.match(site,/getPublicCatalog\(\)/);
 assert.match(site,/getPublicContent\(\)/);
 assert.match(site,/activeCategoryIds\.has\(category\.id\)/);
 assert.doesNotMatch(site,/\.prices|\.internalNotes/);
});
test("alternate .com.vn hosts permanently redirect to the www.fbmn.vn canonical host",()=>{
 const config=read("next.config.ts");
 assert.match(config,/www\.fbmn\.com\.vn/);
 assert.match(config,/destination: "https:\/\/www\.fbmn\.vn\/:path\*"/);
 assert.match(config,/permanent: true/);
});
test("filtered catalogue routes excluded from index without hiding links",()=>{
 for(const f of ["app/san-pham/page.tsx","app/danh-muc/[slug]/page.tsx"]){
  const source=read(f);
  assert.match(source,/robots:\{index:false,follow:true\}/);
  if(f==="app/san-pham/page.tsx"){
   assert.match(source,/alternates:\{canonical:/);
  }else{
   assert.match(source,/categoryMetadata\(category,catalog,modes\)/);
   assert.match(read("lib/seo/structured-data.ts"),/alternates:\{canonical:url\}/);
  }
 }
});
