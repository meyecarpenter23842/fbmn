import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const src = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const page = src("app/san-pham/[slug]/page.tsx");
const options = src("components/catalogue-product-options.tsx");
const gallery = src("components/published-image-gallery.tsx");
const related = src("components/catalogue-related-products.tsx");
const card = src("components/catalog-ui.tsx");
const css = src("app/glass-product-detail.css");
const layout = src("app/layout.tsx");

test("G03 is limited to the verified Song Natural slug; public data and SEO stay intact", () => {
  assert.match(page, /const glass=slug==="sku-3ac08ff247847c1e77bfccb0e806ed29"/);
  assert.match(page, /getProductBySlug\(catalog, slug\)/);
  assert.match(page, /getPublicCatalog\(\)/);
  assert.match(page, /getPublishedProductImageUrl\(media\.r2Key,process\.env\.NEXT_PUBLIC_MEDIA_BASE_URL\)/);
  assert.match(page, /const recommendations=relatedProducts\(catalog,product\)/);
  assert.match(page, /generateMetadata/);
  assert.match(page, /<GlassPageBackdrop className="fb-glass-song-page">/);
  assert.match(page, /: content\}<\/CatalogShell>/);
  assert.match(page, /<CatalogueProductOptions product=\{product\} photos=\{images\} glass=\{glass\}\/>/);
  assert.match(page, /<CatalogueRelatedProducts items=\{recommendations\.items\} glass=\{glass\}\/>/);
});

test("SKU/format/audience state and quote link are unchanged, glass chips are visual-only", () => {
  for (const logic of [
    "useState(product.variants[0].sku)",
    "availableVariantFacets(product.variants)",
    "visibleVariants(product.variants,audience,format)",
    "photosForSku(photos,selected.sku)",
    "moveVariantFacet(product.variants,selected,facet,value,audience,format)",
    "setAudience(next.audience);setFormat(next.format);setSku(next.sku);",
    "onClick={()=>setSku(variant.sku)}",
    "onClick={()=>{setAudience(\"\");setFormat(\"\");}}",
    'selected.price?.kind==="retail"'
  ]) assert.ok(options.includes(logic), logic);
  assert.match(options, /<GlassChip selected=\{active\} onClick=\{onClick\}>/);
  assert.match(options, /<GlassChip className="catalogue-variant-option"/);
  assert.match(options, /aria-label=\{label\}/);
  assert.match(options, /<GlassPanel strong className="catalog-detail__info fb-glass-song-info">/);
  const countContact = (options.match(/href="\/#contact"/g) ?? []).length;
  assert.equal(countContact, 2, "glass and legacy CTA both retain /#contact");
  assert.match(options, /Liên hệ báo giá/);
});

test("Gallery keeps real images, thumbnails, pressed state and SKU remount", () => {
  assert.match(options, /<PublishedImageGallery key=\{selected\.sku\} items=\{gallery\} glass=\{glass\}\/>/);
  assert.match(gallery, /const \[selected,setSelected\]=useState\(0\)/);
  assert.match(gallery, /<CatalogProductImage src=\{current\?\.src\?\?null\} alt=\{current\?\.alt\?\?"Sản phẩm Futurebook"\}\/>/);
  assert.match(gallery, /<GlassMediaFrame className="catalog-detail__image">/);
  assert.match(gallery, /aria-pressed=\{selected===i\}/);
  assert.match(gallery, /onClick=\{\(\)=>setSelected\(i\)\}/);
  assert.match(gallery, /src=\{img\.src\}/);
  assert.doesNotMatch(gallery, /imagegen|placeholder\.com|unsplash|mockup/i);
});

test("Related product card still uses identical public data and links; glass is opt-in", () => {
  assert.match(related, /if\(items\.length===0\)return null/);
  assert.match(related, /items\.map\(product=><ProductCard key=\{product\.id\} product=\{product\} glass=\{glass\}\/>\)/);
  assert.match(card, /export function ProductCard\(\{ product, glass = false \}/);
  assert.match(card, /<GlassCard hover className="catalog-product fb-glass-song-related-card">/);
  assert.match(card, /: <article className="catalog-product">/);
  assert.match(card, /getPublishedProductImageUrl\(media\.r2Key, process\.env\.NEXT_PUBLIC_MEDIA_BASE_URL\)/);
  assert.match(card, /\/san-pham\/" \+ encodeURIComponent\(product\.slug\)/);
});

test("Song Natural CSS is route-scoped, responsive and respectful of motion preferences", () => {
  assert.match(layout, /import "\.\/glass-foundation\.css";\s*import "\.\/glass-product-detail\.css";/);
  for (const selector of [
    ".fb-glass-song-page", ".fb-glass-song-gallery", ".fb-glass-song-info",
    ".catalogue-gallery-thumb", ".catalogue-variant-option.fb-glass-chip",
    ".catalogue-option-choices .fb-glass-chip", ".catalogue-selected-summary",
    ".fb-glass-song-related-card"
  ]) assert.ok(css.includes(selector), selector);
  assert.match(css, /@media \(max-width: 780px\)/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:body|html|button|\.fb-admin|\.ref-|\.catalog-)\s*\{/m);
  assert.doesNotMatch(css, /https?:\/\/|cloudflarestorage\.com|\.r2\.dev|@import|!important/);
});
