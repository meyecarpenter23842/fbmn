import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("SEO04 Hero does not request every overlapping slide on initial render",()=>{
 const hero=read("components/cms-hero-carousel.tsx");
 assert.match(hero,/new Set\(\[0\]\)/);
 assert.match(hero,/prepared\.has\(i\)/);
 assert.match(hero,/Math\.max\(2500,current\.motion\.intervalMs-2500\)/);
 assert.match(hero,/prefers-reduced-motion: reduce/);
 assert.match(hero,/onClick=\{\(\)=>reveal\(i\)\}/);
 assert.match(hero,/priority=\{i===0\}/);
});
test("SEO04 prioritizes only main catalogue product image; other images remain lazy",()=>{
 const image=read("components/catalog-product-image.tsx");
 assert.match(image,/priority=\{priority\}/);
 assert.match(image,/loading=\{priority\?undefined:"lazy"\}/);
 assert.match(image,/fetchPriority=\{priority\?"high":undefined\}/);
 assert.match(image,/unoptimized/);
 assert.match(read("components/catalog-ui.tsx"),/priority=\{index===0\}/);
 assert.match(read("components/catalogue-product-options.tsx"),/PublishedImageGallery key=\{selected\.sku\} items=\{gallery\} glass=\{glass\} priority/);
 assert.match(read("components/published-image-gallery.tsx"),/width=\{80\} height=\{100\}/);
});
test("SEO04 sitemap index only category listings that match Family/SKU display",()=>{
 const site=read("app/sitemap.ts");
 assert.match(site,/getPublicCategoryDisplay\(\)/);
 assert.match(site,/catalogueListingCards\(catalog,modes\)/);
 assert.match(site,/!isNoindex\(seo,"category",category\.slug\)/);
 assert.match(site,/!isNoindex\(seo,"product",product\.slug\)/);
 assert.doesNotMatch(site,/variant\.categoryId\)activeCategoryIds\.add/);
 assert.match(read("lib/seo/structured-data.ts"),/category\.id!=="p5-uncategorized"/);
 for(const path of ["app/san-pham/page.tsx","app/danh-muc/[slug]/page.tsx"])
  assert.match(read(path),/robots:\{index:false,follow:true\}/);
});
test("SEO04 browser audit never requests authenticated private data or claims real field CWV",()=>{
 const audit=read("scripts/seo04-mobile-audit.mjs");
 const workflow=read(".github/workflows/seo04-mobile-audit.yml");
 assert.match(workflow,/permissions:\s*\n  contents: read/);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(audit,/https:\/\/www\.fbmn\.vn/);
 assert.match(audit,/NOT CrUX\/Search Console field/);
 assert.doesNotMatch(audit,/admin\.fbmn\.vn|api\/website\/seo|credentials:/);
});
