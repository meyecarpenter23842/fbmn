import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// The Worker session is DB-verified before any spreadsheet bytes are parsed.
for(const route of ["inspect","preview"]){
 test("USER01 delegated catalogue import "+route+" accepts DB-backed write grants",()=>{
  const code=readFileSync(new URL("../apps/admin/app/api/catalogue/"+route+"/route.ts",import.meta.url),"utf8");
  assert.match(code,/admin\\.catalogue\\.write/);
  assert.match(code,/Array\\.isArray\\(identity\\?\\.permissions\\)/);
  assert.match(code,/if \\(!ROLES\\.has|if\\(!\\["owner","admin","editor"\\]/);
  assert.match(code,/\/v1\/admin\/session/);
 });
}
