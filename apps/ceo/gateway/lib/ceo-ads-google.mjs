// Read-only Google Ads v26 data; all GAQL clauses are hardcoded/validated.
import {ADS_PERIODS,moneyFromMicros,reportingDates,googleReportRows,
 safeGeos,safeKeywords,validCustomer} from "./ceo-ads-policy.mjs";
const ROOT="https://googleads.googleapis.com/v26";
const dataCache=new Map();
function boundedCache(key,ttl,run){
 const item=dataCache.get(key);
 if(item&&item.until>Date.now())return Promise.resolve(item.value);
 return run().then(value=>{
  if(dataCache.size>80)dataCache.clear();
  dataCache.set(key,{until:Date.now()+ttl,value});
  return value;
 });
}
async function adsRequest(path,token,loginCustomerId,body=null,fetchImpl=fetch){
 const headers={"Authorization":"Bearer "+token,"Accept":"application/json"};
 if(body!==null)headers["Content-Type"]="application/json";
 if(loginCustomerId)headers["login-customer-id"]=loginCustomerId;
 // Since 9 Sep 2026 developer-token is deprecated; optional legacy header only.
 if(process.env.FBMN_CEO_ADS_LEGACY_DEVELOPER_TOKEN)
  headers["developer-token"]=process.env.FBMN_CEO_ADS_LEGACY_DEVELOPER_TOKEN;
 let r;
 try{r=await fetchImpl(ROOT+path,{
  method:body===null?"GET":"POST",redirect:"error",cache:"no-store",headers,
  ...(body===null?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(12000)
 });}catch{throw new Error("ads_google_unavailable");}
 if(r.status===401)throw new Error("ads_grant_expired");
 if(r.status===403)throw new Error("ads_permission_denied");
 if(r.status===429)throw new Error("ads_quota");
 if(r.status!==200)throw new Error("ads_google_unavailable");
 const raw=await r.text();
 if(raw.length>350000)throw new Error("ads_response_too_large");
 try{return JSON.parse(raw);}catch{throw new Error("ads_google_unavailable");}
}
export async function adsAccessibleCustomers(token,fetchImpl=fetch){
 const j=await adsRequest("/customers:listAccessibleCustomers",token,null,null,fetchImpl);
 return (Array.isArray(j.resourceNames)?j.resourceNames:[])
  .filter(s=>typeof s==="string"&&/^customers\/[0-9]{10}$/.test(s))
  .map(s=>s.slice(10)).slice(0,50);
}
async function adsSearch(customer,token,login,query,fetchImpl=fetch){
 if(!validCustomer(customer))throw new Error("ads_invalid_customer");
 const j=await adsRequest("/customers/"+customer+"/googleAds:search",token,login,{query},fetchImpl);
 if(j.nextPageToken)throw new Error("ads_result_limit");
 return Array.isArray(j.results)?j.results:[];
}
export async function adsCustomerInfo(customer,token,login,fetchImpl=fetch){
 const rows=await adsSearch(customer,token,login,
  "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer LIMIT 1",fetchImpl);
 const c=rows[0]?.customer;
 if(String(c?.id)!==customer||typeof c.currencyCode!=="string"||
  typeof c.timeZone!=="string")throw new Error("ads_customer_unavailable");
 return {id:customer,name:String(c.descriptiveName||customer).slice(0,120),
  currency:c.currencyCode,timeZone:c.timeZone};
}
export async function adsGeoSuggestions(token,login,names,fetchImpl=fetch){
 if(!Array.isArray(names)||names.length<1||names.length>10||
  names.some(s=>typeof s!=="string"||s.length<2||s.length>80))throw new Error("ads_invalid_geos");
 const j=await adsRequest("/geoTargetConstants:suggest",token,login,
  {locale:"vi",countryCode:"VN",locationNames:{names}},fetchImpl);
 return (Array.isArray(j.geoTargetConstantSuggestions)?j.geoTargetConstantSuggestions:[])
  .map(s=>s.geoTargetConstant)
  .filter(g=>g&&g.countryCode==="VN"&&g.status==="ENABLED"&&
   /^geoTargetConstants\/[1-9][0-9]+$/.test(String(g.resourceName)))
  .map(g=>({resourceName:g.resourceName,name:g.name,canonicalName:g.canonicalName,
   type:g.targetType})).slice(0,60);
}
export async function adsKeywordsHistorical(customer,token,login,words,geos,fetchImpl=fetch){
 const keywords=safeKeywords(words),targets=safeGeos(geos);
 if(!validCustomer(customer)||!keywords||!targets)throw new Error("ads_invalid_keywords");
 const key=customer+"|"+keywords.join("|")+"|"+targets.join("|");
 return boundedCache(key,3600000,async()=>{
  const j=await adsRequest("/customers/"+customer+":generateKeywordHistoricalMetrics",token,login,{
   keywords,geoTargetConstants:targets,language:"languageConstants/1040",
   keywordPlanNetwork:"GOOGLE_SEARCH",
   historicalMetricsOptions:{includeAverageCpc:true}
  },fetchImpl);
  return {source:"google_ads",kind:"historical_estimate",language:"vi",
   geos:targets,network:"GOOGLE_SEARCH",retrievedAt:new Date().toISOString(),
   items:(Array.isArray(j.results)?j.results:[]).slice(0,100).map(r=>{
    const m=r.keywordMetrics||{};
    return {keyword:r.text,averageMonthlySearches:m.avgMonthlySearches??null,
     competition:m.competition??null,competitionIndex:m.competitionIndex??null,
     monthlyVolumes:Array.isArray(m.monthlySearchVolumes)?m.monthlySearchVolumes:[],
     lowTopOfPageBid:moneyFromMicros(m.lowTopOfPageBidMicros),
     highTopOfPageBid:moneyFromMicros(m.highTopOfPageBidMicros),
     estimatedAverageCpc:moneyFromMicros(m.averageCpcMicros)}
   })}
 });
}
export async function adsKeywordIdeas(customer,token,login,words,geos,fetchImpl=fetch){
 const keywords=safeKeywords(words),targets=safeGeos(geos);
 if(!validCustomer(customer)||!keywords||!targets)throw new Error("ads_invalid_keywords");
 const key="ideas|"+customer+"|"+keywords.join("|")+"|"+targets.join("|");
 return boundedCache(key,3600000,async()=>{
  const j=await adsRequest("/customers/"+customer+":generateKeywordIdeas",token,login,{
   keywordSeed:{keywords},geoTargetConstants:targets,language:"languageConstants/1040",
   keywordPlanNetwork:"GOOGLE_SEARCH",pageSize:60,
   historicalMetricsOptions:{includeAverageCpc:true}
  },fetchImpl);
  return {source:"google_ads",kind:"keyword_ideas",geos:targets,language:"vi",
   retrievedAt:new Date().toISOString(),
   items:(Array.isArray(j.results)?j.results:[]).slice(0,60).map(r=>{
    const m=r.keywordIdeaMetrics||{};
    return {keyword:r.text,averageMonthlySearches:m.avgMonthlySearches??null,
     competition:m.competition??null,competitionIndex:m.competitionIndex??null,
     lowTopOfPageBid:moneyFromMicros(m.lowTopOfPageBidMicros),
     highTopOfPageBid:moneyFromMicros(m.highTopOfPageBidMicros),
     estimatedAverageCpc:moneyFromMicros(m.averageCpcMicros)}
   })}
 });
}
export async function adsCampaigns(customer,token,login,fetchImpl=fetch){
 const rows=await adsSearch(customer,token,login,
  "SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign_budget.amount_micros, campaign_budget.resource_name, campaign_budget.explicitly_shared FROM campaign ORDER BY campaign.id DESC LIMIT 100",fetchImpl);
 return rows.map(x=>({id:String(x.campaign?.id||""),
  name:String(x.campaign?.name||""),status:String(x.campaign?.status||""),
  type:String(x.campaign?.advertisingChannelType||""),
  dailyBudget:moneyFromMicros(x.campaignBudget?.amountMicros),
  budgetResource:String(x.campaignBudget?.resourceName||""),
  explicitlyShared:x.campaignBudget?.explicitlyShared===true}));
}
export async function adsPerformance(customer,token,login,period,timezone,fetchImpl=fetch){
 if(!ADS_PERIODS[period])throw new Error("ads_invalid_period");
 let localDay;
 try{localDay=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",
  day:"2-digit"}).format(new Date());}catch{throw new Error("ads_invalid_timezone");}
 const dates=reportingDates(period,localDay);
 const query=(from,to)=>
  "SELECT segments.date, metrics.clicks, metrics.impressions, metrics.cost_micros "+
  "FROM customer WHERE segments.date BETWEEN '"+from+"' AND '"+to+"' ORDER BY segments.date";
 const [current,previous,campaigns]=await Promise.all([
  adsSearch(customer,token,login,query(dates.from,dates.to),fetchImpl),
  adsSearch(customer,token,login,query(dates.previousFrom,dates.previousTo),fetchImpl),
  adsSearch(customer,token,login,
   "SELECT campaign.id, campaign.name, metrics.clicks, metrics.impressions, metrics.cost_micros "+
   "FROM campaign WHERE segments.date BETWEEN '"+dates.from+"' AND '"+dates.to+
   "' ORDER BY metrics.cost_micros DESC LIMIT 50",fetchImpl)
 ]);
 const now=googleReportRows(current),before=googleReportRows(previous);
 if(!now||!before)throw new Error("ads_metrics_invalid");
 const topCampaigns=campaigns.map(row=>{
  const m=row.metrics||{},cost=moneyFromMicros(m.costMicros);
  if(cost===null||!/^[0-9]+$/.test(String(m.clicks))||
   !/^[0-9]+$/.test(String(m.impressions)))throw new Error("ads_metrics_invalid");
  const clicks=Number(m.clicks),impressions=Number(m.impressions);
  return {id:String(row.campaign?.id||""),name:String(row.campaign?.name||""),
   clicks,impressions,cost,ctr:impressions?clicks/impressions:null,
   cpc:clicks?cost/clicks:null};
 });
 return {source:"google_ads",period,timezone,dates,
  metrics:now.totals,previous:before.totals,daily:now.daily,topCampaigns,
  attribution:"not_joined",cpl:null};
}

export async function adsMutate(customer,token,login,operations,validateOnly,fetchImpl=fetch){
 if(!validCustomer(customer)||!Array.isArray(operations)||operations.length<1||
  operations.length>80||typeof validateOnly!=="boolean")throw new Error("ads_invalid_mutation");
 const json=await adsRequest("/customers/"+customer+"/googleAds:mutate",token,login,{
  mutateOperations:operations,partialFailure:false,validateOnly,
  responseContentType:"RESOURCE_NAME"
 },fetchImpl);
 if(json.partialFailureError)throw new Error("ads_mutation_rejected");
 return json;
}
