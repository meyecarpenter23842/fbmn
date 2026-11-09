import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = path => readFileSync(new URL("../"+path, import.meta.url),"utf8");
const catalog=read("app/catalog.css"),related=read("app/glass-product-detail.css");
const home=read("app/rebaseline.css"),product=read("components/catalog-ui.tsx");

test("DL2 verified cover has larger stage, compact padding, never crops cover",()=>{
 const stage=related.match(/\.fb-song-related-image\s*\{([^}]+)\}/)?.[1];
 assert.ok(stage,"One related/catalog glass stage style owner");
 assert.match(stage,/height:\s*clamp\(216px, 22vw, 270px\)/);
 assert.match(stage,/position:\s*relative/);
 assert.match(stage,/overflow:\s*hidden/);
 assert.match(catalog,/\.catalog-real-image\s*\{\s*object-fit:\s*contain/);
 assert.match(catalog,/\.catalog-real-image\.catalog-image-compact\s*\{\s*padding:\s*5px/);
 assert.match(catalog,/\.catalog-product__image\s*\{[^}]*min-height:\s*230px;\s*aspect-ratio:\s*4 \/ 5/);
 assert.doesNotMatch(catalog+related,/object-fit:\s*cover/);
});

test("DL2 touch cards remain full-row horizontal with larger image and readable content",()=>{
 assert.match(related,/@media \(max-width: 700px\)[\s\S]*\.fb-song-related-grid\s*\{\s*grid-template-columns:\s*1fr/);
 assert.match(related,/\.fb-song-related-hit\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*minmax\(105px, 40%\) minmax\(0,1fr\)/);
 assert.match(related,/\.fb-song-related-image\s*\{\s*width:\s*100%;\s*height:\s*clamp\(148px, 41vw, 168px\)/);
 assert.match(related,/\.fb-song-related-body h3\s*\{[^}]*font-size:\s*14px/);
 assert.match(product,/aria-label=\{"Xem sản phẩm " \+ product\.name\}/);
 assert.match(product,/prefetch=\{false\}/);
 const block=product.slice(product.indexOf("export function ProductCard("),product.indexOf("export function formatRetail"));
 assert.equal((block.match(/<Link\b/g)||[]).length,1);
});

test("DL2 homepage preview is enlarged but remains clearly labelled demo until DL3",()=>{
 assert.match(home,/\.ref-product-card__image\s*\{[^}]*min-height:\s*238px/);
 assert.match(home,/\.ref-product-card__image \.notebook\s*\{[^}]*width:\s*min\(80%, 146px\);\s*height:\s*auto;\s*aspect-ratio:\s*106 \/ 155/);
 assert.doesNotMatch(home,/\.ref-product-card__image \.notebook\s*\{\s*transform:\s*scale/);
 assert.match(home,/@media \(max-width: 800px\)[\s\S]*\.ref-product-card__image\s*\{\s*min-height:\s*190px/);
 assert.match(home,/\.ref-product-card__image \.notebook\s*\{\s*width:\s*min\(78%, 110px\)/);
 assert.match(read("app/page.tsx"),/MẪU GIAO DIỆN/);
 assert.match(read("app/page.tsx"),/previewProducts\.map/);
 assert.match(read("app/page.tsx"),/ref-preview-note/);
});

test("DL2 respects Premium Glass style owner and does not change product data or NET",()=>{
 const foundation=read("app/glass-foundation.css");
 assert.doesNotMatch(foundation,/(?:^|\n)\s*(?:\.ref-|\.catalog-|\.content-|\.site-footer)/m);
 for(const [path,s] of Object.entries({home,catalog,related})){
  assert.equal((s.match(/\{/g)||[]).length,(s.match(/\}/g)||[]).length,path+" balanced CSS");
 }
 assert.match(product,/getPublishedProductImageUrl\(media\.r2Key/);
 assert.doesNotMatch(product,/NET_PRICE|dealerPrice|private_price|checkout/i);
 assert.match(read("docs/roadmap.md"),/DL2 — Thẻ sản phẩm ảnh lớn/);
});
