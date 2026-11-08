import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { categories } from "../lib/ui-preview.ts";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("category navigation has one source across desktop and mobile", () => {
  const page = read("app/page.tsx");
  const markup = read("components/category-navigation.tsx");
  const base = read("app/rebaseline.css");
  const css = read("app/category-navigation.css");
  const layout = read("app/layout.tsx");
  assert.equal((page.match(/<CategoryNavigation\s*\/>/g) ?? []).length, 1);
  assert.equal(categories.length, 6);
  assert.match(markup, /categories\.map/);
  assert.match(markup, /aria-label="Danh mục sản phẩm"/);
  assert.match(markup, /<StationeryArt\s*\/>/);
  assert.doesNotMatch(base, /\.ref-categor(?:y|ies)/);
  assert.match(layout, /import "\.\/category-navigation\.css";/);
  assert.match(css, /grid-template-columns:\s*repeat\(6,/);
  assert.match(css, /overflow-x:\s*auto/);
});

test("G05 category tiles use approved translucent glass, never hardcoded pastel cards", () => {
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

test("categories link to catalogue search; artwork is explicitly illustrative", () => {
  const markup = read("components/category-navigation.tsx");
  assert.match(markup, /encodeURIComponent\(category\.title\)/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /[Ii]llustrated covers are mockups/);
});
