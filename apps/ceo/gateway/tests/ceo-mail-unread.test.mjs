import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {mailCandidates,MAIL_UNREAD_SQL,MAIL_READABLE_SQL} from "../lib/ceo-mail-unread.mjs";
const at=["2026-11-12T01:31:00Z","2026-11-12T01:33:00Z",
 "2026-11-12T02:21:09Z","2026-11-12T02:47:44Z","2026-11-12T03:52:04Z"];
const ids=at.map((_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,"0")}`);
const r=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
test("MAIL07 indexes all Resend inbox IDs, not just 3 webhook notifications",()=>{
 const inbox=ids.map((id,i)=>({id,created_at:at[i],from:"private@customer.example",
  subject:"Private commercial data",text:"Do not index contents"}));
 const index=mailCandidates(inbox);
 assert.equal(index.length,5);
 assert.deepEqual(index.map(x=>x.ref),ids);
 assert.equal(JSON.stringify(index).includes("Private commercial data"),false);
});
test("MAIL07 rejects invalid and untrusted mail metadata",()=>{
 assert.deepEqual(mailCandidates([{},null,{id:"../admin",created_at:at[0]},
  {id:ids[0],created_at:"not-a-date"},
  {id:ids[1],created_at:"1970-01-01T00:00:00Z"}]),[]);
});
test("MAIL07 unread source merges provider catalog and webhook without push backfill",()=>{
 assert.match(MAIL_UNREAD_SQL,/ceo_push_events/);
 assert.match(MAIL_UNREAD_SQL,/ceo_mail_catalog/);
 assert.match(MAIL_UNREAD_SQL,/notice_eligible/);
 assert.match(MAIL_UNREAD_SQL,/read_through/);
 assert.match(MAIL_READABLE_SQL,/ceo_mail_catalog/);
 const alerts=r("../app/api/ceo/alerts/route.ts");
 const list=r("../app/api/ceo/mail/route.ts");
 assert.match(alerts,/MAIL_UNREAD_SQL/);
 assert.match(alerts,/MAIL_READABLE_SQL/);
 assert.match(alerts,/refreshMailIndexIfDue/);
 assert.match(list,/indexReceived/);
 assert.match(list,/inboxUnread/);
 assert.match(list,/readStateAvailable/);
 assert.doesNotMatch(r("../lib/ceo-mail-index.ts"),/INSERT INTO fbmn_catalog_private\.ceo_push_events/);
});
test("MAIL07 never treats every historical provider message as unread",()=>{
 const index=r("../lib/ceo-mail-index.ts");
 const migration=r("../../../../backend/neon/migrations/20261113_ceo_mail07_index.up.sql");
 assert.match(index,/occurred_at >= \$3::timestamptz/);
 assert.match(migration,/cutover_at timestamptz NOT NULL DEFAULT now\(\)/);
 assert.match(migration,/GRANT SELECT,INSERT,UPDATE ON fbmn_catalog_private.ceo_mail_catalog/);
 assert.equal((migration.match(/BEGIN;/g)||[]).length,1);
 assert.equal((migration.match(/COMMIT;/g)||[]).length,1);
 assert.equal((migration.match(/CREATE TABLE IF NOT EXISTS/g)||[]).length,2);
 assert.match(migration,/scan_cursor ~\\* '[^']+'\\s*\\)\\s*\\);/);
 
 assert.match(index,/scan_cursor/);
 assert.match(index,/&after=/);
 assert.match(index,/cutover_at/);
 const dispatch=r("../app/api/ceo/push/dispatch/route.ts");
 assert.match(dispatch,/MAIL_UNREAD_SQL/);
 const ui=readFileSync(new URL("../../flutter/lib/ceo_mail.dart",import.meta.url),"utf8");
 assert.match(ui,/if\(!ctx\.mounted\)return;/);
 
});
