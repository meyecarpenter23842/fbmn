import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("DL3 category navigation reads published catalogue and links directly to exact categories", () => {
  const page = read("app/page.tsx");
  const markup = read("components/category-navigation.tsx");
  const base = read("app/rebaseline.css");
  const css = read("app/category-navigation.css");
  const layout = read("app/layout.tsx");
  assert.equal((page.match(/<CategoryNavigation categories=\{categories\} \/>/g) ?? []).length, 1);
  assert.match(page, /getPublicCatalog\(\)/);
  assert.match(markup, /categories\.map/);
  assert.match(markup, /aria-label="Danh mục sản phẩm"/);
  assert.match(markup, /"\/danh-muc\/" \+ encodeURIComponent\(category\.slug\)/);
  assert.match(markup, /category\.representativeMedia/);
  assert.match(markup, /getPublishedProductImageUrl/);
  assert.doesNotMatch(markup, /ui-preview|NotebookArt|StationeryArt|san-pham\?q=/);
  assert.doesNotMatch(base, /\.ref-categor(?:y|ies)/);
  assert.match(layout, /import "\.\/category-navigation\.css";/);
  assert.match(css, /grid-template-columns:\s*repeat\(6,/);
  assert.match(css, /overflow-x:\s*auto/);
});

test("G05 category tiles preserve approved translucent glass and keyboard states", () => {
  const css = read("app/category-navigation.css");
  const match = css.match(/\.category-nav__link\s*\{([^}]*)\}/);
  assert.ok(match);
  assert.match(match[1], /background:\s*var\(--fb-glass-surface-layer\)/);
  assert.match(match[1], /border:\s*1px solid var\(--fb-glass-border\)/);
  assert.match(match[1], /border-radius:\s*20px/);
  assert.match(match[1], /backdrop-filter:\s*blur\(var\(--fb-glass-ui-blur\)\)/);
  assert.doesNotMatch(css, /background:\s*#f6f3fa|border:\s*1px solid #f2ebf6/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
});

test("DL3 representative covers are official or neutral, not fabricated category art", () => {
  const markup = read("components/category-navigation.tsx");
  assert.match(markup, /<CatalogProductImage/);
  assert.match(markup, /category-nav__empty-art/);
  assert.match(markup, /aria-hidden="true"/);
  assert.doesNotMatch(markup, /UI placeholders|MẪU|\.title\)|StationeryArt/);
});
