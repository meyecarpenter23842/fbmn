import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("product metadata uses only published catalogue and never internal NET",()=>{
 const product=read("app/san-pham/[slug]/page.tsx"),seo=read("lib/seo/structured-data.ts");
 assert.match(product,/productMetadata\(product\)/);
 assert.match(product,/permanentRedirect\(/);
 assert.match(product,/notFound\(\)/);
 assert.match(seo,/getPublishedProductImageUrl/);
 assert.match(seo,/product\.variants\.length===1/);
 assert.doesNotMatch(seo,/offers:|aggregateRating:|priceValidUntil:|\.internalNotes|\.prices/);
});
test("category filters retain noindex; articles are structured from published content only",()=>{
 const category=read("app/danh-muc/[slug]/page.tsx");
 const news=read("app/tin-tuc/[slug]/page.tsx");
 assert.match(category,/robots:\{index:false,follow:true\}/);
 assert.match(category,/breadcrumbSchema/);
 assert.match(news,/articleMetadata\(item\)/);
 assert.match(news,/articleSchema\(item\)/);
 assert.match(news,/notFound\(\)/);
});
test("JSON-LD is escaped and organization is sourced from the approved host",()=>{
 assert.match(read("lib/seo/json-ld.tsx"),/replace\(\/<\/g/);
 assert.match(read("app/layout.tsx"),/organizationSchema\(\)/);
 assert.match(read("lib/seo/structured-data.ts"),/https:\/\/www\.fbmn\.vn/);
});
