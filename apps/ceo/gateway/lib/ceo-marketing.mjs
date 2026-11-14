// PH02: fixed session aggregates. Never forward raw session IDs or form data to CEO.
export function marketingQueries(days){
 if(![7,30,90].includes(days))throw Error("invalid_period");
 const base=" FROM events WHERE timestamp >= now() - INTERVAL "+days+
  " DAY AND properties.app = 'futurebook_website'";
 const session="SELECT distinct_id,"+
  " argMinIf(toString(properties.traffic_source),timestamp,event='web_session_start') AS source,"+
  " argMinIf(toString(properties.traffic_channel),timestamp,event='web_session_start') AS channel,"+
  " argMinIf(toString(properties.utm_campaign),timestamp,event='web_session_start') AS campaign,"+
  " countIf(event='web_session_start') AS starts,"+
  " countIf(event='web_product_view') AS products,"+
  " countIf(event='web_lead_cta_click') AS ctas,"+
  " countIf(event='web_contact_submit_success') AS contacts,"+
  " countIf(event='web_outsourcing_submit_success') AS outsourcing"+
  base+" AND event IN ('web_session_start','web_product_view','web_lead_cta_click',"+
  "'web_contact_submit_success','web_outsourcing_submit_success')"+
  " AND startsWith(distinct_id,'fbmn-web-session-') GROUP BY distinct_id HAVING starts>0";
 // PH03: previous cohort is determined by when a session *started*, not by
 // the date of its last event. Allow events after the boundary for the same ID.
 const previousBase=" FROM events WHERE timestamp >= now() - INTERVAL "+(days*2)+
  " DAY AND properties.app = 'futurebook_website'";
 const previousSession=session.replace(base,previousBase).replace(
  "HAVING starts>0",
  "HAVING starts>0 AND minIf(timestamp,event='web_session_start') < now() - INTERVAL "+days+" DAY");
 const dailySession=session.replace("SELECT distinct_id,",
  "SELECT distinct_id, minIf(timestamp,event='web_session_start') AS startedAt,");
 const channel="multiIf(source='google' AND channel='google_organic','google_organic',"+
  "source='google' AND channel='google_paid','google_paid',"+
  "source='google','google_unclassified',source='facebook','facebook',"+
  "source='zalo','zalo',source='direct','direct',source='referral','referral','other')";
 const counts="count() AS sessions,countIf(products>0) AS productSessions,"+
  "countIf(ctas>0) AS ctaSessions,countIf(contacts>0 OR outsourcing>0) AS leadSessions";
 return {
  marketingSources:"SELECT "+channel+" AS label,"+counts+
   ",countIf(contacts>0) AS contactSessions,countIf(outsourcing>0) AS outsourcingSessions"+
   " FROM ("+session+") GROUP BY label ORDER BY sessions DESC LIMIT 8",
  marketingCampaigns:"SELECT campaign,"+channel+" AS label,"+counts+
   " FROM ("+session+") WHERE match(campaign,'^fbmn-[a-z0-9-]{1,48}$') AND NOT match(campaign,'[0-9]{9,}')"+
   " GROUP BY campaign,label ORDER BY leadSessions DESC,sessions DESC LIMIT 10",
  marketingPreviousSources:"SELECT "+channel+" AS label,"+counts+
   ",countIf(contacts>0) AS contactSessions,countIf(outsourcing>0) AS outsourcingSessions"+
   " FROM ("+previousSession+") GROUP BY label ORDER BY sessions DESC LIMIT 8",
  marketingDaily:"SELECT toDate(startedAt) AS day,"+channel+" AS label,"+
   "count() AS sessions,countIf(contacts>0 OR outsourcing>0) AS leadSessions"+
   " FROM ("+dailySession+") GROUP BY day,label ORDER BY day,label LIMIT 750"
 };
}
const CHANNELS=new Set(["direct","google_organic","google_paid","google_unclassified",
 "facebook","zalo","referral","other"]);
const CAMPAIGN=/^fbmn-[a-z0-9-]{1,48}$/;
function validate(response,campaigns=false){
 if(!response||!Array.isArray(response.results))throw Error("invalid_marketing_results");
 const list=response.results;
 if(list.length>(campaigns?10:8))throw Error("invalid_marketing_limit");
 const seen=new Set();
 return list.map(row=>{
  if(!Array.isArray(row)||row.length!==(campaigns?6:7))throw Error("invalid_marketing_row");
  const channel=String(row[campaigns?1:0]??"");
  if(!CHANNELS.has(channel))throw Error("invalid_marketing_channel");
  const campaign=campaigns?String(row[0]??""):"";
  if(campaigns&&(!CAMPAIGN.test(campaign)||/\d{9,}/.test(campaign)))
   throw Error("invalid_marketing_campaign");
  const numbers=row.slice(campaigns?2:1).map(v=>{
   const n=Number(v);if(!Number.isSafeInteger(n)||n<0)throw Error("invalid_marketing_number");
   return n;
  });
  const [sessions,productSessions,ctaSessions,leadSessions]=numbers;
  if(!sessions||productSessions>sessions||ctaSessions>sessions||leadSessions>sessions||
   (!campaigns&&(numbers[4]>leadSessions||numbers[5]>leadSessions)))
    throw Error("invalid_marketing_counts");
  const key=campaigns?campaign+":"+channel:channel;
  if(seen.has(key))throw Error("invalid_marketing_duplicate");
  seen.add(key);
  return {...(campaigns?{campaign}:{}),channel,sessions,productSessions,ctaSessions,leadSessions,
   ...(campaigns?{}:{contactSessions:numbers[4],outsourcingSessions:numbers[5]})};
 });
}
// Aggregate by first-touch channel/day. Return no session identifiers or raw event properties.
function validateDaily(response){
 if(!response||!Array.isArray(response.results)||response.results.length>750)
  throw Error("invalid_marketing_daily");
 const seen=new Set();
 return response.results.map(row=>{
  if(!Array.isArray(row)||row.length!==4)throw Error("invalid_marketing_daily_row");
  const [day,channel]=row;
  if(typeof day!=="string"||!/^\\d{4}-\\d{2}-\\d{2}$/.test(day)||
   !CHANNELS.has(channel))throw Error("invalid_marketing_daily_label");
  const sessions=Number(row[2]),leadSessions=Number(row[3]);
  if(!Number.isSafeInteger(sessions)||sessions<1||
   !Number.isSafeInteger(leadSessions)||leadSessions<0||leadSessions>sessions)
   throw Error("invalid_marketing_daily_counts");
  const key=day+":"+channel;
  if(seen.has(key))throw Error("invalid_marketing_daily_duplicate");
  seen.add(key);
  return {day,channel,sessions,leadSessions};
 });
}
export function formatMarketing(sources,campaigns,previous,daily){
 return {channels:validate(sources),campaigns:validate(campaigns,true),
  previousChannels:validate(previous),daily:validateDaily(daily)};
}
