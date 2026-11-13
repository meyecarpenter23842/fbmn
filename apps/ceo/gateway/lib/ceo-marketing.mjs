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
   " FROM ("+session+") WHERE match(campaign,'^fbmn-[a-z0-9-]{1,48}$')"+
   " GROUP BY campaign,label ORDER BY leadSessions DESC,sessions DESC LIMIT 10"
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
  if(campaigns&&(!CAMPAIGN.test(campaign)||/\d{7,}/.test(campaign)))
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
export function formatMarketing(sources,campaigns){
 return {channels:validate(sources),campaigns:validate(campaigns,true)};
}
