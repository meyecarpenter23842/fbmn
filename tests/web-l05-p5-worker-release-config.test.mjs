import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("L05 P5 public Worker uses only dedicated restricted Hyperdrive and never an Admin database role", () => {
  const config = JSON.parse(readFileSync(
    new URL("../backend/public-api/wrangler.jsonc", import.meta.url), "utf8"));
  assert.equal(config.name, "futurebook-mien-nam-public-api-staging");
  assert.equal(config.workers_dev, false, "Worker routes stay under existing authorized dashboard controls");
  assert.equal(config.vars.PUBLIC_P5_ENABLED, "true");
  assert.equal(config.vars.EXPECTED_DB_ROLE, "fbmn_p5_public_login");
  assert.deepEqual(config.hyperdrive, [{
    binding: "HYPERDRIVE", id: "a41b7ba00cbe4bf6b6485dee613f0a77",
  }]);
  assert.ok(config.vars.PUBLIC_ALLOWED_ORIGINS.includes("https://fbmn-web.vercel.app"));
  assert.ok(config.r2_buckets.some(x => x.binding === "PUBLIC_MEDIA_R2" && x.bucket_name === "fbmn"));
  assert.ok(config.ratelimits.some(x => x.name === "RATE_LIMITER"));
  assert.ok(config.ratelimits.some(x => x.name === "IMAGE_RATE_LIMITER"));
  assert.ok(!/neondb_owner|fbmn_admin_http_staging|fbmn_catalog_private|NET/.test(JSON.stringify(config)));
});
