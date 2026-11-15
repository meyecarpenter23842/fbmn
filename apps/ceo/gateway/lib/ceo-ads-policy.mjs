// ADS01–ADS03: pure validation and unit conversion; no browser-authored GAQL.
export const ADS_PERIODS=Object.freeze({"7d":7,"30d":30,"90d":90});
export const CUSTOMER=/^[0-9]{10}$/;
export const GEO=/^geoTargetConstants\/[1-9][0-9]{0,12}$/;
export function validCustomer(id){return typeof id==="string"&&CUSTOMER.test(id);}
export function safeKeywords(value){
 if(!Array.isArray(value)||value.length<1||value.length>20)return null;
 const entries=value.map(x=>typeof x==="string"?x.trim().replace(/\s+/g," "):"");
 if(entries.some(x=>x.length<2||x.length>80||/[\x00-\x1f<>]/.test(x)))return null;
 return [...new Set(entries)].slice(0,20);
}
export function safeGeos(value){
 if(!Array.isArray(value)||value.length<1||value.length>10||
  value.some(x=>typeof x!=="string"||!GEO.test(x)))return null;
 return [...new Set(value)];
}
export function moneyFromMicros(value){
 if(value===null||value===undefined||value==="")return null;
 if(!/^[0-9]{1,20}$/.test(String(value)))return null;
 const micros=BigInt(String(value));
 if(micros>BigInt(Number.MAX_SAFE_INTEGER)*1000000n)return null;
 const whole=micros/1000000n,part=micros%1000000n;
 return Number(whole)+Number(part)/1000000;
}
export function validLandingUrl(value){
 if(typeof value!=="string"||value.length>2048)return false;
 try{
  const u=new URL(value);
  if(u.protocol!=="https:"||u.host!=="www.fbmn.vn"||u.username||u.password||
   u.search||u.hash||u.port||u.pathname.startsWith("//"))return false;
  return !/(^|\/)(?:api|admin|ceo|private|net|gia-net|pricing|login)(?:\/|$)/i.test(
   decodeURIComponent(u.pathname));
 }catch{return false;}
}
function safeAdLines(value,min,max,maxLength){
 if(!Array.isArray(value)||value.length<min||value.length>max)return null;
 const items=value.map(v=>typeof v==="string"?v.trim():"");
 if(items.some(s=>s.length<3||s.length>maxLength||/[\x00-\x1f<>]/.test(s)))return null;
 return new Set(items).size===items.length?items:null;
}
export function validateDraft(value){
 if(!value||typeof value!=="object"||Array.isArray(value)||
  typeof value.name!=="string"||value.name.trim().length<3||
  value.name.length>100||!["keyword_set","campaign"].includes(value.kind))return null;
 const keywords=safeKeywords(value.keywords);
 if(!keywords)return null;
 if(value.kind==="keyword_set")return {
  kind:"keyword_set",name:value.name.trim(),keywords,
  geos:safeGeos(value.geos)||[],language:"vi",network:"GOOGLE_SEARCH"
 };
 if(!validLandingUrl(value.landingUrl)||typeof value.budgetDaily!=="number"||
  !Number.isFinite(value.budgetDaily)||value.budgetDaily<=0||value.budgetDaily>100000000||
  !["EXACT","PHRASE","BROAD"].includes(value.matchType))return null;
 const negative=Array.isArray(value.negativeKeywords)?
  value.negativeKeywords.length===0?[]:safeKeywords(value.negativeKeywords):null;
 const headlines=safeAdLines(value.headlines,3,8,30);
 const descriptions=safeAdLines(value.descriptions,2,4,90);
 if(negative===null||!safeGeos(value.geos)||!headlines||!descriptions)return null;
 return {kind:"campaign",name:value.name.trim(),keywords,
  negativeKeywords:negative,geos:safeGeos(value.geos),
  matchType:value.matchType,headlines,descriptions,landingUrl:value.landingUrl,
  budgetDaily:value.budgetDaily,currency:null,status:"DRAFT_PAUSED"};
}
export function reportingDates(period,localToday){
 const count=ADS_PERIODS[period];
 if(!count||typeof localToday!=="string"||
  !/^\d{4}-\d{2}-\d{2}$/.test(localToday))return null;
 const start=new Date(localToday+"T00:00:00Z");
 if(!Number.isFinite(start.valueOf())||start.toISOString().slice(0,10)!==localToday)return null;
 const at=n=>new Date(start.getTime()+n*86400000).toISOString().slice(0,10);
 return {from:at(-count),to:at(-1),previousFrom:at(-count*2),previousTo:at(-count-1)};
}
export function googleReportRows(rows){
 if(!Array.isArray(rows))return null;
 const daily=[];
 for(const row of rows){
  const d=row?.segments?.date,m=row?.metrics;
  if(typeof d!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(d)||
   !m||!/^\d+$/.test(String(m.clicks))||!/^\d+$/.test(String(m.impressions)))return null;
  const cost=moneyFromMicros(m.costMicros);
  if(cost===null)return null;
  daily.push({date:d,clicks:Number(m.clicks),impressions:Number(m.impressions),cost});
 }
 const totals=daily.reduce((v,d)=>({clicks:v.clicks+d.clicks,
  impressions:v.impressions+d.impressions,cost:v.cost+d.cost}),{clicks:0,impressions:0,cost:0});
 return {daily,totals:{...totals,ctr:totals.impressions?totals.clicks/totals.impressions:null,
  cpc:totals.clicks?totals.cost/totals.clicks:null}};
}
