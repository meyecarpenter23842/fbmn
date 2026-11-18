// SEO P3: explicit URLs from the GSC "Crawled – currently not indexed"
// report reviewed on 18/11/2026. This is a WATCHLIST, not a claim of current
// indexing state. Every verdict must come from Google URL Inspection itself.
import {gscDates} from "./ceo-search-console.mjs";

export const P3_BASELINE_DATE="2026-11-18";
export const P3_CANONICAL="https://www.fbmn.vn";
export const P3_MILESTONES=Object.freeze([7,14,30]);
const GOOGLE_INSPECTION="https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const GSC_QUERY="https://www.googleapis.com/webmasters/v3/sites/";
const ALLOWED_PROPERTIES=new Set(["sc-domain:fbmn.vn","https://www.fbmn.vn/"]);
const PRODUCT_URLS=[
 ["P003","sku-949cacde498fb835f2a00f2b6f72567d"],
 ["L450","sku-50fe320fb69293159f2dfaa089294fdb"],
 ["0240","sku-52049f0e6880574ccc2c7e909d5b83ed"],
 ["5260","sku-47ea6eb9631d05e8ba503686dd270e9d"],
 ["L413","sku-2df01a79c7f8dbc5056a3ec920614d36"],
 ["8014","sku-b0424457f45c97611583184f6ed8661d"],
 ["L410","sku-ceecf9ef61f0960af5b33515071bf388"],
 ["B871","sku-ac266c31f667783a891270a252827070"],
 ["P0041","sku-03dc5fcd0e7c7eb253a9c86373e3ada9"],
 ["9556","sku-beb386d9cf78fec7989c799181557ba3"],
 ["A571","sku-ffe75ed8029afa28cb16be77c428da20"]
];
export const P3_URLS=Object.freeze([
 Object.freeze({key:"catalogue",label:"Catalogue",url:P3_CANONICAL+"/catalogue"}),
 ...PRODUCT_URLS.map(([key,slug])=>Object.freeze({
  key,label:"SKU "+key,url:P3_CANONICAL+"/san-pham/"+slug
 }))
]);
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const dPlus=(date,days)=>new Date(Date.parse(date+"T00:00:00Z")+days*86400000)
 .toISOString().slice(0,10);
export const p3Schedule=()=>P3_MILESTONES.map(days=>({
 days,dueDate:dPlus(P3_BASELINE_DATE,days)
}));
export const p3Watchlist=()=>({
 source:"gsc_initial_nonindexed_report",baselineDate:P3_BASELINE_DATE,
 note:"Danh sách cần theo dõi; không phản ánh trạng thái index hiện tại. Các mốc tính từ lần phát hành SEO, không phải ngày đã bấm Request indexing.",
 sitemap:P3_CANONICAL+"/sitemap.xml",
 schedule:p3Schedule(),
 urls:P3_URLS
});
export function p3Target(key){
 return typeof key==="string"?P3_URLS.find(item=>item.key===key)||null:null;
}
const safeText=(value,max=250)=>typeof value==="string"&&value.trim()?
 value.trim().slice(0,max):null;
const safeCanonical=(value)=>{
 if(typeof value!=="string"||value.length>1000)return null;
 try{
  const u=new URL(value);
  if(!["https:","http:"].includes(u.protocol)||u.username||u.password||u.port)return null;
  // Query and fragment change canonical identity; never erase them before
  // comparing with a query-free published product URL.
  return u.origin+u.pathname+u.search+u.hash;
 }catch{return null;}
};
const googleLink=(value)=>{
 if(typeof value!=="string"||value.length>1900)return null;
 try{
  const u=new URL(value);
  return u.origin==="https://search.google.com"&&u.pathname.startsWith("/search-console/inspect")?
   u.toString():null;
 }catch{return null;}
};
const validCrawlTime=(value)=>{
 if(typeof value!=="string"||value.length>40||!Number.isFinite(Date.parse(value)))
  return null;
 return new Date(value).toISOString();
};
export function p3GoogleResult(payload,url){
 const result=payload?.inspectionResult;
 const index=result?.indexStatusResult;
 if(!index||typeof index!=="object"||Array.isArray(index))
  throw new Error("p3_gsc_invalid_data");
 const verdict=["PASS","FAIL","NEUTRAL"].includes(index.verdict)?
  index.verdict:"UNKNOWN";
 const userCanonical=safeCanonical(index.userCanonical);
 const googleCanonical=safeCanonical(index.googleCanonical);
 const sitemaps=Array.isArray(index.sitemap)?index.sitemap:[];
 return {
  source:"google_url_inspection_indexed_version",
  verdict,
  indexed:verdict==="PASS"?true:verdict==="FAIL"?false:null,
  coverage:safeText(index.coverageState,180),
  robotsTxtState:safeText(index.robotsTxtState,75),
  indexingState:safeText(index.indexingState,75),
  fetchState:safeText(index.pageFetchState,75),
  lastCrawlTime:validCrawlTime(index.lastCrawlTime),
  userCanonical,googleCanonical,
  userCanonicalMatches:userCanonical===null?null:userCanonical===url,
  googleCanonicalMatches:googleCanonical===null?null:googleCanonical===url,
  sitemapReferenced:sitemaps.some(s=>typeof s==="string"&&s.startsWith(P3_CANONICAL+"/sitemap")),
  inspectionLink:googleLink(result.inspectionResultLink)
 };
}
async function jsonBounded(response,limit){
 const data=await response.text();
 if(data.length>limit)throw new Error("p3_invalid_data");
 try{return JSON.parse(data);}catch{throw new Error("p3_invalid_data");}
}
export async function p3InspectGoogle(key,accessToken,site,{fetchImpl=fetch}={}){
 const target=p3Target(key);
 if(!target||!ALLOWED_PROPERTIES.has(site)||
   typeof accessToken!=="string"||accessToken.length<20||
   accessToken.length>5000||!/^[A-Za-z0-9._~+\/=-]+$/.test(accessToken))
  throw new Error("p3_invalid_request");
 let response;
 try{response=await fetchImpl(GOOGLE_INSPECTION,{
  method:"POST",cache:"no-store",redirect:"error",
  headers:{Authorization:"Bearer "+accessToken,"Content-Type":"application/json",Accept:"application/json"},
  body:JSON.stringify({inspectionUrl:target.url,siteUrl:site}),
  signal:AbortSignal.timeout(9500)
 });}catch{throw new Error("p3_gsc_unavailable");}
 if(response.status===401||response.status===403)throw new Error("p3_gsc_permission_denied");
 if(response.status===429)throw new Error("p3_gsc_rate_limited");
 if(response.status!==200||!response.headers.get("content-type")?.includes("application/json"))
  throw new Error("p3_gsc_unavailable");
 return p3GoogleResult(await jsonBounded(response,120000),target.url);
}
const dateFromDay=(date,days)=>dPlus(date,-days+1);
export function p3PerformanceResult(data,dates){
 if(!data||typeof data!=="object"||
   (data.rows!==undefined&&!Array.isArray(data.rows)))throw new Error("p3_gsc_invalid_data");
 const rows=data.rows||[];
 if(rows.length>40)throw new Error("p3_gsc_invalid_data");
 const seen=new Set(),days=[];
 for(const row of rows){
  const date=row?.keys?.[0];
  const clicks=row?.clicks,impressions=row?.impressions;
  if(typeof date!=="string"||!DATE_RE.test(date)||date<dates.startDate||
    date>dates.endDate||seen.has(date)||
    typeof clicks!=="number"||typeof impressions!=="number"||
    !Number.isSafeInteger(clicks)||!Number.isSafeInteger(impressions)||
    clicks<0||impressions<0||clicks>impressions)
   throw new Error("p3_gsc_invalid_data");
  seen.add(date);
  days.push({date,clicks,impressions});
 }
 return {
  source:"google_search_analytics_finalized",
  startDate:dates.startDate,endDate:dates.endDate,
  windows:P3_MILESTONES.map(period=>{
   const start=dateFromDay(dates.endDate,period);
   const subset=days.filter(day=>day.date>=start);
   return {days:period,clicks:subset.reduce((sum,day)=>sum+day.clicks,0),
    impressions:subset.reduce((sum,day)=>sum+day.impressions,0)};
  })
 };
}
export async function p3InspectPerformance(key,accessToken,site,{
 fetchImpl=fetch,now=new Date()
}={}){
 const target=p3Target(key);
 if(!target||!ALLOWED_PROPERTIES.has(site)||
   typeof accessToken!=="string"||accessToken.length<20||
   accessToken.length>5000)throw new Error("p3_invalid_request");
 const dates=gscDates("30d",now);
 const query={...dates,type:"web",dataState:"final",dimensions:["date"],rowLimit:35,
  dimensionFilterGroups:[{filters:[{dimension:"page",operator:"equals",expression:target.url}]}]};
 let response;
 try{response=await fetchImpl(GSC_QUERY+encodeURIComponent(site)+"/searchAnalytics/query",{
  method:"POST",cache:"no-store",redirect:"error",
  headers:{Authorization:"Bearer "+accessToken,"Content-Type":"application/json",Accept:"application/json"},
  body:JSON.stringify(query),signal:AbortSignal.timeout(9500)
 });}catch{throw new Error("p3_gsc_unavailable");}
 if(response.status===401||response.status===403)throw new Error("p3_gsc_permission_denied");
 if(response.status===429)throw new Error("p3_gsc_rate_limited");
 if(response.status!==200||!response.headers.get("content-type")?.includes("application/json"))
  throw new Error("p3_gsc_unavailable");
 return p3PerformanceResult(await jsonBounded(response,110000),dates);
}
const attr=(tag,name)=>{
 const match=tag.match(new RegExp("(?:^|\\s)"+name+"\\s*=\\s*([\"'])(.*?)\\1","i"));
 return match?match[2]:null;
};
export function p3TechnicalHtml(html,url,headers=new Headers()){
 // Next.js may stream generateMetadata into the BODY for non-bot clients.
 // Inspect all actual metadata tags in the bounded HTML, not only the head.
 const markup=typeof html==="string"?html:"";
 const links=markup.match(/<link\b[^>]*>/gi)||[];
 const metas=markup.match(/<meta\b[^>]*>/gi)||[];
 const link=links.find(tag=>(attr(tag,"rel")||"").toLowerCase().split(/\s+/).includes("canonical"));
 const canonical=safeCanonical(link?attr(link,"href"):null);
 const robots=metas.filter(tag=>["robots","googlebot"].includes((attr(tag,"name")||"").toLowerCase()))
  .map(tag=>(attr(tag,"content")||"").toLowerCase());
 const noindex=robots.some(x=>/\bnoindex\b/.test(x))||/\bnoindex\b/i.test(headers.get("x-robots-tag")||"");
 return {canonical,canonicalMatches:canonical===null?null:canonical===url,noindex};
}
const readBounded=async(response,limit)=>{
 const size=Number(response.headers.get("content-length")||0);
 if(size>limit)throw new Error("p3_large_response");
 const body=await response.text();
 if(body.length>limit)throw new Error("p3_large_response");
 return body;
};
export async function p3InspectLive(key,{fetchImpl=fetch}={}){
 const target=p3Target(key);
 if(!target)throw new Error("p3_invalid_request");
 const http={status:null,canonical:null,canonicalMatches:null,noindex:null};
 const sitemap={status:"unavailable",included:null};
 const [pageRes,mapRes]=await Promise.allSettled([
  fetchImpl(target.url,{method:"GET",redirect:"manual",cache:"no-store",
   headers:{Accept:"text/html"},signal:AbortSignal.timeout(7000)}),
  fetchImpl(P3_CANONICAL+"/sitemap.xml",{method:"GET",redirect:"manual",cache:"no-store",
   headers:{Accept:"application/xml,text/xml"},signal:AbortSignal.timeout(7000)})
 ]);
 if(pageRes.status==="fulfilled"){
  const response=pageRes.value;http.status=response.status;
  try{
   if(response.status===200&&response.headers.get("content-type")?.includes("text/html")){
    const html=await readBounded(response,480000);
    Object.assign(http,p3TechnicalHtml(html,target.url,response.headers));
   }else await response.body?.cancel();
  }catch{http.canonical=null;http.canonicalMatches=null;http.noindex=null;}
 }
 if(mapRes.status==="fulfilled"){
  const response=mapRes.value;
  try{
   if(response.status===200&&/(?:xml)/i.test(response.headers.get("content-type")||"")){
    const xml=await readBounded(response,2500000);
    // Only complete <loc> elements count, not mentions in metadata/HTML.
    const locs=[...xml.matchAll(/<loc>([^<]{1,350})<\/loc>/g)]
     .map(x=>x[1].replace(/&amp;/g,"&"));
    sitemap.status="ready";
    sitemap.included=locs.includes(target.url);
   }else{
    sitemap.status="unavailable";
    await response.body?.cancel();
   }
  }catch{sitemap.status="unavailable";}
 }
 return {http,sitemap,ready:http.status===200&&http.canonicalMatches===true&&
  http.noindex===false&&sitemap.included===true};
}
