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
  assert.match(css, /\.ref-navigation--open \{[\s\S]*?visibility: visible; pointer-events: auto;/);
  assert.match(css, /opacity: 0; visibility: hidden; pointer-events: none;/);
  assert.match(css, /\.ref-header__mobile-icon \{ display: grid; place-items: center; \}/);
});

test("category navigation has an image for each group and mobile scroll affordance", () => {
  const home = read("app/page.tsx");
  const nav = read("components/category-navigation.tsx");
  const styles = read("app/category-navigation.css");
  assert.match(home, /<CategoryNavigation categories=\{categories\} \/>/);
  assert.match(nav, /categories\.map/);
  assert.match(nav, /<CatalogProductImage/);
  assert.match(nav, /category\.representativeMedia/);
  assert.match(styles, /overflow-x:\s*auto/);
  assert.match(styles, /scroll-snap-type:\s*x mandatory/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
});

test("featured products remain a swipeable keyboard-accessible carousel", () => {
  const css = read("app/rebaseline.css");
  const carousel = read("components/mobile-carousel.tsx");
  assert.match(css, /\.ref-featured \.products-grid \{ display: grid; grid-auto-columns:/);
  assert.match(carousel, /aria-roledescription="carousel"/);
  assert.match(carousel, /aria-label="Trang sản phẩm trước"/);
  assert.match(carousel, /aria-label="Trang sản phẩm tiếp theo"/);
});

test("DL1 mobile header hides dead commerce controls and exposes dealer contact", () => {
  const header = read("components/site-header.tsx");
  assert.doesNotMatch(header, /type="button" disabled title="Giỏ hàng chưa mở"/);
  assert.doesNotMatch(header, /Tài khoản sẽ mở khi có phân quyền/);
  assert.match(header, /ref-navigation__dealer-cta-mobile/);
  assert.match(header, /catalog-header-mobile-q/);
  assert.match(header, /action="\/san-pham" method="get"/);
});
