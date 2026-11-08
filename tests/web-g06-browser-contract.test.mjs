import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("G06 browser runner checks every mandatory viewport, real HTML and screenshot", () => {
  const script = source("scripts/g06-browser-qa.mjs");
  for (const width of ["1440","1280","768","390","360"]) {
    assert.ok(script.includes(width), width);
  }
  for (const path of ["/san-pham","/dai-ly","/lien-he","/tin-tuc","/khuyen-mai"]) {
    assert.ok(script.includes(path), path);
  }
  assert.match(script, /page\.goto\(/);
  assert.match(script, /page\.screenshot\(/);
  assert.match(script, /fullPage:true/);
  assert.match(script, /document\.documentElement\.scrollWidth/);
  assert.match(script, /report\.json/);
  assert.match(script, /report\.md/);
});

test("G06 browser runner measures motion, site resources and real SKU interactions", () => {
  const s = source("scripts/g06-browser-qa.mjs");
  assert.match(s, /PerformanceObserver/);
  assert.match(s, /largest-contentful-paint/);
  assert.match(s, /layout-shift/);
  assert.match(s, /durationThreshold:16/);
  assert.match(s, /api\/decorative-background/);
  assert.match(s, /backgroundHttp/);
  assert.match(s, /\.fb-song-sku/);
  assert.match(s, /aria-pressed/);
  assert.match(s, /\.fb-song-summary-code/);
  assert.match(s, /\.fb-song-gallery-thumb/);
  assert.match(s, /\.fb-song-quote/);
  assert.match(s, /keyboard\.press\("Escape"\)/);
  assert.match(s, /reducedMotion: "reduce"/);
  assert.match(s, /visual review|reference|Owner/i);
  assert.doesNotMatch(s, /database_url|r2_secret|cloudflare_api_token|npm run deploy/i);
});

test("G06 workflow is evidence-only, constrained to manual or scoped PR runs", () => {
  const yaml = source(".github/workflows/g06-website-browser.yml");
  assert.match(yaml, /workflow_dispatch/);
  assert.match(yaml, /pull_request/);
  assert.match(yaml, /paths:/);
  assert.match(yaml, /run: node scripts\/g06-browser-qa\.mjs/);
  assert.match(yaml, /upload-artifact/);
  assert.match(yaml, /if: always\(\)/);
  assert.doesNotMatch(yaml, /wrangler deploy|vercel deploy|supabase db|push upstream/i);
});
