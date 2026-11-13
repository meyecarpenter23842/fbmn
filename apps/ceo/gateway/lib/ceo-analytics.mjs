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
  "countIf(event = 'web_page_view') AS pageViews"+base+
  " AND event IN ('web_session_start','web_page_view') GROUP BY day ORDER BY day ASC LIMIT 95";
 const sources="SELECT toString(properties.traffic_source) AS label, count() AS total"+base+
  " AND event = 'web_session_start' GROUP BY label ORDER BY total DESC LIMIT 10";
 const products="SELECT toString(properties.product_key) AS label, count() AS total"+base+
  " AND event = 'web_product_view' GROUP BY label ORDER BY total DESC LIMIT 10";
 const categories="SELECT toString(properties.category_key) AS label, count() AS total"+base+
  " AND event = 'web_category_view' GROUP BY label ORDER BY total DESC LIMIT 10";
 return {summary,daily,sources,products,categories};
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
export function formatStatistics(period,input){
 if(!PERIOD_DAYS[period])throw new Error("invalid_period");
 const totals=rows(input.summary);
 if(totals.length!==1||totals[0].length<names.length)throw new Error("invalid_summary");
 const metrics=Object.fromEntries(names.map((name,i)=>[name,count(totals[0][i])]));
 const daily=rows(input.daily).map(row=>{
  const day=String(row[0]??"");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error("invalid_date");
  return {day,visits:count(row[1]),pageViews:count(row[2])};
 });
 return {period,timezone:"UTC",generatedAt:typeof input.summary.last_refresh==="string"?input.summary.last_refresh:"",
  cached:input.summary.is_cached===true,metrics,daily,
  sources:pairs(input.sources,10),products:pairs(input.products,10),categories:pairs(input.categories,10)};
}
