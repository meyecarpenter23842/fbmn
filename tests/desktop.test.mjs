import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (filename) => readFileSync(new URL("../" + filename, import.meta.url), "utf8");

test("desktop reference sections exist in the approved order", () => {
  const page = read("app/page.tsx");
  const names = ['className="hero"', 'className="hero__features"', 'className="categories-grid"',
    'className="featured-section"', '<MobileCarousel itemCount={previewProducts.length}>', 'className="benefits-section"',
    'className="about-banner"'];
  assert.match(read("components/mobile-carousel.tsx"), /className="products-grid"/);
  const offsets = names.map((name) => page.indexOf(name));
  assert.ok(offsets.every((n) => n >= 0), "Missing desktop reference section");
  assert.deepEqual([...offsets].sort((a, b) => a - b), offsets, "Sections out of order");
});

test("desktop visual overrides are limited to desktop and do not add bottom nav", () => {
  const css = read("app/desktop.css").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.match(css, /@media \(min-width: 801px\)/);
  assert.match(css, /\.hero__features/);
  assert.match(css, /\.categories-grid/);
  assert.match(css, /\.products-grid/);
  assert.doesNotMatch(css, /position\s*:\s*fixed|bottom-navigation|bottom-dock|bottom-tabs/i);
});

test("desktop search/cart remain non-operational until backend and catalogue review", () => {
  const header = read("components/site-header.tsx");
  const page = read("app/page.tsx");
  assert.match(header, /id="desktop-search"[\s\S]*?disabled/);
  assert.match(header, /className="header-cart"[\s\S]*?disabled/);
  assert.match(page, /className="product-card__cart"[\s\S]*?disabled/);
  assert.doesNotMatch(page, /14\.500|25\.000|10\.000\+|0901\.567\.789/);
});

test("desktop control links are meaningful in-page anchors", () => {
  const page = read("app/page.tsx");
  const header = read("components/site-header.tsx");
  assert.match(page, /href="#categories"/);
  assert.match(page, /id="categories"/);
  assert.match(header, /aria-current/);
  assert.match(header, /aria-expanded=\{menuOpen\}/);
});
