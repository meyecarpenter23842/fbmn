import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const exists = path => existsSync(new URL("../" + path, import.meta.url));
test("Admin is isolated and website no longer owns auth/admin routes", () => {
  assert.ok(exists("apps/admin/app/page.tsx"));
  assert.ok(exists("apps/admin/app/api/auth/[...path]/route.ts"));
  assert.ok(exists("apps/admin/app/api/admin/[route]/route.ts"));
  assert.equal(exists("app/admin/page.tsx"), false);
  assert.equal(exists("app/api/admin/[route]/route.ts"), false);
  assert.equal(exists("app/api/auth/[...path]/route.ts"), false);
  assert.match(text("apps/admin/app/page.tsx"), /authClient\.signIn\.email/);
  assert.match(text("apps/admin/app/page.tsx"), /authClient\.emailOtp\.requestPasswordReset/);
  assert.match(text("apps/admin/app/page.tsx"), /authClient\.emailOtp\.verifyEmail/);
  assert.ok(exists("apps/admin/public/brand/fbmn-official-logo.webp"));
});
test("Admin preview deployment cannot run automatically or target production", () => {
  const flow = text(".github/workflows/admin-preview-deploy.yml");
  assert.match(flow, /issue_comment:/);
  assert.match(flow, /\/deploy admin preview/);
  assert.doesNotMatch(flow, /push:\s*\n|--prod|--target=production|\/deploy admin production/);
  assert.doesNotMatch(flow, /working-directory:\s*apps\/admin/);
  assert.match(flow, /VERCEL_PROJECT_ID: prj_zfE2VTQuZJkEgOzOfJdokQsk5VZS/);
  const auth = text("scripts/authorize-admin-preview.mjs");
  assert.match(auth, /has_unresolved_findings === false/);
  assert.match(auth, /matching\[0\].*conclusion === "success"/);
  assert.match(auth, /main\.object\?\.sha === pr\.merge_commit_sha/);
});
