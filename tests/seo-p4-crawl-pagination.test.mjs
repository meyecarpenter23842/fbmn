import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {paginatedCatalogMetadata} from "../lib/seo/catalogue-pagination.ts";
import {parseCatalogFilters,filtersToParams} from "../lib/catalog/query.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("SEO crawl: unfiltered product page 2 has self canonical and indexable metadata",()=>{
 const data=paginatedCatalogMetadata({requested:2,actual:2,filtered:false});
 assert.equal(data.alternates.canonical,"/san-pham?trang=2");
 assert.equal(data.robots,undefined);
 assert.match(data.title,/Trang 2/);
 assert.match(data.description,/trang 2/);
 assert.equal(paginatedCatalogMetadata({requested:1,actual:1,filtered:false}).alternates.canonical,"/san-pham");
 const page=parseCatalogFilters(new URLSearchParams("trang=3"));
 assert.equal(page.page,3);
 assert.equal(filtersToParams(page).toString(),"trang=3");
});
test("SEO crawl: user searches and filters never create indexable duplicate pages",()=>{
 for(const req of [1,2,100]){
  const data=paginatedCatalogMetadata({requested:req,actual:1,filtered:true});
  assert.equal(data.alternates.canonical,"/san-pham");
  assert.deepEqual(data.robots,{index:false,follow:true});
 }
});
test("SEO crawl: out-of-range page is noindex and points at actual page",()=>{
 const data=paginatedCatalogMetadata({requested:10000,actual:51,filtered:false});
 assert.equal(data.alternates.canonical,"/san-pham?trang=51");
 assert.deepEqual(data.robots,{index:false,follow:true});
});
test("SEO crawl: catalogue links every published listing page in original HTML",()=>{
 const ui=read("components/catalog-ui.tsx");
 assert.match(ui,/results\.page===1 && results\.pages>1/);
 assert.match(ui,/aria-label="Các trang sản phẩm Futurebook"/);
 assert.match(ui,/Array\.from\(\{length:Math\.min\(results\.pages,120\)\}/);
 assert.match(ui,/actionPath\+\(page===1\?""\:"\?trang="\+page\)/);
 assert.match(ui,/filtersToParams\(filters, results\.page \+ 1\)/);
 const page=read("app/san-pham/page.tsx");
 assert.match(page,/const filtered=\["q","nhom","kho","gsm","sap-xep"\]/);
 assert.match(page,/return paginatedCatalogMetadata\(\{requested:filters\.page,actual:page,filtered\}\)/);
 assert.doesNotMatch(page,/const filtered=\[[^\]]*"trang"/);
 const css=read("app/catalog.css");
 assert.match(css,/\.catalog-pages-directory__links a\{[^}]*min-height:var\(--fb-control-height-compact\)/);
 assert.match(css,/\.catalog-pages-directory summary\{[^}]*min-height:var\(--fb-control-height-compact\)[^}]*font-size:var\(--fb-control-font-size\)/);
 assert.match(css,/@media\(max-width:700px\)\{\.catalog-pages-directory summary,\.catalog-pages-directory__links a\{min-height:var\(--fb-control-height-touch\)/);
 const sitemap=read("app/sitemap.ts");
 assert.match(sitemap,/for\(const product of catalog\.products\)/);
 assert.match(sitemap,/!isNoindex\(seo,"product",product\.slug\)/);
});
