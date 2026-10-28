import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const get = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("mobile web has header menu and NO fixed/native bottom bar", () => {
  const css = get("app/mobile.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const header = get("components/site-header.tsx");
  assert.match(css, /@media \(max-width: 800px\)/);
  assert.match(css, /grid-template-columns: 82px minmax\(0, 1fr\) 82px/);
  assert.match(header, /aria-expanded=\{menuOpen\}/);
  assert.match(header, /aria-controls="site-navigation"/);
  assert.doesNotMatch(css, /position\s*:\s*(fixed|sticky)\b/i);
  assert.doesNotMatch(css, /bottom-nav|tab-bar|fixed-dock|floating-cart/i);
});

test("mobile product carousel has accessible buttons and pagination", () => {
  const carousel = get("components/mobile-carousel.tsx");
  const page = get("app/page.tsx");
  assert.match(page, /<MobileCarousel itemCount=\{previewProducts.length\}>/);
  assert.match(carousel, /aria-roledescription="carousel"/);
  assert.match(carousel, /aria-label="Trang sản phẩm trước"/);
  assert.match(carousel, /aria-label="Trang sản phẩm tiếp theo"/);
  assert.match(carousel, /aria-current=/);
  assert.match(carousel, /scrollTo\(/);
});

test("mobile search never pretends a backend search or checkout is operational", () => {
  const header = get("components/site-header.tsx");
  assert.match(header, /Tìm kiếm sản phẩm đang được hoàn thiện/);
  assert.match(header, /className="header-cart" type="button" disabled/);
});

test("mobile shows content trust strip in document flow, not a dock", () => {
  const page = get("app/page.tsx");
  const css = get("app/mobile.css");
  assert.match(page, /className="benefits-section"/);
  assert.match(css, /\.benefits-section \{/);
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});
