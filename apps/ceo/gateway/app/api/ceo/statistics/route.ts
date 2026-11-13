import {requireOwner} from "@/lib/owner-gate";
import {attachCatalogNames} from "@/lib/ceo-catalog-labels.mjs";
import {PERIOD_DAYS,queriesFor,formatStatistics} from "@/lib/ceo-analytics.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:HEADERS});
const endpoint="https://us.posthog.com/api/projects/732495/query/";

async function runQuery(key:string,sql:string,force:boolean,name:string):Promise<{results:unknown[][];is_cached?:boolean;last_refresh?:string}>{
 const response=await fetch(endpoint,{
  method:"POST",redirect:"manual",cache:"no-store",
  headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json","Accept":"application/json"},
  body:JSON.stringify({query:{kind:"HogQLQuery",query:sql},
   refresh:force?"force_blocking":"blocking",name:"fbmn_ceo_"+name}),
  signal:AbortSignal.timeout(12000)
 });
 if(response.status===401||response.status===403)throw new Error("posthog_key_denied");
 if(response.status===429)throw new Error("posthog_rate_limit");
 if(response.status!==200||!response.headers.get("content-type")?.includes("application/json"))
  throw new Error("posthog_unavailable");
 const raw=await response.text();
 if(raw.length>150000)throw new Error("posthog_oversized");
 const value:unknown=JSON.parse(raw);
 if(!value||typeof value!=="object"||!("results" in value)||
  !Array.isArray((value as {results:unknown}).results))throw new Error("posthog_invalid_data");
 return value as {results:unknown[][];is_cached?:boolean;last_refresh?:string};
}
export async function GET(request:Request){
 const url=new URL(request.url);
 if([...url.searchParams.keys()].some(k=>k!=="period"&&k!=="fresh")||
  url.searchParams.getAll("period").length>1||url.searchParams.getAll("fresh").length>1)
  return fail(400,"invalid_query");
 const period=url.searchParams.get("period")||"7d";
 if(!Object.prototype.hasOwnProperty.call(PERIOD_DAYS,period))return fail(400,"invalid_period");
 const freshValue=url.searchParams.get("fresh");
 if(freshValue!==null&&freshValue!=="1")return fail(400,"invalid_refresh");
 const force=freshValue==="1";
 const owner=await requireOwner(request);
 if(owner.status!==200||!owner.subject)return fail(owner.status,"owner_required");
 const key=process.env.FBMN_CEO_POSTHOG_PERSONAL_API_KEY||"";
 if(!/^phx_[A-Za-z0-9_-]{20,200}$/.test(key))return fail(503,"statistics_not_configured");
 try{
  const requests=queriesFor(period);
  // Eight bounded read-only aggregate queries, batches max three per PostHog project.
  // No raw events, visitor IDs, PII or browser-supplied SQL leave the gateway.
  const named=Object.entries(requests);
  const responses:Record<string,{results:unknown[][];is_cached?:boolean;last_refresh?:string}>={};
  for(let index=0;index<named.length;index+=3){
   const batch=named.slice(index,index+3);
   const results=await Promise.all(batch.map(([name,sql])=>runQuery(key,sql,force,name)));
   batch.forEach(([name],i)=>{responses[name]=results[i];});
  }
  const data=formatStatistics(period,responses);
  // Map historical PostHog keys through the same published-only catalogue as the Website.
  // If Public Worker is unavailable, retain original events/counts and flag the labels.
  let enriched={...data,labelsUnavailable:true};
  try{enriched=await attachCatalogNames(data,process.env.FBMN_CEO_PUBLIC_API_BASE_URL||"");}
  catch{/* Do not conceal genuine analytics while catalogue naming is unavailable. */}
  return Response.json({data:enriched},{status:200,headers:HEADERS});
 }catch(error){
  const message=error instanceof Error?error.message:"";
  if(message==="posthog_key_denied")return fail(503,"statistics_permission_denied");
  if(message==="posthog_rate_limit")return fail(503,"statistics_rate_limited");
  return fail(503,"statistics_unavailable");
 }
}
