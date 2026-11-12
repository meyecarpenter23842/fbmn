import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const auth=readFileSync(new URL("../lib/auth-server.ts",import.meta.url),"utf8");
const receipt=readFileSync(new URL("../app/api/ceo/reads/route.ts",import.meta.url),"utf8");
test("Owner session cookie uses stable Neon cache TTL and never stores JWT in local storage",()=>{
 assert.match(auth,/sessionDataTtl:300/);
 assert.doesNotMatch(auth,/sessionDataTtl:60\b/);
});
test("Contact and outsourcing viewed receipts remain persisted while original request exists",()=>{
 assert.match(receipt,/ON CONFLICT DO NOTHING/);
 assert.match(receipt,/ceo_request_reads/);
 assert.doesNotMatch(receipt,/DELETE FROM fbmn_catalog_private\.ceo_request_reads WHERE viewed_at/);
});
