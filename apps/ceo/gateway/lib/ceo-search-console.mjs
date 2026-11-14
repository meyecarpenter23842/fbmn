import {createSign} from "node:crypto";

// SEO06: read-only Google Search Console reporting for canonical public Futurebook pages.
// Never include Google credentials, visitor identities, or raw API errors in responses.
export const GSC_PERIODS=Object.freeze({"7d":7,"30d":30,"90d":90});
const CANONICAL_ORIGIN="https://www.fbmn.vn";
const PROPERTIES=new Set(["https://www.fbmn.vn/","sc-domain:fbmn.vn"]);
const SCOPE="https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_ENDPOINT="https://oauth2.googleapis.com/token";
const TIME_ZONE="America/Los_Angeles";
const ONE_DAY=86400000;
const TERM=/^[\p{L}\p{M}\p{N}\s._\-]{1,80}$/u;
const PUBLIC_PATH=/^\/(?:$|san-pham(?:\/[a-z0-9-]{1,85})?\/?$|danh-muc(?:\/[a-z0-9-]{1,85})?\/?$|catalogue\/?$|lien-he\/?$|dai-ly\/?$|gia-cong\/?$|tin-tuc(?:\/[a-z0-9-]{1,85})?\/?$|bai-viet(?:\/[a-z0-9-]{1,85})?\/?$)/;

export function gscDates(period,now=new Date()){
 const days=GSC_PERIODS[period];
 if(!days||!Number.isFinite(now?.getTime?.()))throw new Error("gsc_invalid_period");
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
 const value=(part)=>Number(parts.find(x=>x.type===part)?.value);
 const localDay=Date.UTC(value("year"),value("month")-1,value("day"));
 const end=new Date(localDay-3*ONE_DAY); // only finalized daily GSC data, never incomplete today
 const start=new Date(end.getTime()-(days-1)*ONE_DAY);
 return {startDate:start.toISOString().slice(0,10),endDate:end.toISOString().slice(0,10)};
}

export function readGscConfig(env=process.env){
 const site=String(env.FBMN_CEO_GSC_SITE_URL||"").trim();
 const encoded=String(env.FBMN_CEO_GSC_SERVICE_ACCOUNT_JSON||"").trim();
 if(!site&&!encoded)return {status:"unconfigured"};
 if(!site||!encoded)throw new Error("gsc_config_invalid");
 if(!PROPERTIES.has(site))throw new Error("gsc_property_invalid");
 if(encoded.length>16000)throw new Error("gsc_config_invalid");
 let raw;
 try{raw=JSON.parse(encoded);}catch{throw new Error("gsc_config_invalid");}
 if(!raw||raw.type!=="service_account"||
    typeof raw.client_email!=="string"||
    !/^[a-z0-9.-]{1,150}@[a-z0-9.-]+\.iam\.gserviceaccount\.com$/.test(raw.client_email)||
    typeof raw.private_key!=="string"||
    !raw.private_key.startsWith("-----BEGIN PRIVATE KEY-----")||
    !raw.private_key.includes("-----END PRIVATE KEY-----")||
    raw.private_key.length>12000)throw new Error("gsc_config_invalid");
 return {status:"ready",site,clientEmail:raw.client_email,privateKey:raw.private_key};
}
function assertMetric(value,name,min=0,max=Number.MAX_SAFE_INTEGER){
 const n=Number(value);
 if(!Number.isFinite(n)||n<min||n>max)throw new Error("gsc_invalid_"+name);
 return n;
}
function rowMetrics(row){
 if(!row||typeof row!=="object")throw new Error("gsc_invalid_row");
 return {
  clicks:assertMetric(row.clicks,"clicks",0,1000000000),
  impressions:assertMetric(row.impressions,"impressions",0,10000000000),
  ctr:assertMetric(row.ctr,"ctr",0,1),
  position:assertMetric(row.position,"position",0,10000)
 };
}
function rowsOf(response,max,requireKeys=false){
 if(!response||typeof response!=="object"||
   (response.rows!==undefined&&!Array.isArray(response.rows)))throw new Error("gsc_invalid_data");
 const rows=response.rows||[];
 if(rows.length>max||rows.some(row=>!row||typeof row!=="object"||
   (requireKeys&&!Array.isArray(row.keys))||
   (row.keys!==undefined&&!Array.isArray(row.keys))))
  throw new Error("gsc_invalid_data");
 return rows;
}
function safeQuery(value){
 if(typeof value!=="string"||!TERM.test(value)||
   /\d{7,}/.test(value)||/\d{9,}/.test(value.replace(/[\s.()\-]/g,""))||
   /(?:https?|www|password|token):/i.test(value)||value.trim()!==value)return null;
 return value;
}
function safePage(value){
 if(typeof value!=="string"||value.length>280)return null;
 try{
  const url=new URL(value);
  const knownHost=url.hostname==="www.fbmn.vn"||url.hostname==="fbmn.vn";
  if(!knownHost||!["http:","https:"].includes(url.protocol)||
     url.port||url.username||url.password||url.search||url.hash||
     !PUBLIC_PATH.test(url.pathname)||/\d{7,}/.test(url.pathname)||
     /\d{9,}/.test(url.pathname.replace(/[-_.]/g,"")))return null;
  // Domain-property includes apex, www and older HTTP pages.
  // Safely distinguish noncanonical public URLs without exposing query strings.
  if(url.origin===CANONICAL_ORIGIN)return url.pathname;
  return (url.protocol==="http:"?"http://":"")+url.hostname+url.pathname;
 }catch{return null;}
}
export function formatGscReport(period,dates,results,property="sc-domain:fbmn.vn"){
 if(!PROPERTIES.has(property))throw new Error("gsc_property_invalid");
 if(!GSC_PERIODS[period])throw new Error("gsc_invalid_period");
 const totals=rowsOf(results.overview,1);
 const daily=rowsOf(results.daily,95,true);
 const queries=rowsOf(results.queries,60,true);
 const pages=rowsOf(results.pages,50,true);
 const datePattern=/^\d{4}-\d{2}-\d{2}$/;
 const dailyItems=daily.map(row=>{
  const day=row.keys[0];
  if(typeof day!=="string"||!datePattern.test(day)||
     day<dates.startDate||day>dates.endDate)throw new Error("gsc_invalid_date");
  return {date:day,...rowMetrics(row)};
 });
 if(new Set(dailyItems.map(x=>x.date)).size!==dailyItems.length)
  throw new Error("gsc_duplicate_date");
 dailyItems.sort((a,b)=>a.date.localeCompare(b.date));
 const pick=(list,clean)=>{
  const seen=new Set();
  return list.map(row=>{
   const label=clean(row.keys[0]);
   if(!label||seen.has(label))return null;
   seen.add(label);
   return {label,...rowMetrics(row)};
  }).filter(Boolean).slice(0,10);
 };
 return {
  status:"ready",source:"google_search_console",period,
  site:property==="sc-domain:fbmn.vn"?"fbmn.vn":"www.fbmn.vn",
  timezone:"America/Los_Angeles",startDate:dates.startDate,endDate:dates.endDate,
  metrics:totals.length?rowMetrics(totals[0]):null,
  daily:dailyItems,queries:pick(queries,safeQuery),pages:pick(pages,safePage)
 };
}
const base64=(value)=>Buffer.from(JSON.stringify(value)).toString("base64url");
function serviceAccountAssertion(config,now=new Date()){
 const epoch=Math.floor(now.getTime()/1000);
 const header=base64({alg:"RS256",typ:"JWT"});
 const payload=base64({iss:config.clientEmail,scope:SCOPE,aud:TOKEN_ENDPOINT,iat:epoch,exp:epoch+3600});
 const input=header+"."+payload;
 try{
  const signature=createSign("RSA-SHA256").update(input).end().sign(config.privateKey).toString("base64url");
  return input+"."+signature;
 }catch{throw new Error("gsc_config_invalid");}
}
async function readJson(response,limit){
 const data=await response.text();
 if(data.length>limit)throw new Error("gsc_invalid_data");
 try{return JSON.parse(data);}catch{throw new Error("gsc_invalid_data");}
}
async function getToken(config,fetchImpl,now){
 let response;
 try{
  response=await fetchImpl(TOKEN_ENDPOINT,{
   method:"POST",cache:"no-store",redirect:"error",
   headers:{"Content-Type":"application/x-www-form-urlencoded","Accept":"application/json"},
   body:new URLSearchParams({
    grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion:serviceAccountAssertion(config,now)
   }).toString(),
   signal:AbortSignal.timeout(7000)
  });
 }catch{throw new Error("gsc_auth_unavailable");}
 if(response.status!==200)throw new Error("gsc_auth_denied");
 const payload=await readJson(response,5000);
 if(typeof payload?.access_token!=="string"||payload.access_token.length<20||
    payload.access_token.length>5000||!/^[-._~+/=a-zA-Z0-9]+$/.test(payload.access_token))
  throw new Error("gsc_auth_denied");
 return payload.access_token;
}
async function gscQuery(fetchImpl,accessToken,site,dates,dimensions,rowLimit){
 const url="https://www.googleapis.com/webmasters/v3/sites/"+encodeURIComponent(site)+"/searchAnalytics/query";
 // Query every page in this allowlisted Search Console property.
 // A canonical-www filter here hides valid apex/historic traffic from KPIs.
 // The output page labels are separately sanitized against FBMN public paths.
 const query={...dates,dimensions,rowLimit,type:"web",dataState:"final"};
 let response;
 try{
  response=await fetchImpl(url,{
   method:"POST",redirect:"error",cache:"no-store",
   headers:{Authorization:"Bearer "+accessToken,"Content-Type":"application/json","Accept":"application/json"},
   body:JSON.stringify(query),signal:AbortSignal.timeout(10000)
  });
 }catch{throw new Error("gsc_unavailable");}
 if(response.status===401||response.status===403)throw new Error("gsc_permission_denied");
 if(response.status===429)throw new Error("gsc_rate_limited");
 if(response.status!==200||!response.headers.get("content-type")?.includes("application/json"))
  throw new Error("gsc_unavailable");
 return readJson(response,140000);
}
export async function fetchGscReport(period,{
 env=process.env,fetchImpl=fetch,now=new Date(),
 accessToken=/** @type {string|null} */ (null),site=/** @type {string|null} */ (null)
}={}){
 const dates=gscDates(period,now);
 // OAuth authorization-code flow supplies a short-lived access token server-side.
 // The legacy service-account flow remains only for existing regression tests.
 // Never accept OAuth accessToken/site from a browser-supplied parameter.
 let token,property;
 if(accessToken!==null){
  if(typeof accessToken!=="string"||accessToken.length<20||accessToken.length>5000||
    !/^[-._~+/=a-zA-Z0-9]+$/.test(accessToken)||!PROPERTIES.has(site))
    throw new Error("gsc_oauth_invalid_access");
  token=accessToken;property=site;
 }else{
  const config=readGscConfig(env);
  if(config.status==="unconfigured")return {
   status:"unconfigured",source:"google_search_console",period,
   site:"www.fbmn.vn",timezone:TIME_ZONE,...dates,
   metrics:null,daily:[],queries:[],pages:[]
  };
  token=await getToken(config,fetchImpl,now);property=config.site;
 }
 const [overview,daily,queries,pages]=await Promise.all([
  gscQuery(fetchImpl,token,property,dates,[],1),
  gscQuery(fetchImpl,token,property,dates,["date"],95),
  gscQuery(fetchImpl,token,property,dates,["query"],60),
  gscQuery(fetchImpl,token,property,dates,["page"],50)
 ]);
 return formatGscReport(period,dates,{overview,daily,queries,pages},property);
}
