"use client";
import type {WebEvent,TrafficSource,TrafficChannel,WebAnalyticsRecord} from "./web-events";
import {classifyWebsiteTraffic} from "./traffic-attribution";
type ClientDetails=Partial<Pick<WebAnalyticsRecord,"page_type"|"page_key"|"category_key"|"product_key"|"sku"|"book_id"|"cta_location">>;
type Session={id:string;last:number;source:TrafficSource;channel:TrafficChannel;medium?:string;campaign?:string};
const KEY="fbmn-web-analytics-session-v2";
const THIRTY_MIN=30*60*1000;
let memorySession:Session|null=null;
function attribution():Pick<Session,"source"|"channel"|"medium"|"campaign">{
 return classifyWebsiteTraffic(window.location.search,document.referrer,window.location.hostname);
}
function loadSession():{value:Session;fresh:boolean}{
 const now=Date.now();let existing=memorySession;
 try{
  const item=sessionStorage.getItem(KEY);
  if(item){const parsed=JSON.parse(item) as Session;
   if(typeof parsed.id==="string"&&typeof parsed.last==="number"&&
    ["direct","google","facebook","zalo","referral"].includes(parsed.source)&&
    ["direct","google_organic","google_paid","google_unclassified","social","referral"].includes(parsed.channel)&&
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
 const record:WebAnalyticsRecord={
  event,session_id:s.id,traffic_source:s.source,traffic_channel:s.channel,...details
 };
 if(s.medium)record.utm_medium=s.medium;
 if(s.campaign)record.utm_campaign=s.campaign;
 // No PII or browser-generated auto-capture; send only the explicitly approved schema.
 void fetch("/api/analytics",{method:"POST",headers:{"Content-Type":"application/json"},
  credentials:"omit",cache:"no-store",keepalive:true,body:JSON.stringify(record)}).catch(()=>{});
}
export function trackWebEvent(event:WebEvent,details:ClientDetails={}){
 try{
 if(typeof window==="undefined"||window.location.pathname==="/policy")return;
 if(!globalThis.crypto?.randomUUID)return;
 if(navigator.doNotTrack==="1"||(navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl===true)return;
 const {value,fresh}=loadSession();
 if(fresh)emit("web_session_start",value);
 emit(event,value,details);
 }catch{/* Analytics is strictly best-effort; never break forms, chat or catalogue. */}
}
