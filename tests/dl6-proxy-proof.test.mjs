import test from "node:test";
import assert from "node:assert/strict";
import {createIntakeProof,verifyIntakeProof} from "../lib/outsourcing/proxy-proof.ts";
const secret="b".repeat(64),now=Date.now(),body=JSON.stringify({name:"An",details:"Gia công tập vở"});
const headers=proof=>new Headers({"X-FBMN-DL6-Visitor":proof.visitor,"X-FBMN-DL6-Time":proof.time,
 "X-FBMN-DL6-Signature":proof.signature});
test("DL6 signed visitor identity is per visitor and never includes a raw IP",async()=>{
 const a=await createIntakeProof(secret,"198.51.100.1",body,now);
 const b=await createIntakeProof(secret,"198.51.100.2",body,now);
 assert.notEqual(a.visitor,b.visitor);
 assert.equal(a.visitor.includes("198.51"),false);
 assert.equal(await verifyIntakeProof(secret,headers(a),body,now),a.visitor);
});
test("DL6 proxy handoff rejects tampered payload, visitor and expired timestamp",async()=>{
 const a=await createIntakeProof(secret,"198.51.100.1",body,now);
 assert.equal(await verifyIntakeProof(secret,headers(a),body+"x",now),null);
 assert.equal(await verifyIntakeProof(secret,headers({...a,visitor:"c".repeat(64)}),body,now),null);
 assert.equal(await verifyIntakeProof(secret,headers(a),body,now+100000),null);
 assert.equal(await verifyIntakeProof("c".repeat(64),headers(a),body,now),null);
});
test("DL6 untrusted public clients cannot forge proxy identity",async()=>{
 const h=new Headers({"Origin":"https://fbmn-web.vercel.app"});
 assert.equal(await verifyIntakeProof(secret,h,body,now),null);
});
