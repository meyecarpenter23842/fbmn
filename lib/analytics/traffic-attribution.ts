import type {TrafficSource,TrafficChannel} from "./web-events";

// First-touch attribution, strictly enum-only. No referrer URLs, search terms,
// click IDs, campaign free-text or person identifiers leave the browser.
export function classifyWebsiteTraffic(search:string,referrer:string,currentHostname:string){
 const qs=new URLSearchParams(search);
 const utm=(qs.get("utm_source")||"").trim().toLowerCase();
 const rawMedium=(qs.get("utm_medium")||"").trim().toLowerCase();
 const mediums=new Set(["organic","cpc","paid","paid_search","paid_social","social","referral","email","other"]);
 const medium=mediums.has(rawMedium)?rawMedium:undefined;
 const rawCampaign=(qs.get("utm_campaign")||"").trim().toLowerCase();
 const campaign=/^fbmn-[a-z0-9-]{1,48}$/.test(rawCampaign)?rawCampaign:undefined;
 const clickMarker=["gclid","gbraid","wbraid"].some(key=>qs.has(key));
 let referrerIsGoogle=false,referrerSource:TrafficSource="direct";
 if(referrer)try{
  const host=new URL(referrer).hostname.toLowerCase();
  const own=new Set(["fbmn.vn","www.fbmn.vn","fbmn.com.vn","www.fbmn.com.vn",currentHostname.toLowerCase()]);
  if(!own.has(host)){
   if(/^(?:(?:www|m)\.)?google\.(?:com(?:\.[a-z]{2})?|co\.[a-z]{2}|[a-z]{2,3})$/.test(host)){
    referrerSource="google";referrerIsGoogle=true;
   }else if(/(^|\.)(facebook\.com|fb\.com|instagram\.com)$/.test(host))referrerSource="facebook";
   else if(/(^|\.)(zalo\.me|zaloapp\.com)$/.test(host))referrerSource="zalo";
   else referrerSource="referral";
  }
 }catch{/* Invalid referrer is neither stored nor forwarded. */}
 let source:TrafficSource="direct";
 if(clickMarker||["google","googleads","gads"].includes(utm))source="google";
 else if(["facebook","fb","instagram","meta"].includes(utm))source="facebook";
 else if(["zalo","zalo_ads"].includes(utm))source="zalo";
 else if(utm)source="referral";
 else source=referrerSource;
 let channel:TrafficChannel="direct";
 if(source==="google"){
  if(clickMarker||["googleads","gads"].includes(utm)||
   ["cpc","paid","paid_search"].includes(medium||""))channel="google_paid";
  else if(medium==="organic"||(!utm&&!medium&&referrerIsGoogle))channel="google_organic";
  else channel="google_unclassified";
 }else if(source==="facebook"||source==="zalo")channel="social";
 else if(source==="referral")channel="referral";
 return {source,channel,medium,campaign};
}

// Canonical public path ONLY; never store arbitrary routes, query strings,
// search phrases, private IDs, visitor input or fragments.
export function analyticsPublicPageKey(path:string):string|undefined{
 if(["/","/san-pham","/catalogue","/lien-he","/gia-cong","/dai-ly"].includes(path))return path;
 // Never trust user-written slugs. Published records are tracked separately
 // through WebInterestView after server resolution, not pageview paths.
 return undefined;
}
