import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const get = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("homepage renders Futurebook brand and content sections", () => {
  const home = get("app/page.tsx");
  assert.match(home, /Futurebook/);
  assert.match(home, /SiteHeader/);
  assert.match(home, /categories-grid/);
  assert.match(home, /MobileCarousel/);
});

test("mockup prices and testimonials are not presented as real data", () => {
  const source = get("app/page.tsx") + get("lib/ui-preview.ts");
  assert.doesNotMatch(source, /14\.500|25\.000|10\.000\+|0901\.567\.789/);
  assert.match(source, /đang cập nhật|đang hoàn thiện/i);
});

test("site does not contain database or storage secrets in client code", () => {
  const source = get("app/page.tsx") + get("app/layout.tsx")
    + get("components/site-header.tsx");
  assert.doesNotMatch(source, /DATABASE_URL|NEON_API_KEY|R2_SECRET|VERCEL_TOKEN/);
});

test("mobile web uses top hamburger navigation without a fixed bottom bar", () => {
  const css = get("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const header = get("components/site-header.tsx");
  assert.match(header, /aria-expanded=\{menuOpen\}/);
  assert.match(header, /aria-controls="site-navigation"/);
  assert.match(css, /\.site-navigation--open/);
  assert.doesNotMatch(css, /position\s*:\s*fixed\b/i);
  assert.doesNotMatch(header, /bottom-nav|tab-bar|bottom-tabs|fixed-dock/i);
});

test("design tokens and breakpoints cover approved device sizes", () => {
  const css = get("app/globals.css");
  const spec = get("docs/ui-system.md");
  assert.match(css, /--color-primary:/);
  assert.match(css, /--color-accent:/);
  assert.match(css, /@media \(max-width: 800px\)/);
  for (const size of ["360px", "390px", "768px", "1280px", "1440px"]) {
    assert.ok(spec.includes(size), "Missing documented QA viewport: " + size);
  }
});
