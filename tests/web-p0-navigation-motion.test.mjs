import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("P0 website uses canonical geometry and motion tokens, not ad hoc timings", () => {
  const tokens = source("app/globals.css");
  for (const value of [
    "--fb-control-height-compact: 36px",
    "--fb-field-height: 40px",
    "--fb-control-height-touch: 44px",
    "--fb-control-font-size: 13px",
    "--fb-control-radius: 9px",
    "--fb-motion-button: 190ms",
    "--fb-motion-menu: 200ms",
  ]) assert.ok(tokens.includes(value), value);
  const css = source("app/catalog.css");
  assert.match(css, /min-height: var\(--fb-control-height-compact\)/);
  assert.match(css, /min-height: var\(--fb-field-height\)/);
  assert.match(css, /@media \(max-width: 780px\)[\s\S]*min-height: var\(--fb-control-height-touch\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(source("app/rebaseline.css"), /visibility: hidden; pointer-events: none/);
  assert.match(source("app/rebaseline.css"), /visibility: visible; pointer-events: auto/);
  assert.doesNotMatch(source("app/rebaseline.css"), /fbmn-menu-in/);
});

test("P0 product cards and main nav stop automatic dynamic RSC prefetch storms", () => {
  for (const file of ["components/site-header.tsx", "components/catalog-ui.tsx",
    "components/category-navigation.tsx"]) assert.match(source(file), /prefetch=\{false\}/, file);
  const list = source("components/catalog-ui.tsx");
  assert.ok((list.match(/prefetch=\{false\}/g) || []).length >= 5);
});

test("P0 lightweight route fallbacks and gallery controls preserve accessibility", () => {
  for (const file of ["app/san-pham/loading.tsx", "app/san-pham/[slug]/loading.tsx",
    "app/danh-muc/[slug]/loading.tsx"]) assert.match(source(file), /Catalog(List|Detail)Loading/);
  assert.match(source("components/catalog-route-loading.tsx"), /role="status"/);
  assert.match(source("components/catalog-route-loading.tsx"), /aria-busy="true"/);
  const gallery = source("components/published-image-gallery.tsx");
  assert.match(gallery, /aria-pressed=/);
  assert.doesNotMatch(gallery, /style=\{\{/);
  assert.match(source("app/catalog.css"), /catalogue-gallery-thumb\[aria-pressed="true"\]/);
});
