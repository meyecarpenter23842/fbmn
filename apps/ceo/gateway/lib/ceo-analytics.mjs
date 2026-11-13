// DL12B: fixed, aggregate-only reporting contract. Never accept SQL from the browser.
export const PERIOD_DAYS=Object.freeze({"7d":7,"30d":30,"90d":90});
const names=["visits","pageViews","productViews","catalogueViews","pdfDownloads","chatOpens","contacts","outsourcing"];
export function queriesFor(period){
 const days=PERIOD_DAYS[period];
 if(!days)throw new Error("invalid_period");
 const time="timestamp >= now() - INTERVAL "+days+" DAY AND properties.app = 'futurebook_website'";
 const base=" FROM events WHERE "+time;
 const summary="SELECT "+
  ["web_session_start","web_page_view","web_product_view","web_catalogue_view",
   "web_pdf_download_served","web_chat_open","web_contact_submit_success","web_outsourcing_submit_success"]
   .map((event,i)=>"countIf(event = '"+event+"') AS "+names[i]).join(", ")+base;
 const daily="SELECT toDate(timestamp) AS day, countIf(event = 'web_session_start') AS visits, "+
  "countIf(event = 'web_page_view') AS pageViews, "+
  "uniqIf(distinct_id, event = 'web_session_start' AND properties.traffic_channel = 'google_organic') AS organicSessions, "+
  "uniqIf(distinct_id, event IN ('web_contact_submit_success','web_outsourcing_submit_success') AND properties.traffic_channel = 'google_organic') AS organicLeadSessions"+base+
  " AND event IN ('web_session_start','web_page_view','web_contact_submit_success','web_outsourcing_submit_success') "+
  " GROUP BY day ORDER BY day ASC LIMIT 95";
 const sources="SELECT toString(properties.traffic_source) AS label, count() AS total"+base+
  " AND event = 'web_session_start' GROUP BY label ORDER BY total DESC LIMIT 10";
 const products="SELECT toString(properties.product_key) AS label, count() AS total"+base+
  " AND event = 'web_product_view' GROUP BY label ORDER BY total DESC LIMIT 10";
 const categories="SELECT toString(properties.category_key) AS label, count() AS total"+base+
  " AND event = 'web_category_view' GROUP BY label ORDER BY total DESC LIMIT 10";
 // Distinct session counts, never users: no PII, personal IDs or raw search queries.
 // New SEO attribution begins with SEO05 web traffic_channel; old events are unclassified.
 const organic="properties.traffic_channel = 'google_organic'";
 const seoSummary="SELECT "+
  "uniqIf(distinct_id,event = 'web_session_start' AND "+organic+") AS organicSessions, "+
  "uniqIf(distinct_id,event = 'web_product_view' AND "+organic+") AS organicProductSessions, "+
  "uniqIf(distinct_id,event = 'web_contact_submit_success' AND "+organic+") AS organicContactSessions, "+
  "uniqIf(distinct_id,event = 'web_outsourcing_submit_success' AND "+organic+") AS organicOutsourcingSessions, "+
  "uniqIf(distinct_id,event IN ('web_contact_submit_success','web_outsourcing_submit_success') AND "+organic+") AS organicLeadSessions, "+
  "uniqIf(distinct_id,event = 'web_session_start' AND properties.traffic_channel = 'google_paid') AS googlePaidSessions, "+
  "uniqIf(distinct_id,event = 'web_session_start' AND properties.traffic_channel = 'google_unclassified') AS googleUnclassifiedSessions, "+
  "countIf(event = 'web_lead_cta_click' AND "+organic+") AS organicCtaClicks"+base+
  " AND event IN ('web_session_start','web_product_view','web_contact_submit_success','web_outsourcing_submit_success','web_lead_cta_click')";
 const seoPages="SELECT toString(properties.page_key) AS label, count() AS total"+base+
  " AND event = 'web_page_view' AND "+organic+
  " AND notEmpty(toString(properties.page_key)) GROUP BY label ORDER BY total DESC LIMIT 10";
 // PH01: ordered in-session (30-minute inactivity ID) steps within 24 hours.
 // One row per anonymous website session, not per person or form submission.
 // Preserve subsecond order; HogQL windowFunnel needs an unsigned millisecond timestamp.
 const funnel="SELECT countIf(funnel_stage >= 1) AS viewedSessions, "+
  "countIf(funnel_stage >= 2) AS ctaSessions, "+
  "countIf(funnel_stage >= 3) AS submittedSessions "+
  "FROM (SELECT distinct_id, windowFunnel(86400000)(accurateCast(toUnixTimestamp64Milli(timestamp), 'UInt64'), "+
   "event = 'web_product_view', event = 'web_lead_cta_click', "+
   "event IN ('web_contact_submit_success','web_outsourcing_submit_success')) AS funnel_stage"+
   base+" AND event IN ('web_product_view','web_lead_cta_click',"+
   "'web_contact_submit_success','web_outsourcing_submit_success')"+
   " AND startsWith(distinct_id, 'fbmn-web-session-') GROUP BY distinct_id)";
 return {summary,daily,sources,products,categories,seoSummary,seoPages,funnel};
}
const count=x=>{const n=Number(x);if(!Number.isSafeInteger(n)||n<0)throw new Error("invalid_count");return n;};
function rows(x){
 if(!x||!Array.isArray(x.results)||x.results.length>100)return [];
 if(x.results.some(row=>!Array.isArray(row)))throw new Error("invalid_rows");
 return x.results;
}
function pairs(input,limit){
 return rows(input).slice(0,limit).map(row=>{
  const label=String(row[0]??"").slice(0,120).trim();
  return {label:label||"khác",count:count(row[1])};
 }).filter(item=>item.label!=="null"&&item.label!=="undefined");
}
// Defense-in-depth for labels returned from the analytics provider.
function safeSeoPage(value){
 return ["/","/san-pham","/catalogue","/lien-he","/gia-cong","/dai-ly"].includes(value);
}
export function formatStatistics(period,input){
 if(!PERIOD_DAYS[period])throw new Error("invalid_period");
 const totals=rows(input.summary);
 if(totals.length!==1||totals[0].length<names.length)throw new Error("invalid_summary");
 const metrics=Object.fromEntries(names.map((name,i)=>[name,count(totals[0][i])]));
 const seoRows=rows(input.seoSummary);
 if(seoRows.length!==1||seoRows[0].length!==8)throw new Error("invalid_seo_summary");
 const keys=["organicSessions","organicProductSessions","organicContactSessions",
  "organicOutsourcingSessions","organicLeadSessions","googlePaidSessions",
  "googleUnclassifiedSessions","organicCtaClicks"];
 const seo=Object.fromEntries(keys.map((key,i)=>[key,count(seoRows[0][i])]));
 // Reject missing/invalid funnel data rather than silently reporting zero conversions.
 const funnelRows=rows(input.funnel);
 if(funnelRows.length!==1||funnelRows[0].length!==3)throw Error("invalid_funnel");
 const [viewedSessions,ctaSessions,submittedSessions]=funnelRows[0].map(count);
 if(viewedSessions<ctaSessions||ctaSessions<submittedSessions)throw Error("invalid_funnel_order");
 const funnel={viewedSessions,ctaSessions,submittedSessions};
 const daily=rows(input.daily).map(row=>{
  const day=String(row[0]??"");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||row.length!==5)throw new Error("invalid_date");
  return {day,visits:count(row[1]),pageViews:count(row[2]),
   organicSessions:count(row[3]),organicLeadSessions:count(row[4])};
 });
 return {period,timezone:"UTC",generatedAt:typeof input.summary.last_refresh==="string"?input.summary.last_refresh:"",
  cached:input.summary.is_cached===true,metrics,daily,
  sources:pairs(input.sources,10),products:pairs(input.products,10),categories:pairs(input.categories,10),
  seo,seoPages:pairs(input.seoPages,10).filter(item=>safeSeoPage(item.label)),funnel};
}
