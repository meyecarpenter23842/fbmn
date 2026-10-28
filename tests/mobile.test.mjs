import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("new explicit mobile reference shows a four-item fixed bottom navigation", () => {
  const nav = read("components/mobile-bottom-navigation.tsx");
  const css = read("app/rebaseline.css");
  const page = read("app/page.tsx");
  for (const label of ["Trang chủ", "Danh mục", "Giỏ hàng", "Tài khoản"]) {
    assert.ok(nav.includes(label), "Missing mobile tab: " + label);
  }
  assert.match(page, /<MobileBottomNavigation/);
  assert.match(css, /\.ref-bottom-nav \{ position: fixed/);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(css, /\.ref-footer \{ padding: 16px 0 96px; \}/);
  assert.match(nav, /href="#home"/);
  assert.match(nav, /href="#categories"/);
  assert.match(nav, /disabled aria-label="Giỏ hàng chưa mở"/);
  assert.match(nav, /disabled aria-label="Tài khoản chưa mở"/);
});

test("mobile header hamburger and search notices are accessible", () => {
  const header = read("components/site-header.tsx");
  const css = read("app/rebaseline.css");
  assert.match(header, /aria-expanded=\{menuOpen\}/);
  assert.match(header, /aria-controls="site-navigation"/);
  assert.match(header, /aria-controls="ref-mobile-search"/);
  assert.match(header, /event\.key === "Escape"/);
  assert.match(css, /\.ref-navigation--open \{ display: block; \}/);
  assert.match(css, /\.ref-header__mobile-icon \{ display: grid; place-items: center; \}/);
});

test("category rail and products are swipeable, preserving carousel controls", () => {
  const css = read("app/rebaseline.css");
  const carousel = read("components/mobile-carousel.tsx");
  assert.match(css, /\.ref-category-strip \{ display: flex; overflow-x: auto/);
  assert.match(css, /\.ref-featured \.products-grid \{ display: grid; grid-auto-columns:/);
  assert.match(css, /scroll-snap-type: x mandatory/);
  assert.match(carousel, /aria-roledescription="carousel"/);
  assert.match(carousel, /aria-label="Trang sản phẩm trước"/);
  assert.match(carousel, /aria-label="Trang sản phẩm tiếp theo"/);
});

test("mobile buttons are not enabled without order/auth backend", () => {
  const nav = read("components/mobile-bottom-navigation.tsx");
  const header = read("components/site-header.tsx");
  assert.doesNotMatch(nav, /checkout|login|order\/create/i);
  assert.match(header, /Tìm kiếm sản phẩm đang được hoàn thiện/);
});
