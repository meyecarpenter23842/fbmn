import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validRef} from "../lib/ceo-push-policy.mjs";
const route=readFileSync(new URL("../app/api/ceo/alerts/route.ts",import.meta.url),"utf8");
const worker=readFileSync(new URL("../app/api/ceo/push/dispatch/route.ts",import.meta.url),"utf8");
test("CEO-NOTIFY04 alert API is Owner-only, global, and read cursor is server derived",()=>{
 assert.match(route,/requireOwner\(request\)/);
 assert.match(route,/allowedOrigin\(request\)/);
 assert.match(route,/count\(\*\) OVER\(\)/);
 assert.match(route,/GREATEST\(/);
 assert.match(route,/t\.created_at/);
 assert.match(route,/e\.occurred_at/);
 assert.match(route,/ON CONFLICT\(owner_subject,kind,ref\)/);
 assert.match(route,/turnId/);
 assert.doesNotMatch(route,/new Date\(/);
 assert.doesNotMatch(route,/question|email_body|authorization.*localStorage/i);
 assert.equal(validRef("chat","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),true);
 assert.equal(validRef("mail","aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),true);
});
test("CEO-NOTIFY04 chat alert events group return visits rather than every turn",()=>{
 assert.match(worker,/chat_turns/);
 assert.match(worker,/interval '30 minutes'/);
 assert.match(worker,/LAG\(created_at\)/);
});
