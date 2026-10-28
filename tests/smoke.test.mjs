import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const get = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage renders Futurebook brand", () => {
  assert.match(get("app/page.tsx"), /Futurebook Miền Nam/);
});

test("foundation does not show unverified mockup prices", () => {
  assert.doesNotMatch(get("app/page.tsx"), /14\.500|25\.000|10\.000\+|0901\.567\.789/);
});

test("client pages never embed secrets", () => {
  assert.doesNotMatch(get("app/page.tsx") + get("app/layout.tsx"), /DATABASE_URL|NEON_API_KEY|R2_SECRET/);
});
