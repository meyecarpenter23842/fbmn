import {test} from "node:test";
import assert from "node:assert/strict";
import {pushEndpoint,parseSubscription,validRef,pushPayload,pushRoute,allowedOrigin,pendingTargets} from "../lib/ceo-push-policy.mjs";
const sub={endpoint:"https://fcm.googleapis.com/fcm/send/something",
 keys:{p256dh:"a".repeat(87),auth:"b".repeat(22)}};
test("browser push endpoint restricted; prevent server-side request forgery",()=>{
 assert.equal(pushEndpoint(sub.endpoint),true);
 for(const bad of ["http://fcm.googleapis.com/push","https://127.0.0.1/push",
  "https://fcm.googleapis.com.evil.test/push","https://user@fcm.googleapis.com/a",
  "https://localhost/x","https://169.254.169.254/metadata"])assert.equal(pushEndpoint(bad),false);
});
test("subscribe payload must be canonical and not contain credentials",()=>{
 assert.deepEqual(parseSubscription(sub),{endpoint:sub.endpoint,p256dh:sub.keys.p256dh,auth:sub.keys.auth});
 assert.equal(parseSubscription({...sub,admin:true}),null);
 assert.equal(parseSubscription({...sub,keys:{...sub.keys,private_key:"secret"}}),null);
 assert.equal(parseSubscription({...sub,endpoint:"https://evil.test/ssrf"}),null);
});
test("push target route is bounded and never leaks customer data",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 assert.equal(validRef("contact",id),true);
 assert.equal(pushRoute("contact",id),"/ceo/index.html?tab=contact&id="+id);
 assert.equal(pushRoute("mail",id),"/ceo/index.html?tab=mail&id="+id);
 assert.equal(JSON.parse(pushPayload("mail",id,0)).type,"mail");
 assert.equal(pushRoute("contact","../../admin"),"/ceo/index.html");
 assert.equal(JSON.parse(pushPayload("outsourcing",id,500)).badge,99);
 assert.throws(()=>pushPayload("contact","../../admin",5));
});
test("mutations must be same origin, not forged from another site",()=>{
 assert.equal(allowedOrigin(new Request("https://ceo.fbmn.vn/api/ceo/push/subscription",
  {headers:{Origin:"https://ceo.fbmn.vn"}})),true);
 assert.equal(allowedOrigin(new Request("https://ceo.fbmn.vn/api/ceo/push/subscription",
  {headers:{Origin:"https://attacker.test"}})),false);
 assert.equal(allowedOrigin(new Request("https://ceo.fbmn.vn/api/ceo/push/subscription")),false);
});

test("retries exclude already accepted delivery receipts",()=>{
 const now=new Date("2026-11-11T06:00:00Z");
 const subs=[{endpoint:"one",created_at:new Date("2026-11-11T05:00:00Z")},
  {endpoint:"two",created_at:new Date("2026-11-11T05:00:00Z")},
  {endpoint:"late",created_at:new Date("2026-11-11T07:00:00Z")}];
 assert.deepEqual(pendingTargets(subs,["one"],now).map(x=>x.endpoint),["two"]);
});
test("returning chat push uses a distinct non-PII event topic and accurate badge",()=>{
 const id="a".repeat(36),topic="pkvQxwnvAHpKy8quxE_CNgf4g";
 const v=JSON.parse(pushPayload("chat",id,7,topic,true));
 assert.deepEqual(v,{type:"chat",id,badge:7,event:topic,returning:true});
 assert.throws(()=>pushPayload("chat",id,7,"any suspicious personal text",true));
});
