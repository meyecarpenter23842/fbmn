import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("SEO P0 production public API must retain the workers.dev host used by Website SSR",()=>{
  const config=JSON.parse(readFileSync(new URL("../backend/public-api/wrangler.jsonc",import.meta.url),"utf8"));
  assert.equal(config.name,"futurebook-mien-nam-public-api-staging");
  assert.equal(config.workers_dev,true,"Vercel FBMN_PUBLIC_API_BASE_URL points to this workers.dev hostname");
  assert.equal(config.vars.PUBLIC_P5_ENABLED,"true");
  assert.ok(config.vars.PUBLIC_ALLOWED_ORIGINS.split(",").includes("https://www.fbmn.vn"));
  assert.ok(config.hyperdrive.some(binding=>binding.binding==="HYPERDRIVE"));
});
