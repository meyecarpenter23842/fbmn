import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { approvedSiteMedia } from "../lib/media/approved-site-media.ts";
import {
  validateR2Key, validateApprovedMedia, getApprovedMediaUrl, getObjectCachePolicy,
} from "../lib/media/r2.ts";

const evidence = {
  fileName: "DEMO-test-media-source.pdf", issuedOn: "2026-10-01", page: 1,
  status: "confirmed", verifiedBy: "DEMO QA", verifiedAt: "2026-10-02",
};
const image = () => ({
  key: "products/DEMO-SKU/cover-v1.webp",
  kind: "product", alt: "DEMO notebook cover",
  width: 900, height: 1200, mimeType: "image/webp",
  visibility: "public", approval: "approved",
  evidence: { ...evidence },
});
const cdn = "https://media.example.test";

test("R2 key policy permits only versioned, namespaced images", () => {
  assert.equal(validateR2Key("brand/logo-v1.png", "brand"), true);
  assert.equal(validateR2Key("products/DEMO-01/cover-v2.webp", "product"), true);
  assert.equal(validateR2Key("banners/HOME/hero-v10.avif", "banner"), true);
  assert.equal(validateR2Key("brand/logo-v1.png", "product"), false);
  assert.equal(validateR2Key("products/demo/cover.webp", "product"), false);
});

test("R2 key rejects traversal, credentials, PDFs, SVG and query strings", () => {
  for (const key of [
    "../private/price-v1.webp", "products/sku/../../secrets-v1.png",
    "products/sku/price-v1.pdf", "products/sku/unsafe-v1.svg",
    "products/sku/photo-v1.webp?token=secret", "products//photo-v1.webp",
    "https://attacker.tld/image-v1.webp", "products/sku/%2e%2e-v1.jpg",
    "products/sku/photo-v0.webp", "products/sku/folder/photo-v1.webp",
  ]) {
    assert.equal(validateR2Key(key, "product"), false, key);
  }
});

test("complete, confirmed, explicitly approved image is valid", () => {
  assert.deepEqual(validateApprovedMedia(image()), []);
  assert.equal(getObjectCachePolicy(image()), "public, max-age=31536000, immutable");
});

test("pending, private or unverified images never expose URLs", () => {
  for (const mutate of [
    x => { x.approval = "pending"; },
    x => { x.visibility = "private"; },
    x => { x.evidence.status = "estimated"; },
    x => { x.evidence.verifiedBy = ""; },
  ]) {
    const testImage = image();
    mutate(testImage);
    assert.ok(validateApprovedMedia(testImage).length);
    assert.equal(getApprovedMediaUrl(testImage, cdn), null);
    assert.equal(getObjectCachePolicy(testImage), null);
  }
});

test("image metadata enforces safe alt, MIME and pixel dimensions", () => {
  for (const mutate of [
    x => { x.alt = "  "; },
    x => { x.mimeType = "image/png"; },
    x => { x.width = 0; },
    x => { x.height = 9000; },
  ]) {
    const testImage = image();
    mutate(testImage);
    assert.ok(validateApprovedMedia(testImage).length);
    assert.equal(getApprovedMediaUrl(testImage, cdn), null);
  }
});

test("only HTTPS custom-domain origin at its root is accepted", () => {
  assert.equal(getApprovedMediaUrl(image(), cdn),
    "https://media.example.test/products/DEMO-SKU/cover-v1.webp");
  for (const origin of [
    "http://media.example.test", "https://media.example.test/path",
    "https://media.example.test?key=x", "https://media.example.test/#fragment",
    "https://user:pw@media.example.test/", "https://cdn.r2.dev",
    "https://pub-123.r2.dev", "ftp://media.example.test", "not a url",
    "https://assets.example.invalid", "",
  ]) {
    assert.equal(getApprovedMediaUrl(image(), origin), null, origin);
  }
});

test("catalogue remains empty of official media pending owner validation", () => {
  assert.equal(approvedSiteMedia.brandLogo, null);
  assert.equal(approvedSiteMedia.heroBanner, null);
  assert.equal(getApprovedMediaUrl(approvedSiteMedia.brandLogo, cdn), null);
});

test("website uses the owner-approved logo and verified hero media fallback on both devices", () => {
  const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
  const header = read("components/site-header.tsx");
  const home = read("app/page.tsx");
  const styles = read("app/rebaseline.css");
  const component = read("components/verified-media-image.tsx");
  assert.ok(header.includes('src="/brand/fbmn-transparent-logo.webp"'));
  const logo = readFileSync(new URL("../public/brand/fbmn-transparent-logo.webp", import.meta.url));
  assert.ok(logo.byteLength > 1000);
  assert.equal(logo.toString("ascii", 12, 16), "VP8X");
  assert.ok(logo[20] & 0x10, "transparent logo must carry WebP alpha");
  assert.ok(readFileSync(new URL("../public/brand/fbmn-official-logo.webp", import.meta.url)).byteLength > 1000);
  assert.match(home, /asset=\{approvedSiteMedia.heroBanner\}/);
  assert.doesNotMatch(home, /NotebookArt/);
  assert.match(home, /className="cms-hero-cta"/);
  assert.match(header, /alt="Logo chính thức Futurebook Miền Nam"/);
  assert.match(styles, /\.ref-hero__official-image/);
  assert.match(component, /onError/);
  assert.match(component, /unoptimized/);
  assert.doesNotMatch(header + home, /R2_SECRET|R2_ACCESS_KEY|DATABASE_URL/);
});

test("no asset URL is constructed from fake uploaded object names", () => {
  const x = image();
  x.key = "private/net/price-v1.webp";
  assert.equal(getApprovedMediaUrl(x, cdn), null);
});
