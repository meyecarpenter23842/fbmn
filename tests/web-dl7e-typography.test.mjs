import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("DL7E uses one Vietnamese-capable sans-serif font stack and shared heading tokens", () => {
  const css = read("app/globals.css");
  assert.match(css, /--fb-web-font:\s*system-ui, -apple-system, "Segoe UI", Arial, sans-serif/);
  assert.match(css, /--fb-glass-display-font:\s*var\(--fb-web-font\)/);
  assert.match(css, /body\s*\{[^}]*font-family:\s*var\(--fb-web-font\)/);
  assert.match(css, /button, input, select, textarea\s*\{\s*font:\s*inherit/);
  assert.match(css, /--fb-web-heading-leading:\s*1\.3/);
  assert.match(css, /--fb-control-font-size:\s*13px/);
  for (const p of ["app/rebaseline.css", "app/glass-product-detail.css", "app/catalog.css", "app/content.css", "app/cms-public.css", "app/catalogue/flipbook.css"]) {
    const s = read(p);
    assert.match(s, /var\(--fb-glass-display-font\)/, p);
    assert.doesNotMatch(s, /font-family:\s*(?:Georgia|cursive)|font-family:\s*var\(--fb-glass-display-font,Georgia/, p);
    assert.equal((s.match(/\{/g)||[]).length,(s.match(/\}/g)||[]).length,p);
  }
});