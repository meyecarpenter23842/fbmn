import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("mobile website uses top hamburger without a fixed bottom navigation", () => {
  const home = read("app/page.tsx");
  const css = read("app/rebaseline.css");
  const header = read("components/site-header.tsx");
  assert.match(home, /<SiteHeader/);
  assert.doesNotMatch(home + css, /MobileBottomNavigation|ref-bottom-nav/);
  assert.doesNotMatch(css, /position:\s*fixed/i);
  assert.match(css, /\.ref-footer \{ padding: 16px 0 24px; \}/);
  assert.match(header, /ref-header__mobile-icon/);
  assert.match(header, /aria-controls="site-navigation"/);
});

test("mobile header hamburger/search panels remain accessible", () => {
  const header = read("components/site-header.tsx");
  const css = read("app/rebaseline.css");
  assert.match(header, /aria-expanded=\{menuOpen\}/);
  assert.match(header, /aria-controls="site-navigation"/);
  assert.match(header, /aria-controls="ref-mobile-search"/);
  assert.match(header, /event\.key === "Escape"/);
  assert.match(css, /\.ref-navigation--open \{ display: block; \}/);
  assert.match(css, /\.ref-header__mobile-icon \{ display: grid; place-items: center; \}/);
});

test("category images use bounded CSS fallback covers instead of blank scaled art", () => {
  const home = read("app/page.tsx");
  const css = read("app/rebaseline.css");
  assert.match(home, /className="ref-category__image"/);
  assert.match(home, /<NotebookArt cover=\{category\.kind\}/);
  assert.match(css, /\.ref-category__image \.notebook \{ width: 42px; height: 54px;/);
  assert.match(css, /\.ref-category__image \.notebook \{ width: 40px; height: 50px;/);
  assert.match(css, /\.ref-category-strip \{ display: flex; overflow-x: auto/);
  assert.match(css, /scroll-snap-type: x mandatory/);
});

test("featured products remain a swipeable keyboard-accessible carousel", () => {
  const css = read("app/rebaseline.css");
  const carousel = read("components/mobile-carousel.tsx");
  assert.match(css, /\.ref-featured \.products-grid \{ display: grid; grid-auto-columns:/);
  assert.match(carousel, /aria-roledescription="carousel"/);
  assert.match(carousel, /aria-label="Trang sản phẩm trước"/);
  assert.match(carousel, /aria-label="Trang sản phẩm tiếp theo"/);
});

test("cart/account stay disabled while authentication and ordering are unfinished", () => {
  const header = read("components/site-header.tsx");
  assert.match(header, /type="button" disabled title="Giỏ hàng chưa mở"/);
  assert.match(header, /Tài khoản sẽ mở khi có phân quyền/);
  assert.match(header, /Tìm kiếm sản phẩm đang được hoàn thiện/);
});
