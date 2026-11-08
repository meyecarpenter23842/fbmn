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

test("G03 stays on the approved Song Natural slug, preserves public data, media and SEO",()=>{
  for(const fragment of [
    'const glass=slug==="sku-3ac08ff247847c1e77bfccb0e806ed29"',
    "getProductBySlug(catalog, slug)","getPublicCatalog()",
    "getPublishedProductImageUrl(media.r2Key,process.env.NEXT_PUBLIC_MEDIA_BASE_URL)",
    "const recommendations=relatedProducts(catalog,product)",
    "generateMetadata",'<GlassPageBackdrop className="fb-glass-song-page">',
    '<CatalogueProductOptions product={product} photos={images} glass={glass}/>',
    '<CatalogueRelatedProducts items={recommendations.items} glass={glass}/>'
  ])assert.ok(page.includes(fragment),fragment);
  assert.match(page,/: content\}<\/CatalogShell>/);
});

test("Glass SKU controls display only the company code with accessible full specifications",()=>{
  const block=options.slice(options.indexOf("if(glass) {"),options.indexOf('return <button type="button" className="catalogue-variant-option"'));
  assert.match(block,/<GlassChip className="fb-song-sku" selected=\{active\} aria-label=\{label\}/);
  assert.match(block,/>\{variant\.sku\}<\/GlassChip>/);
  assert.doesNotMatch(block,/<BookIcon|catalogue-variant-option__name|catalogue-variant-option__code/);
  assert.match(options,/const label="Chọn mã "\+variant\.sku\+": "\+shortVariantLabel\(variant\)/);
  assert.match(options,/<span className="catalogue-variant-option__code">Mã \{variant\.sku\}<\/span>/);
  for(const logic of [
    "useState(product.variants[0].sku)",
    "availableVariantFacets(product.variants)",
    "visibleVariants(product.variants,audience,format)",
    "photosForSku(photos,selected.sku)",
    "moveVariantFacet(product.variants,selected,facet,value,audience,format)",
    "setAudience(next.audience);setFormat(next.format);setSku(next.sku);",
    "onClick={()=>setSku(variant.sku)}",
    'selected.price?.kind==="retail"'
  ])assert.ok(options.includes(logic),logic);
  assert.match(options,/className=\{glass\?"fb-song-summary-name":"catalogue-selected-summary__name"\}/);
  assert.match(options,/className=\{glass\?"fb-song-summary-code":"catalogue-selected-summary__code"\}/);
  assert.match(options,/<GlassPanel strong=\{false\} className="fb-song-info">/);
  assert.equal((options.match(/Liên hệ báo giá/g)||[]).length,1);
  assert.equal((options.match(/href="\/#contact"/g)||[]).length,2);
});

test("Gallery uses real images, preserved thumbnail actions, and separate glass classes",()=>{
  assert.match(options,/<PublishedImageGallery key=\{selected\.sku\} items=\{gallery\} glass=\{glass\}\/>/);
  assert.match(gallery,/const \[selected,setSelected\]=useState\(0\)/);
  assert.match(gallery,/<CatalogProductImage src=\{current\?\.src\?\?null\} alt=\{current\?\.alt\?\?"Sản phẩm Futurebook"\}\/>/);
  assert.match(gallery,/<GlassMediaFrame className="fb-song-main-photo">/);
  assert.match(gallery,/<GlassCard className="fb-song-gallery">/);
  assert.match(gallery,/aria-pressed=\{selected===i\}/);
  assert.match(gallery,/onClick=\{\(\)=>setSelected\(i\)\}/);
  assert.match(gallery,/src=\{img\.src\}/);
  assert.doesNotMatch(gallery,/imagegen|placeholder\.com|unsplash|mockup/i);
});

test("Related products keep source-backed links and exclusively styled glass cards",()=>{
  assert.match(related,/if\(items\.length===0\)return null/);
  assert.match(related,/items\.map\(product=><ProductCard key=\{product\.id\} product=\{product\} glass=\{glass\}\/>\)/);
  assert.match(card,/export function ProductCard\(\{ product, glass = false \}/);
  assert.match(card,/<GlassCard hover className="fb-song-related-card">/);
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
  assert.match(css,/\.fb-song-sku-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4/);
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
