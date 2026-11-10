import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const css = read("app/glass-product-detail.css");
const site = read("app/globals.css");
const foundation = read("app/glass-foundation.css");
const home = read("app/rebaseline.css");
const options = read("components/catalogue-product-options.tsx");
const gallery = read("components/published-image-gallery.tsx");
const related = read("components/catalogue-related-products.tsx");
const stripComments = body => body.replace(/\/\*[\s\S]*?\*\//g, "");

test("G06 visual polish gives the approved real gallery more width and a balanced info panel", () => {
  assert.match(css, /\.fb-song-detail\s*\{[^}]*grid-template-columns:\s*minmax\(0, 53%\) minmax\(0, 1fr\)/);
  assert.match(css, /\.fb-song-detail\s*\{[^}]*align-items:\s*stretch/);
  assert.match(css, /\.fb-song-main-photo\s*\{[^}]*height:\s*clamp\(330px, 38vw, 490px\)/);
  assert.match(css, /\.fb-song-info\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column/);
  assert.match(css, /\.fb-song-options\s*\{[^}]*flex:\s*1/);
  assert.match(css, /\.fb-song-summary\s*\{[^}]*margin-top:\s*auto/);
  assert.match(css, /\.fb-song-title\s*\{[^}]*font-family:\s*var\(--fb-glass-display-font\)/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.fb-song-detail\s*\{[^}]*display:\s*flex/);
  assert.match(css, /\.fb-song-overview-preview\s*\{[^}]*height:\s*124px/);
});

test("G07.2 suggestions use visible responsive grid, without horizontal scrolling", () => {
  const block = css.match(/\.fb-song-related-grid\s*\{([^}]*)\}/)?.[1];
  assert.ok(block);
  assert.match(block, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(block, /grid-auto-flow|grid-auto-columns/);
  assert.doesNotMatch(block, /overflow-x|scroll-snap|scrollbar-width/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.fb-song-related-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /\.fb-song-related-grid\s*>\s*\*\s*\{[^}]*min-width:\s*0/);
  assert.doesNotMatch(css, /\.fb-song-related-grid\s*>\s*\.fb-song-related-card:nth-child/);
  assert.doesNotMatch(css, /\.fb-song-related-grid\s*\{[^}]*display:\s*none/);
  assert.match(related, /items\.map\(product=><ProductCard key=\{product\.id\} product=\{product\} glass=\{glass\}\/>\)/);
});

test("G06 glass improves backdrop visibility with existing R2 asset and gradient fallback", () => {
  assert.match(site, /--fb-glass-backdrop-overlay:[^;]*rgba\(249, 244, 255, \.46\)/);
  assert.match(site, /--fb-glass-shadow:\s*inset 0 1px 0 rgba/);
  assert.match(foundation, /var\(--fb-glass-decorative-image\)/);
  assert.match(foundation, /var\(--fb-glass-backdrop-gradient\)/);
  assert.match(home, /\.ref-header__inner\s*\{[^}]*min-height:\s*68px/);
  assert.match(home, /\.ref-navigation__inner\s*\{[^}]*min-height:\s*46px/);
  assert.match(read("lib/media/decorative-background.ts"), /website: "\/api\/decorative-background"/);
  assert.doesNotMatch(css, /http:\/\/|https:\/\/|\.r2\.dev/);
  // Legacy homepage CSS already contains !important in book mockup geometry;
  // G06 introduces none in the glass primitive or product detail style owners.
  assert.doesNotMatch(stripComments(css + foundation), /!important|background-attachment:\s*fixed/);
});

test("G06 preserves real SKU selection, photos, and conversion CTA", () => {
  assert.match(options, /const \[sku,setSku\]=useState\(initialSku && product\.variants\.some/);
  assert.match(options, /<VariantChoice key=\{variant\.sku\} glass=\{glass\}/);
  assert.match(options, /aria-live="polite" aria-atomic="true"/);
  assert.match(options, /<PublishedImageGallery key=\{selected\.sku\} items=\{gallery\} glass=\{glass\}[\s\S]*?zoomDialogRef=\{zoomDialogRef\}[\s\S]*?onActiveIndexChange=\{setPhotoIndex\}\/>/);
  assert.match(options, /<GlassButtonLink ref=\{primaryQuoteRef\} href="\/#contact" pill className="fb-song-quote">/);
  assert.match(gallery, /<CatalogProductImage src=\{current\?\.src\?\?null\}/);
  assert.match(gallery, /aria-pressed=\{active===i\}/);
  assert.match(gallery, /choose\(i\)/);
  assert.doesNotMatch(css, /\.fb-song-sku(?=[\s:.{>])/);
});

test("G06 responsive cards and motion remain within the existing single style owners", () => {
  assert.match(foundation, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  for (const [name, body] of Object.entries({css, site, foundation, home})) {
    assert.equal((body.match(/\{/g)||[]).length, (body.match(/\}/g)||[]).length, name + " CSS brace balance");
  }
  assert.doesNotMatch(stripComments(css), /\.catalogue-|\.catalog-|\.fb-glass-card\s*\{|\.fb-glass-chip\s*\{/);
  const suggestionGrid = css.match(/\.fb-song-related-grid\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.doesNotMatch(suggestionGrid, /scrollbar-width|scroll-snap/);
});
