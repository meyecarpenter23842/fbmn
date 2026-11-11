"use client";
import type {WebEvent,TrafficSource,WebAnalyticsRecord} from "./web-events";
type ClientDetails=Partial<Pick<WebAnalyticsRecord,"page_type"|"category_key"|"product_key"|"sku"|"book_id">>;
type Session={id:string;last:number;source:TrafficSource;medium?:string;campaign?:string};
const KEY="fbmn-web-analytics-session-v1";
const THIRTY_MIN=30*60*1000;
let memorySession:Session|null=null;
function attribution():Pick<Session,"source"|"medium"|"campaign">{
 const qs=new URLSearchParams(window.location.search);
 const utm=(qs.get("utm_source")||"").toLowerCase();
 let source:TrafficSource="direct";
 if(["google","googleads","gads"].includes(utm))source="google";
 else if(["facebook","fb","instagram","meta"].includes(utm))source="facebook";
 else if(["zalo","zalo_ads"].includes(utm))source="zalo";
 else if(utm)source="referral";
 else if(document.referrer){
  try{
   const hostname=new URL(document.referrer).hostname.toLowerCase();
   if(/(^|\.)google\.[a-z.]+$/.test(hostname))source="google";
   else if(/(^|\.)(facebook\.com|fb\.com|instagram\.com)$/.test(hostname))source="facebook";
   else if(/(^|\.)(zalo\.me|zaloapp\.com)$/.test(hostname))source="zalo";
   else if(hostname!==window.location.hostname)source="referral";
  }catch{/* No referrer URL ever leaves the browser. */}
 }
 const rawMedium=(qs.get("utm_medium")||"").toLowerCase();
 const medium=["organic","cpc","paid","paid_social","social","referral","email","other"].includes(rawMedium)?rawMedium:undefined;
 const rawCampaign=(qs.get("utm_campaign")||"").toLowerCase();
 const campaign=/^fbmn-[a-z0-9-]{1,48}$/.test(rawCampaign)?rawCampaign:undefined;
 return {source,medium,campaign};
}
function loadSession():{value:Session;fresh:boolean}{
 const now=Date.now();let existing=memorySession;
 try{
  const item=sessionStorage.getItem(KEY);
  if(item){const parsed=JSON.parse(item) as Session;
   if(typeof parsed.id==="string"&&typeof parsed.last==="number"&&
    ["direct","google","facebook","zalo","referral"].includes(parsed.source)&&
    now-parsed.last<THIRTY_MIN&&now>=parsed.last)existing=parsed;
  }
 }catch{/* Tracking remains optional if storage is blocked. */}
 const fresh=!existing||now-existing.last>=THIRTY_MIN;
 const value:Session=fresh?{id:crypto.randomUUID(),last:now,...attribution()}:{...existing!,last:now};
 memorySession=value;
 try{sessionStorage.setItem(KEY,JSON.stringify(value));}catch{}
 return {value,fresh};
}
function emit(event:WebEvent,s:Session,details:ClientDetails={}){
 const record:WebAnalyticsRecord={event,session_id:s.id,traffic_source:s.source,...details};
 if(s.medium)record.utm_medium=s.medium;
 if(s.campaign)record.utm_campaign=s.campaign;
 // No PII or browser-generated auto-capture; send only the explicitly approved schema.
 void fetch("/api/analytics",{method:"POST",headers:{"Content-Type":"application/json"},
  credentials:"omit",cache:"no-store",keepalive:true,body:JSON.stringify(record)}).catch(()=>{});
}
export function trackWebEvent(event:WebEvent,details:ClientDetails={}){
 if(typeof window==="undefined"||window.location.pathname==="/policy")return;
 if(navigator.doNotTrack==="1"||(navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl===true)return;
 const {value,fresh}=loadSession();
 if(fresh)emit("web_session_start",value);
 emit(event,value,details);
}
