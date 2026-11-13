/**
 * DL11C: strict, personless public Website analytics contract.
 * Never accept free-form strings, referrer URLs, user agent, form/chat contents or PII.
 */
export const WEB_EVENTS = [
  "web_session_start", "web_page_view", "web_category_view", "web_product_view",
  "web_sku_view", "web_catalogue_view", "web_pdf_view_request",
  "web_pdf_download_request", "web_pdf_view_served", "web_pdf_download_served",
  "web_chat_open", "web_contact_submit_attempt", "web_contact_submit_success",
  "web_outsourcing_submit_attempt", "web_outsourcing_submit_success",
  "web_lead_cta_click"
] as const;
export type WebEvent = typeof WEB_EVENTS[number];
export type TrafficSource = "direct"|"google"|"facebook"|"zalo"|"referral";
export type TrafficChannel = "direct"|"google_organic"|"google_paid"|"google_unclassified"|"social"|"referral";
export type LeadCtaLocation = "product_primary"|"product_mobile"|"dealer"|"catalogue";
export type WebAnalyticsRecord = {
  event:WebEvent;session_id:string;traffic_source:TrafficSource;
  utm_medium?:string;utm_campaign?:string;traffic_channel?:TrafficChannel;
  page_type?:string;page_key?:string;cta_location?:LeadCtaLocation;
  category_key?:string;product_key?:string;sku?:string;book_id?:string;
};
const EVENTS = new Set<string>(WEB_EVENTS);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
// Match the published catalogue identifier contract: ASCII letters, digits, underscore, dash.
const SLUG=/^[a-z0-9][a-z0-9_-]{0,119}$/i;
const SKU=/^[A-Za-z0-9][A-Za-z0-9._\/-]{0,63}$/;
const BOOK=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const SOURCES=new Set(["direct","google","facebook","zalo","referral"]);
const CHANNELS=new Set<TrafficChannel>(["direct","google_organic","google_paid","google_unclassified","social","referral"]);
const CTA_LOCATIONS=new Set<LeadCtaLocation>(["product_primary","product_mobile","dealer","catalogue"]);
const PUBLIC_PAGE=/^(?:\/|\/(?:san-pham|catalogue|lien-he|gia-cong|dai-ly))$/i;
const MEDIUMS=new Set(["organic","cpc","paid","paid_search","paid_social","social","referral","email","other"]);
const PAGES=new Set(["home","products","product","category","catalogue","contact","outsourcing","dealer","news","promotion","other"]);
const DETAILS:Record<WebEvent,readonly string[]>={
  web_session_start:[],web_page_view:["page_type"],
  web_category_view:["category_key"],web_product_view:["product_key"],
  web_sku_view:["product_key","sku"],web_catalogue_view:["book_id"],
  web_pdf_view_request:["book_id"],web_pdf_download_request:["book_id"],
  web_pdf_view_served:["book_id"],web_pdf_download_served:["book_id"],
  web_chat_open:[],web_contact_submit_attempt:[],web_contact_submit_success:[],
  web_outsourcing_submit_attempt:[],web_outsourcing_submit_success:[],
  web_lead_cta_click:["cta_location"]
};
export function parseWebAnalytics(value:unknown):WebAnalyticsRecord|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(typeof v.event!=="string"||!EVENTS.has(v.event)||typeof v.session_id!=="string"||
  !UUID.test(v.session_id)||!SOURCES.has(String(v.traffic_source)))return null;
 const event=v.event as WebEvent;
 // PDF served events are reserved for the trusted GET proxy, never public POST.
 if(event==="web_pdf_view_served"||event==="web_pdf_download_served")return null;
 const allowed=new Set(["event","session_id","traffic_source","traffic_channel","utm_medium","utm_campaign",...DETAILS[event],...(event==="web_page_view"?["page_key"]:[]),...(event==="web_lead_cta_click"?["product_key"]:[])]);
 if(Object.keys(v).some(k=>!allowed.has(k)))return null;
 if(v.utm_medium!==undefined&&!MEDIUMS.has(String(v.utm_medium)))return null;
 if(v.traffic_channel!==undefined){
  const channel=v.traffic_channel as TrafficChannel;
  if(!CHANNELS.has(channel))return null;
  if(channel.startsWith("google_")&&v.traffic_source!=="google")return null;
  if(channel==="direct"&&v.traffic_source!=="direct")return null;
  if(channel==="social"&&v.traffic_source!=="facebook"&&v.traffic_source!=="zalo")return null;
  if(channel==="referral"&&v.traffic_source!=="referral")return null;
  if(v.traffic_source==="google"&&!channel.startsWith("google_"))return null;
 }
 // Only campaign codes under Futurebook's own naming convention; never arbitrary UTM text.
 if(v.utm_campaign!==undefined&&(typeof v.utm_campaign!=="string"||
   !/^fbmn-[a-z0-9-]{1,48}$/.test(v.utm_campaign)))return null;
 if(v.page_type!==undefined&&!PAGES.has(String(v.page_type)))return null;
 if(v.page_key!==undefined&&(typeof v.page_key!=="string"||!PUBLIC_PAGE.test(v.page_key)))return null;
 if(v.cta_location!==undefined&&!CTA_LOCATIONS.has(v.cta_location as LeadCtaLocation))return null;
 if(v.category_key!==undefined&&(typeof v.category_key!=="string"||!SLUG.test(v.category_key)))return null;
 if(v.product_key!==undefined&&(typeof v.product_key!=="string"||!SLUG.test(v.product_key)))return null;
 if(v.sku!==undefined&&(typeof v.sku!=="string"||!SKU.test(v.sku)))return null;
 if(v.book_id!==undefined&&(typeof v.book_id!=="string"||!BOOK.test(v.book_id)))return null;
 if(DETAILS[event].some(k=>typeof v[k]!=="string"))return null;
 // page_key is optional to preserve the older event contract, but only for page views.
 // The CTA's public product slug is optional for pages without a selected product.
 return v as WebAnalyticsRecord;
}
export function websiteCapturePayload(key:string,record:WebAnalyticsRecord){
 const {event,session_id,...properties}=record;
 return {
  api_key:key,event,distinct_id:"fbmn-web-session-"+session_id,
  properties:{...properties,app:"futurebook_website",
   $session_id:session_id,$ip:null,$geoip_disable:true,$process_person_profile:false}
 };
}
export function pdfServedPayload(key:string,event:"web_pdf_view_served"|"web_pdf_download_served",book_id:string,uuid:string){
 return {api_key:key,event,distinct_id:"fbmn-web-pdf-"+uuid,
  properties:{book_id,app:"futurebook_website",$ip:null,$geoip_disable:true,$process_person_profile:false}};
}
