import {test} from "node:test";
import assert from "node:assert/strict";
import {createHmac,randomBytes} from "node:crypto";
import {verifyResendWebhook,parseReceivedMailSignal} from "../lib/ceo-mail-webhook.mjs";
const id="11111111-1111-4111-8111-111111111111";
const key=randomBytes(32),secret="whsec_"+key.toString("base64url");
const now=Date.parse("2026-11-12T12:00:00Z");
function signed(body,when=now){
 const eventId="msg_1234567890",ts=String(Math.floor(when/1000));
 const hash=createHmac("sha256",key).update(eventId+"."+ts+"."+body).digest("base64");
 return new Headers({"svix-id":eventId,"svix-timestamp":ts,"svix-signature":"v1,"+hash});
}
function signal(data={}){
 return JSON.stringify({type:"email.received",created_at:"2026-11-12T12:00:00Z",
  data:{email_id:id,created_at:"2026-11-12T12:00:00Z",to:["info@fbmn.vn"],
   from:"customer@example.com",subject:"Sensitive offer",...data}});
}
test("Resend Svix signature checks raw bytes, old replays, malformed/forged signatures",()=>{
 const body=signal();
 assert.equal(verifyResendWebhook(body,signed(body),secret,now),true);
 assert.equal(verifyResendWebhook(body.replace("offer","quote"),signed(body),secret,now),false);
 assert.equal(verifyResendWebhook(body,signed(body,now-301000),secret,now),false);
 assert.equal(verifyResendWebhook(body,new Headers(),secret,now),false);
 assert.equal(verifyResendWebhook(body,signed(body),"invalid",now),false);
 assert.equal(verifyResendWebhook("x".repeat(40000),signed("x".repeat(40000)),secret,now),false);
});
test("mail event allows only real company inbox UUID; never outputs customer PII",()=>{
 const out=parseReceivedMailSignal(signal(),now);
 assert.deepEqual(out,{id,occurredAt:"2026-11-12T12:00:00.000Z"});
 assert.equal(JSON.stringify(out).includes("Sensitive"),false);
 assert.equal(parseReceivedMailSignal(signal({to:["other@example.com"]}),now),null);
 assert.equal(parseReceivedMailSignal(signal({email_id:"../../evil"}),now),null);
 assert.equal(parseReceivedMailSignal(signal({to:["customer@example.com"],cc:["info@fbmn.vn"]}),now)?.id,id);
 assert.equal(parseReceivedMailSignal(JSON.stringify({type:"email.sent",data:{email_id:id}}),now),null);
 assert.equal(parseReceivedMailSignal(signal({created_at:"2026-11-01T00:00:00Z"}),now),null);
});
