import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// Both prerequisities must consult a DB-verified Worker session, not role-only gates.
for(const route of ["inspect","preview"]){
 test("USER01 delegated catalogue import "+route+" honors DB-backed write grants",()=>{
  const code=readFileSync(new URL("../apps/admin/app/api/catalogue/"+route+"/route.ts",import.meta.url),"utf8");
  assert.ok(code.includes("admin.catalogue.write"));
  assert.ok(code.includes("Array.isArray(identity?.permissions)"));
  assert.ok(code.includes("/v1/admin/session"));
  assert.ok(code.includes("forbidden")||code.includes("insufficient_role"));
 });
}
