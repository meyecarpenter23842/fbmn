import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("both apps display the same Owner-supplied FBMN red/purple mark, not the wordmark",()=>{
 const icon = read("public/brand/fbmn-mark.svg");
 assert.equal(read("apps/admin/public/brand/fbmn-mark.svg"),icon);
 assert.equal(read("public/favicon.svg"),icon);
 assert.match(icon, /viewBox="0 0 726 715"/);
 assert.match(icon, /#623f9b/);
 assert.match(icon, /#c8222c/);
 assert.match(icon, /Biểu tượng FBMN/);
 for (const p of ["app/layout.tsx","apps/admin/app/layout.tsx"]) {
  const src=read(p);
  assert.match(src, /icons:.*fbmn-mark\.svg\?v=20261104/);
  assert.doesNotMatch(src, /icons:.*fbmn-official-logo\.webp/);
 }
 for (const p of ["app/favicon.ico/route.ts","apps/admin/app/favicon.ico/route.ts"]) {
  const src=read(p);
  assert.match(src, /fbmn-mark\.svg\?v=20261104/);
  assert.match(src, /307/);
 }
});
