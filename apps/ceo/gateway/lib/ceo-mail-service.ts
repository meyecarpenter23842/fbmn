import "server-only";
import {addressOf,isCompanyMailbox,MAIL_FROM} from "./ceo-mail-policy.mjs";
const BASE="https://api.resend.com";
function emailKey(){const value=process.env.RESEND_API_KEY||"";return /^re_[A-Za-z0-9_-]{16,}$/.test(value)?value:null;}
export async function resendRequest(path:string,options:{method?:"GET"|"POST";body?:unknown;requestId?:string}={}):Promise<{status:number;payload:Record<string,unknown>|null}>{
 const key=emailKey();if(!key)return {status:503,payload:null};
 const headers:Record<string,string>={Authorization:"Bearer "+key,Accept:"application/json"};
 if(options.body!==undefined)headers["Content-Type"]="application/json";
 if(options.requestId)headers["Idempotency-Key"]="ceo-mail/"+options.requestId;
 try{
  const response=await fetch(BASE+path,{
   method:options.method||"GET",headers,cache:"no-store",redirect:"manual",
   body:options.body===undefined?undefined:JSON.stringify(options.body),
   signal:AbortSignal.timeout(12000)
  });
  if(!response.headers.get("content-type")?.includes("application/json"))
   return {status:503,payload:null};
  const raw=await response.text();
  if(raw.length>1_000_000)return {status:503,payload:null};
  const payload=JSON.parse(raw) as Record<string,unknown>;
  if(!response.ok)return {status:response.status===429?429:503,payload:null};
  return {status:200,payload};
 }catch{return {status:503,payload:null};}
}
export function mailVisible(item:unknown,box:string):boolean{
 return isCompanyMailbox(item,box);
}
export function recipientForReply(item:unknown):string|null{
 if(!isCompanyMailbox(item,"inbox"))return null;
 return addressOf((item as {reply_to?:unknown;from?:unknown}).reply_to instanceof Array?
  (item as {reply_to:string[]}).reply_to[0]:(item as {from?:unknown}).from) ||
  addressOf((item as {from?:unknown}).from);
}
