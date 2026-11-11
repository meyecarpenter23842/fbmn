import {test} from "node:test";
import assert from "node:assert/strict";
import {pushEndpoint,parseSubscription,validRef,pushPayload,pushRoute,allowedOrigin} from "../lib/ceo-push-policy.mjs";
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
