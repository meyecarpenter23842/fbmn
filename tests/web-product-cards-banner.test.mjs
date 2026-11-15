import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("WEB-PROD-UI01 home cards are image + title only with a single full-card link", () => {
  const home = read("components/home-product-card.tsx");
  assert.equal((home.match(/<Link\b/g) ?? []).length, 1);
  assert.match(home, /className="ref-product-card__hit"/);
  assert.match(home, /<CatalogProductImage /);
  assert.match(home, /<h3>\{product\.name\}<\/h3>/);
  assert.doesNotMatch(home, /ref-product-card__more|Mã tham khảo|mã hàng đã công khai|product\.variants\.length|<small>|<p>/);
  assert.doesNotMatch(read("app/rebaseline.css"), /\.ref-product-card__more\s*\{/);
});

test("WEB-PROD-UI01 listing and related cards are image + title only", () => {
  const source = read("components/catalog-ui.tsx");
  const card = source.slice(source.indexOf("export function ProductCard("), source.indexOf("export function formatRetail("));
  assert.equal((card.match(/<Link\b/g) ?? []).length, 1);
  assert.match(card, /<CatalogProductImage /);
  assert.match(card, /<h3>/);
  assert.match(card, /aria-label=\{"Xem sản phẩm " \+ product\.name\}/);
  assert.doesNotMatch(card, /<p>|<strong|catalog-price|fb-song-related-price|priceLabel|Liên hệ báo giá/);
});

test("WEB-PROD-UI01 compact product banner replaces only redundant product-page intro", () => {
  const page = read("app/san-pham/page.tsx");
  const listing = read("components/catalog-ui.tsx");
  assert.match(page, /className="catalog-product-banner"/);
  assert.match(page, /src="\/brand\/fbmn-transparent-logo\.webp"/);
  assert.match(page, /showIntro=\{false\}/);
  assert.ok(page.indexOf("<CatalogBreadcrumb") < page.indexOf("catalog-product-banner"));
  assert.ok(page.indexOf("catalog-product-banner") < page.indexOf("<CatalogListing"));
  assert.match(listing, /\{showIntro && <p className="catalog-seo-intro">\{description\}<\/p>\}/);
  assert.match(read("app/danh-muc/[slug]/page.tsx"), /<CatalogListing/);
  assert.doesNotMatch(read("app/danh-muc/[slug]/page.tsx"), /showIntro=\{false\}/);
  const css = read("app/catalog.css");
  assert.match(css, /\.catalog-product-banner\s*\{/);
  assert.match(css, /@media \(max-width: 700px\)\s*\{[\s\S]*?\.catalog-product-banner\s*\{/);
});
