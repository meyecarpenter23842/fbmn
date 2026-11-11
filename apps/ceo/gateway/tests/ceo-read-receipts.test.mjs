import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseReadMark,readRequestIds,attachReadReceipts} from "../lib/ceo-read-policy.mjs";
const id="11111111-1111-4111-8111-111111111111";
test("DL12E read receipt rejects untrusted status changes and arbitrary IDs",()=>{
 assert.deepEqual(parseReadMark({kind:"contact",id}),{kind:"contact",id});
 assert.deepEqual(parseReadMark({kind:"outsourcing",id}),{kind:"outsourcing",id});
 for(const invalid of [null,[],{}, {kind:"chat",id},{kind:"contact",id:"../admin"},
  {kind:"contact",id,status:"handled"},{kind:"contact",id,owner_subject:"fake"}])
  assert.equal(parseReadMark(invalid),null);
});
test("DL12E read flags come only from Owner receipts; no change to request workflow status",()=>{
 const request={id,status:"new",name:"Khách thử"};
 const body={data:{requests:[request],page:1,hasMore:false}};
 assert.deepEqual(readRequestIds(body),[id]);
 assert.equal(readRequestIds({data:{requests:[{id:"invalid"}]}}),null);
 assert.equal(readRequestIds({data:{requests:Array(51).fill(request)}}),null);
 const viewed=attachReadReceipts(body,[{id,viewed_at:"2026-11-11T13:00:00Z"}]);
 assert.equal(viewed.data.requests[0].viewedAt,"2026-11-11T13:00:00.000Z");
 assert.equal(viewed.data.requests[0].status,"new");
 assert.equal(body.data.requests[0].viewedAt,undefined);
 assert.equal(attachReadReceipts(body,[]).data.requests[0].viewedAt,null);
});
test("DL12E Owner POST is origin-checked, bounded, and never mutates business status",()=>{
 const route=readFileSync(new URL("../app/api/ceo/reads/route.ts",import.meta.url),"utf8");
 const gate=readFileSync(new URL("../app/api/ceo/[section]/route.ts",import.meta.url),"utf8");
 const migration=readFileSync(new URL("../../../../backend/neon/migrations/20261111_dl12e_ceo_request_reads.up.sql",import.meta.url),"utf8");
 assert.match(route,/allowedOrigin\(request\)/);
 assert.match(route,/requireOwner\(request\)/);
 assert.match(route,/ON CONFLICT DO NOTHING/);
 assert.doesNotMatch(route,/UPDATE\s+fbmn_catalog_private\.(contact_requests|outsourcing_requests)/);
 assert.match(gate,/attachReadReceipts/);
 assert.match(migration,/PRIMARY KEY\(owner_subject,kind,request_id\)/);
 assert.match(migration,/GRANT SELECT,INSERT,DELETE/);
});
