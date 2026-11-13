import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const src=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const page=src("app/san-pham/[slug]/page.tsx");
const options=src("components/catalogue-product-options.tsx");
const gallery=src("components/published-image-gallery.tsx");
const related=src("components/catalogue-related-products.tsx");
const card=src("components/catalog-ui.tsx");
const layout=src("app/layout.tsx");
const css=src("app/glass-product-detail.css");
const legacy=src("app/catalog.css");
const foundation=src("app/glass-foundation.css");
const tokens=src("app/globals.css");
const primitive=src("components/glass-ui.tsx");
const clean=s=>s.replace(/\/\*[\s\S]*?\*\//g,"");
const classSet=s=>new Set([...clean(s).matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map(m=>m[1]));

test("G05 extends G03 glass detail to all products, preserving public data and SEO",()=>{
  for(const fragment of [
    "const glass=true",
    "getProductBySlug(catalog, slug)","getPublicCatalog()",
    "getPublishedProductImageUrl(media.r2Key,process.env.NEXT_PUBLIC_MEDIA_BASE_URL)",
    "const recommendations=relatedProducts(catalog,product)",
    "generateMetadata",'<div className="fb-glass-song-page">',
    '<CatalogueProductOptions product={product} photos={images} glass={glass}',
    '<CatalogueRelatedProducts items={recommendations.items} glass={glass}/>'
  ])assert.ok(page.includes(fragment),fragment);
  assert.match(page, /return <CatalogShell><div className="fb-glass-song-page">\{content\}<\/div><\/CatalogShell>/);
  assert.match(layout, /<GlassPageBackdrop className="fb-glass-site"/);
});

test("Glass SKU controls display only the company code with accessible full specifications",()=>{
  const block=options.slice(options.indexOf("if(glass) {"),options.indexOf('return <button type="button" className="catalogue-variant-option"'));
  assert.match(block,/<GlassChip className="fb-song-sku" selected=\{active\} aria-label=\{label\}/);
  assert.match(block,/>\{variant\.sku\}<\/GlassChip>/);
  assert.doesNotMatch(block,/<BookIcon|catalogue-variant-option__name|catalogue-variant-option__code/);
  assert.match(options,/const label="Chọn mã "\+variant\.sku\+": "\+shortVariantLabel\(variant\)/);
  assert.match(options,/<span className="catalogue-variant-option__code">Mã \{variant\.sku\}<\/span>/);
  for(const logic of [
    "useState(initialSku && product.variants.some(v=>v.sku===initialSku)",
    "availableVariantFacets(product.variants)",
    "visibleVariants(product.variants,audience,format)",
    "photosForSku(photos,selected.sku)",
    "moveVariantFacet(product.variants,selected,facet,value,audience,format)",
    "setAudience(next.audience);setFormat(next.format);selectSku(next.sku);",
    "onClick={()=>selectSku(variant.sku)}",
    'selected.price?.kind==="retail"'
  ])assert.ok(options.includes(logic),logic);
  assert.match(options,/className=\{glass\?"fb-song-summary-name":"catalogue-selected-summary__name"\}/);
  assert.match(options,/className=\{glass\?"fb-song-summary-code":"catalogue-selected-summary__code"\}/);
  assert.match(options,/<GlassPanel strong=\{false\} className="fb-song-info">/);
  assert.equal((options.match(/Liên hệ báo giá/g)||[]).length,2);
  assert.equal((options.match(/href="\/#contact"/g)||[]).length,3);
});

test("Gallery uses real images, preserved thumbnail actions, and separate glass classes",()=>{
  assert.match(options, /<PublishedImageGallery key=\{selected\.sku\} items=\{gallery\} glass=\{glass\}[\s\S]*?zoomDialogRef=\{zoomDialogRef\}[\s\S]*?onActiveIndexChange=\{setPhotoIndex\}\/>/);
  assert.match(gallery,/const \[selected,setSelected\]=useState\(0\)/);
  assert.match(gallery,/<CatalogProductImage src=\{current\?\.src\?\?null\} alt=\{current\?\.alt\?\?"Sản phẩm Futurebook"\}/);
  assert.match(gallery,/priority=\{priority&&active===0\}/);
  assert.match(gallery,/<GlassMediaFrame className="fb-song-main-photo">/);
  assert.match(gallery, /<GlassCard className="fb-song-gallery" data-has-media=/);
  assert.match(gallery,/aria-pressed=\{active===i\}/);
  assert.match(gallery, /choose\(i\)/);
  assert.match(gallery,/src=\{img\.src\}/);
  assert.doesNotMatch(gallery,/imagegen|placeholder\.com|unsplash|mockup/i);
});

test("Related products keep source-backed links and exclusively styled glass cards",()=>{
  assert.match(related,/if\(items\.length===0\)return null/);
  assert.match(related,/items\.map\(product=><ProductCard key=\{product\.id\} product=\{product\} glass=\{glass\}\/>\)/);
  assert.match(card,/export function ProductCard\(\{ product, glass = false, priority = false \}/);
  assert.match(card,/<GlassCard hover linkCard className="fb-song-related-card">/);
  assert.match(card,/: <article className="catalog-product">/);
  assert.match(card,/getPublishedProductImageUrl\(media\.r2Key, process\.env\.NEXT_PUBLIC_MEDIA_BASE_URL\)/);
  assert.match(card,/const href = "\/san-pham\/" \+ encodeURIComponent\(product\.slug\)/);
});

test("Glass detail CSS shares NO class selectors with legacy catalogue or shared primitives",()=>{
  assert.match(layout,/import "\.\/glass-foundation\.css";\s*import "\.\/glass-product-detail\.css";/);
  const shared=classSet(foundation);
  const old=classSet(legacy);
  for(const name of classSet(css)){
    assert.match(name,/^(?:fb-song-[a-z0-9-]+|fb-glass-song-page)$/,name);
    assert.ok(!old.has(name),"legacy CSS overlaps "+name);
    assert.ok(!shared.has(name),"shared CSS overlaps "+name);
  }
  assert.doesNotMatch(clean(css),/(?:^|\n)\s*(?:body|html|button|a|article|section)\s*\{/m);
  assert.doesNotMatch(clean(css),/!important|@import|https?:\/\/|cloudflarestorage\.com|\.r2\.dev/);
  assert.doesNotMatch(options,/<GlassChip[^>]*className="catalogue-/);
  assert.doesNotMatch(options,/<GlassPanel[^>]*className="catalog-/);
  assert.doesNotMatch(gallery,/<Glass(?:Card|MediaFrame)[^>]*className="catalog-/);
  assert.doesNotMatch(card,/<GlassCard[^>]*className="catalog-/);
  assert.doesNotMatch(related,/<GlassPanel[^>]*className="catalog-/);
});

test("SKU geometry and interactive colors come ONLY from GlassChip source, never page overrides",()=>{
  assert.doesNotMatch(clean(css),/\.fb-song-sku(?=[\s:.{>])/);
  const skuLayout=clean(css).match(/\.fb-song-sku-grid\s*\{([^}]*)\}/)?.[1];
  assert.ok(skuLayout,"Song Natural SKU layout exists");
  assert.match(skuLayout,/display:\s*flex\s*;/);
  assert.match(skuLayout,/flex-wrap:\s*wrap\s*;/);
  assert.match(skuLayout,/justify-content:\s*flex-start\s*;/);
  assert.doesNotMatch(skuLayout,/grid-template-columns|grid-auto-flow|width\s*:|flex-grow|flex-basis|flex\s*:/);
  assert.match(foundation,/min-height: var\(--fb-control-height-compact\)/);
  assert.match(foundation,/@media \(max-width: 780px\)[\s\S]*?min-height: var\(--fb-control-height-touch\)/);
  assert.match(foundation,/\.fb-glass-chip\[data-selected="true"\]/);
  assert.match(primitive,/aria-pressed=\{selected\}/);
  assert.ok(tokens.includes("--fb-control-height-compact: 36px;"));
  assert.ok(tokens.includes("--fb-control-height-touch: 44px;"));
  assert.equal((tokens.match(/--fb-glass-surface:/g)||[]).length,1);
  assert.match(options,/className=\{glass\?"fb-song-sku-grid":"catalogue-variant-options"\}/);
  assert.match(css,/@media \(max-width: 700px\)/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
});
