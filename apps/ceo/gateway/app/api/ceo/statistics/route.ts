import {requireOwner} from "@/lib/owner-gate";
import {PERIOD_DAYS,queriesFor,formatStatistics} from "@/lib/ceo-analytics.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:HEADERS});
const endpoint="https://us.posthog.com/api/projects/732495/query/";

async function runQuery(key:string,sql:string):Promise<{results:unknown[][]}>{
 const response=await fetch(endpoint,{
  method:"POST",redirect:"manual",cache:"no-store",
  headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json","Accept":"application/json"},
  body:JSON.stringify({query:{kind:"HogQLQuery",query:sql}}),
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
 return value as {results:unknown[][]};
}
export async function GET(request:Request){
 const url=new URL(request.url);
 if([...url.searchParams.keys()].some(k=>k!=="period")||url.searchParams.getAll("period").length>1)
  return fail(400,"invalid_query");
 const period=url.searchParams.get("period")||"7d";
 if(!Object.prototype.hasOwnProperty.call(PERIOD_DAYS,period))return fail(400,"invalid_period");
 const owner=await requireOwner(request);
 if(owner.status!==200||!owner.subject)return fail(owner.status,"owner_required");
 const key=process.env.FBMN_CEO_POSTHOG_PERSONAL_API_KEY||"";
 if(!/^phx_[A-Za-z0-9_-]{20,200}$/.test(key))return fail(503,"statistics_not_configured");
 try{
  const requests=queriesFor(period);
  // Only five bounded aggregate queries; no event exports, PII or user-supplied SQL.
  const [summary,daily,sources,products,categories]=await Promise.all(
   [requests.summary,requests.daily,requests.sources,requests.products,requests.categories]
    .map(query=>runQuery(key,query)));
  const data=formatStatistics(period,{summary,daily,sources,products,categories});
  return Response.json({data},{status:200,headers:HEADERS});
 }catch(error){
  const message=error instanceof Error?error.message:"";
  if(message==="posthog_key_denied")return fail(503,"statistics_permission_denied");
  if(message==="posthog_rate_limit")return fail(503,"statistics_rate_limited");
  return fail(503,"statistics_unavailable");
 }
}
