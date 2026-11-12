// CEO-MAIL02: Resend inbound signal only. Never execute or forward email contents.
import {createHmac,timingSafeEqual} from "node:crypto";
import {isCompanyMailbox} from "./ceo-mail-policy.mjs";
import {validRef} from "./ceo-push-policy.mjs";

export const MAX_RESEND_WEBHOOK_BYTES=32_768;
export function verifyResendWebhook(raw,headers,secret,now=Date.now()){
 if(typeof raw!=="string"||Buffer.byteLength(raw,"utf8")>MAX_RESEND_WEBHOOK_BYTES||
    typeof secret!=="string"||!/^whsec_[A-Za-z0-9_-]{16,}$/.test(secret))return false;
 const id=headers.get("svix-id")||"",ts=headers.get("svix-timestamp")||"",
  signatures=headers.get("svix-signature")||"";
 if(!/^[A-Za-z0-9_-]{6,128}$/.test(id)||!/^[0-9]{10,13}$/.test(ts)||
   !signatures||Math.abs(now-Number(ts)*1000)>300_000)return false;
 const key=Buffer.from(secret.slice(6),"base64url");
 if(key.length<16)return false;
 const expected=createHmac("sha256",key).update(id+"."+ts+"."+raw).digest();
 for(const candidate of signatures.split(/\s+/)){
  const match=/^v1,([A-Za-z0-9+/=]{40,60})$/.exec(candidate);
  if(!match)continue;
  const supplied=Buffer.from(match[1],"base64");
  if(supplied.length===expected.length&&timingSafeEqual(supplied,expected))return true;
 }
 return false;
}
export function parseReceivedMailSignal(raw,now=Date.now()){
 let event;
 try{event=JSON.parse(raw);}catch{return null;}
 if(!event||event.type!=="email.received"||
   !event.data||typeof event.data!=="object")return null;
 const item=event.data;
 if(!validRef("mail",item.email_id)||!isCompanyMailbox(item,"inbox"))return null;
 const instant=Date.parse(item.created_at||event.created_at||"");
 if(!Number.isFinite(instant)||instant<now-3*86400_000||instant>now+300_000)return null;
 // Persist ONLY provider ID + timestamp; never copy sender, subject or mail body.
 return {id:item.email_id.toLowerCase(),occurredAt:new Date(instant).toISOString()};
}
