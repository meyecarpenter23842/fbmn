import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getApprovedMediaUrl } from "../lib/media/r2.ts";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const ui = read("components/glass-ui.tsx");
const foundation = read("app/glass-foundation.css");
const tokens = read("app/globals.css");
const page = read("app/san-pham/[slug]/page.tsx");
const layout = read("app/layout.tsx");
const source = {
  fileName: "verified-background.webp",
  status: "confirmed",
  verifiedAt: "2026-11-08",
  verifiedBy: "QA",
};
const approved = () => ({
  kind: "banner",
  key: "banners/G04/backdrop-v1.webp",
  alt: "Decorative only",
  width: 1920, height: 1080, mimeType: "image/webp",
  visibility: "public", approval: "approved",
  evidence: { ...source },
});

test("G04 images must be approved and assigned explicitly, never inferred from products", () => {
  assert.equal(getApprovedMediaUrl(approved(), "https://assets.example.test"),
    "https://assets.example.test/banners/G04/backdrop-v1.webp");
  const unavailable = [
    null,
    { ...approved(), approval: "pending" },
    { ...approved(), visibility: "private" },
    { ...approved(), evidence: { ...source, status: "estimated" } },
    { ...approved(), key: "private/background-v1.webp" },
  ];
  for (const asset of unavailable) {
    assert.equal(getApprovedMediaUrl(asset, "https://assets.example.test"), null);
  }
  for (const origin of ["", "https://pub-abc.r2.dev", "http://assets.example.test"]) {
    assert.equal(getApprovedMediaUrl(approved(), origin), null);
  }
});

test("G04 GlassPageBackdrop uses its own validated banner media opt-in", () => {
  assert.match(ui, /decorativeMedia\?: ApprovedMedia \| null/);
  assert.match(ui, /decorativeMedia\?\.kind === "banner"/);
  assert.match(ui, /getApprovedMediaUrl\(decorativeMedia, publicMediaOrigin\)/);
  assert.match(ui, /data-decorative=\{url \? "true" : undefined\}/);
  assert.match(ui, /"--fb-glass-decorative-image"/);
  assert.doesNotMatch(ui, /NEXT_PUBLIC_MEDIA_BASE_URL|r2\.dev|http:\/\/|R2_SECRET/);
  assert.match(ui, /decorativeReadPath === "\/api\/decorative-background"/);
  assert.match(page, /<GlassPageBackdrop className="fb-glass-song-page" decorativeReadPath="\/api\/decorative-background">/);
  assert.doesNotMatch(page, /decorativeMedia=|publicMediaOrigin=/);
});

test("G04 keeps the gradient as a background layer when image missing or 404", () => {
  const fallback = foundation.match(/\.fb-glass-backdrop\s*\{([^}]*)\}/)?.[1];
  const image = foundation.match(/\.fb-glass-backdrop\[data-decorative="true"\]\s*\{([^}]*)\}/)?.[1];
  assert.ok(fallback);
  assert.ok(image);
  assert.match(fallback, /background:\s*var\(--fb-glass-backdrop-gradient\)/);
  const layers = image.indexOf("var(--fb-glass-backdrop-overlay)") <
    image.indexOf("var(--fb-glass-decorative-image)") &&
    image.indexOf("var(--fb-glass-decorative-image)") <
    image.indexOf("var(--fb-glass-backdrop-gradient)");
  assert.equal(layers, true, "overlay/image/fallback must remain in that order");
  assert.match(image, /background-size:\s*cover/);
  assert.match(image, /background-attachment:\s*scroll/);
  assert.ok(tokens.includes("--fb-glass-backdrop-overlay:"));
  assert.equal((tokens.match(/--fb-glass-backdrop-overlay:/g) || []).length, 1);
  assert.doesNotMatch(foundation, /!important|\.catalog-|\.catalogue-|\.fb-admin|https?:\/\/|\.r2\.dev/);
  assert.doesNotMatch(foundation, /background-attachment:\s*fixed|transition[^;]*backdrop-filter/);
});

test("G04 changes no API, Admin, data, URL, SEO or product gallery contract", () => {
  assert.match(layout, /import "\.\/glass-foundation\.css";/);
  assert.match(page, /getPublicCatalog\(\)/);
  assert.match(page, /getPublishedProductImageUrl\(media\.r2Key,process\.env\.NEXT_PUBLIC_MEDIA_BASE_URL\)/);
  assert.match(page, /<CatalogueProductOptions product=\{product\} photos=\{images\} glass=\{glass\}\/>/);
  assert.match(page, /generateMetadata/);
});
