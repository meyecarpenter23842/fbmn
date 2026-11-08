import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createStagingWorker } from "../backend/public-api/staging-worker.mjs";
import { GET } from "../app/api/decorative-background/route.ts";

const KEY = "banners/G04/backdrop-v1.webp";
const PUBLIC = "https://fbmn-web.vercel.app";
const BYTES = new TextEncoder().encode("RIFF\x08\x00\x00\x00WEBPtest-public-image");
const image = ({ size = BYTES.length, type = "image/webp" } = {}) => ({
  body: new Blob([BYTES]).stream(),
  size,
  httpMetadata: { contentType: type },
});
const make = (r2Image = image(), options = {}) => {
  const calls = [];
  const worker = createStagingWorker({
    createDbClient: () => { throw new Error("Decorative public reads must not connect to DB"); },
  });
  const env = {
    HYPERDRIVE: { connectionString: "postgres://unused" },
    EXPECTED_DB_ROLE: "fbmn_p5_public_login",
    PUBLIC_P5_ENABLED: "true",
    PUBLIC_ALLOWED_ORIGINS: PUBLIC,
    RATE_LIMITER: { limit: async () => ({ success: true }) },
    IMAGE_RATE_LIMITER: { limit: async () => ({ success: true }) },
    PUBLIC_MEDIA_R2: {
      get: async key => { calls.push(key); return r2Image; },
    },
    ...options,
  };
  const hit = (path = "/v1/public/decorative-background", init) =>
    worker.fetch(new Request("https://worker.example.test" + path, init), env);
  return { hit, calls };
};

test("G04R Worker serves only the single approved WebP through its R2 binding", async () => {
  const f = make();
  const res = await f.hit();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/webp");
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("cross-origin-resource-policy"), "same-origin");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(f.calls, [KEY]);
  assert.deepEqual(new Uint8Array(await res.arrayBuffer()), BYTES);
});

test("G04R Worker rejects caller-controlled keys, queries, origins and methods", async () => {
  const f = make();
  assert.equal((await f.hit("/v1/public/decorative-background?key=products/secret")).status, 400);
  assert.equal((await f.hit("/v1/public/decorative-background?key=" + KEY)).status, 400);
  assert.equal((await f.hit("/v1/public/decorative-background", { method: "POST" })).status, 405);
  assert.equal((await f.hit("/v1/public/decorative-background", {
    headers: { Origin: "https://other.example.test" },
  })).status, 403);
  assert.equal((await f.hit("/v1/public/decorative-background/" + KEY)).status, 404);
  assert.deepEqual(f.calls, [], "No rejected request may read even the approved key");
});

test("G04R Worker has no missing/invalid R2 exposure", async () => {
  for (const asset of [
    null,
    image({ size: 10 }),
    image({ size: 5 * 1024 * 1024 + 1 }),
    image({ type: "application/octet-stream" }),
  ]) {
    const f = make(asset);
    const res = await f.hit();
    assert.equal(res.status, 404);
    assert.equal(res.headers.get("cache-control"), "no-store");
  }
  const missingBinding = make(image(), { PUBLIC_MEDIA_R2: null });
  assert.equal((await missingBinding.hit()).status, 503);
  const blocked = make(image(), { IMAGE_RATE_LIMITER: {
    limit: async () => ({ success: false }),
  } });
  assert.equal((await blocked.hit()).status, 429);
  assert.deepEqual(blocked.calls, []);
});

test("G04R Website proxy returns controlled WebP without revealing the bucket key", async () => {
  const oldFetch = globalThis.fetch;
  const oldEnv = process.env.FBMN_PUBLIC_API_BASE_URL;
  const seen = [];
  process.env.FBMN_PUBLIC_API_BASE_URL = "https://worker.example.test/";
  globalThis.fetch = async (url, init) => {
    seen.push({ url: String(url), init });
    return new Response(BYTES, {
      status: 200,
      headers: { "Content-Type": "image/webp", "Content-Length": String(BYTES.length) },
    });
  };
  try {
    const res = await GET(new Request(PUBLIC + "/api/decorative-background"));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "image/webp");
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.deepEqual(new Uint8Array(await res.arrayBuffer()), BYTES);
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, "https://worker.example.test/v1/public/decorative-background");
    assert.equal(seen[0].init.redirect, "manual");
    assert.equal(seen[0].init.cache, "no-store");
    const bad = await GET(new Request(PUBLIC + "/api/decorative-background?key=private"));
    assert.equal(bad.status, 404);
    assert.equal(seen.length, 1);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldEnv === undefined) delete process.env.FBMN_PUBLIC_API_BASE_URL;
    else process.env.FBMN_PUBLIC_API_BASE_URL = oldEnv;
  }
});

test("G04R Website proxy rejects invalid origins, redirects, bad MIME and oversized images", async () => {
  const oldFetch = globalThis.fetch;
  const oldEnv = process.env.FBMN_PUBLIC_API_BASE_URL;
  const req = new Request(PUBLIC + "/api/decorative-background");
  try {
    for (const origin of ["http://worker.example.test", "https://pub-1.r2.dev",
      "https://worker.example.test/path", "https://localhost/", "https://user:pass@worker.example.test/"]) {
      process.env.FBMN_PUBLIC_API_BASE_URL = origin;
      const res = await GET(req);
      assert.equal(res.status, 503, origin);
    }
    process.env.FBMN_PUBLIC_API_BASE_URL = "https://worker.example.test/";
    for (const [remote,expected] of [
      [new Response(null, { status: 404 }), 404],
      [new Response(null, { status: 302, headers: { Location: "https://bad.example.test/" } }), 503],
      [new Response(BYTES, { status: 200, headers: { "Content-Type": "text/html" } }), 503],
      [new Response(BYTES, { status: 200, headers: {
        "Content-Type": "image/webp", "Content-Length": String(5 * 1024 * 1024 + 1),
      } }), 503],
    ]) {
      globalThis.fetch = async () => remote;
      const res = await GET(req);
      assert.equal(res.status, expected);
      assert.equal(res.headers.get("cache-control"), "no-store");
    }
  } finally {
    globalThis.fetch = oldFetch;
    if (oldEnv === undefined) delete process.env.FBMN_PUBLIC_API_BASE_URL;
    else process.env.FBMN_PUBLIC_API_BASE_URL = oldEnv;
  }
});

test("G04R keeps CSS fallback, confines opt-in to Song Natural, and never hardcodes public R2 URLs", () => {
  const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
  const page = read("app/san-pham/[slug]/page.tsx");
  const component = read("components/glass-ui.tsx");
  const css = read("app/glass-foundation.css");
  const worker = read("backend/public-api/staging-worker.mjs");
  const route = read("app/api/decorative-background/route.ts");
  assert.match(page, /decorativeReadPath="\/api\/decorative-background"/);
  assert.match(component, /decorativeReadPath === "\/api\/decorative-background"/);
  assert.match(css, /var\(--fb-glass-decorative-image\),\s*var\(--fb-glass-backdrop-gradient\)/);
  assert.match(worker, /const DECORATIVE_KEY = "banners\/G04\/backdrop-v1\.webp"/);
  assert.match(worker, /env\.PUBLIC_MEDIA_R2\.get\(DECORATIVE_KEY\)/);
  assert.doesNotMatch(route + page + component, /cloudflarestorage\.com|R2_SECRET|R2_ACCESS_KEY/);
  assert.match(route, /base\.hostname\.endsWith\("\.r2\.dev"\)/);
  assert.doesNotMatch(worker + route, /getObject\(|listObjects\(|req\.query\.key/);
});
