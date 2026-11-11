import test from "node:test";
import assert from "node:assert/strict";
import {ceoReadTarget} from "../lib/ceo-api-guard.mjs";
test("DL12A restricts GET targets to approved Owner inboxes",()=>{
 assert.equal(ceoReadTarget("contact-requests","?page=2"),"/v1/admin/website/contact-requests?page=2");
 assert.equal(ceoReadTarget("outsourcing-requests","?page=1"),"/v1/admin/website/outsourcing-requests?page=1");
 assert.equal(ceoReadTarget("chat-history","?page=1&q=hello"),"/v1/admin/website/chat-history?page=1&q=hello");
 for(const value of [["../../pricing",""],["session",""],["chat-history","?url=https://evil.example"],["contact-requests","?token=x"],["contact-requests","?page=-1"],["contact-requests","?page=1000"],["chat-history","?q=x&session=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],["chat-history","?from=2026-02-30"],["chat-history","?session=../admin"]])
  assert.equal(ceoReadTarget(...value),null,JSON.stringify(value));
});
