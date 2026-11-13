import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Product pages emit WebPage and BreadcrumbList, not ineligible Product rich results",()=>{
 const page=read("app/san-pham/[slug]/page.tsx");
 const structured=read("lib/seo/structured-data.ts");
 assert.match(page,/SeoJsonLd data=\{productLandingPageSchema\(product\)\}/);
 assert.match(page,/SeoJsonLd data=\{breadcrumbSchema\(/);
 assert.doesNotMatch(page,/SeoJsonLd data=\{productSchema\(product\)\}/);
 assert.match(structured,/export function productLandingPageSchema\(product:PublicProduct\)/);
 assert.match(structured,/"@type":"WebPage"/);
 assert.match(structured,/primaryImageOfPage/);
 assert.match(structured,/productSeoDescription\(product\)/);
 assert.match(structured,/encodeURIComponent\(product\.slug\)/);
 assert.doesNotMatch(structured,/"@type":"Product"/);
});

test("Site remains indexable with real canonical/OG metadata but no fabricated review or offer",()=>{
 const structured=read("lib/seo/structured-data.ts");
 const page=read("app/san-pham/[slug]/page.tsx");
 assert.match(page,/productMetadata\(product\)/);
 assert.match(page,/productApprovedSeoImages\(product\)/);
 assert.match(page,/initialSku=\{selectedSku\}/);
 assert.match(structured,/alternates:\{canonical:url\}/);
 assert.match(structured,/openGraph:/);
 assert.doesNotMatch(structured,/aggregateRating:|review:|offers:|priceValidUntil:|\.prices|\.internalNotes/);
 assert.match(read("app/layout.tsx"),/organizationSchema\(\)/);
});
