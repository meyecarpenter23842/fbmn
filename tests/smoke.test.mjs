import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const get = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("homepage uses the corrected desktop/mobile reference", () => {
  const page = get("app/page.tsx");
  assert.match(page, /SiteHeader/);
  assert.match(page, /MobileBottomNavigation/);
  assert.match(page, /ref-category-strip/);
  assert.match(page, /ref-featured/);
  assert.match(page, /MobileCarousel/);
});

test("mockup prices and unverified contacts never enter the public homepage", () => {
  const source = get("app/page.tsx") + get("lib/ui-preview.ts") + get("components/site-header.tsx");
  assert.doesNotMatch(source, /14\.500|19\.500|28\.500|32\.500|0901\.567\.890/);
  assert.match(source, /đang cập nhật|đang hoàn thiện/i);
});

test("site does not contain database or storage secrets in client source", () => {
  const source = get("app/page.tsx") + get("app/layout.tsx") +
    get("components/site-header.tsx") + get("components/mobile-bottom-navigation.tsx");
  assert.doesNotMatch(source, /DATABASE_URL|NEON_API_KEY|R2_SECRET|VERCEL_TOKEN/);
});

test("new mobile bottom tab overrides earlier design decision", () => {
  const nav = get("components/mobile-bottom-navigation.tsx");
  const css = get("app/rebaseline.css");
  assert.match(nav, /aria-label="Điều hướng dưới cùng trên điện thoại"/);
  assert.match(css, /\.ref-bottom-nav \{ position: fixed/);
  assert.match(css, /\.ref-bottom-nav \{ display: none; \}/);
});

test("design tokens and baseline widths remain documented", () => {
  const css = get("app/globals.css") + get("app/rebaseline.css");
  const spec = get("docs/ui-system.md");
  assert.match(css, /--color-primary:/);
  assert.match(css, /--color-accent:/);
  assert.match(css, /@media \(max-width: 800px\)/);
  for (const width of ["360px", "390px", "768px", "1280px", "1440px"]) {
    assert.ok(spec.includes(width), "Missing QA width " + width);
  }
});
