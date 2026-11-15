import {requireOwner} from "@/lib/owner-gate";
import {adsOAuthConfig,adsRefresh} from "@/lib/ceo-ads-oauth.mjs";
import {adsGeoSuggestions,adsKeywordsHistorical,
 adsKeywordIdeas,adsCampaigns,adsPerformance} from "@/lib/ceo-ads-google.mjs";
import {safeGeos,safeKeywords,ADS_PERIODS} from "@/lib/ceo-ads-policy.mjs";
import {readAdsConnection,readCompanyAdsConnection,rotateAdsGrant} from "@/lib/ceo-ads-store";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",
 "X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
export async function GET(request:Request){
 const gate=await requireOwner(request);
 if(gate.status!==200||!gate.subject)return fail(gate.status,"unauthorized");
 const url=new URL(request.url);
 if(url.search.length>2500||[...url.searchParams.keys()].some(x=>
  !["view","words","geos","names","period"].includes(x)||
  url.searchParams.getAll(x).length!==1))return fail(400,"invalid_query");
 const view=url.searchParams.get("view")||"campaigns";
 if(!["geo","historical","ideas","campaigns","performance"].includes(view))
  return fail(400,"invalid_view");
 const p=url.searchParams.get("period")||"7d";
 if(view==="performance"&&!ADS_PERIODS[p])return fail(400,"invalid_period");
 const words=url.searchParams.get("words")?.split("|")||[];
 const geos=url.searchParams.get("geos")?.split("|")||[];
 const names=url.searchParams.get("names")?.split("|")||[];
 if(["historical","ideas"].includes(view)&&(!safeKeywords(words)||!safeGeos(geos)))
  return fail(400,"invalid_keyword_query");
 if(view==="geo"&&(names.length<1||names.length>10||
  names.some(s=>s.length<2||s.length>80)))return fail(400,"invalid_location_query");
 try{
  const config=adsOAuthConfig();
  if(config.status!=="ready")return Response.json({data:{status:"unconfigured"}},{headers});
  const grant=gate.role==="owner"?
   await readAdsConnection(gate.subject,config.key):await readCompanyAdsConnection(config.key);
  if(!grant)return Response.json({data:{status:"disconnected"}},{headers});
  if(!grant.customerId)return Response.json({data:{status:"select_customer"}},{headers});
  const token=await adsRefresh(config,grant.refreshToken);
  if(token.rotated)await rotateAdsGrant(grant.subject,token.rotated,config.key);
  const login=grant.loginCustomerId;
  let data:unknown;
  if(view==="geo")data=await adsGeoSuggestions(token.accessToken,login,names);
  if(view==="historical")data=await adsKeywordsHistorical(grant.customerId,token.accessToken,login,words,geos);
  if(view==="ideas")data=await adsKeywordIdeas(grant.customerId,token.accessToken,login,words,geos);
  if(view==="campaigns")data=await adsCampaigns(grant.customerId,token.accessToken,login);
  if(view==="performance")data=await adsPerformance(grant.customerId,token.accessToken,login,p,grant.timeZone||"Asia/Ho_Chi_Minh");
  return Response.json({data:{status:"ready",customerId:grant.customerId,
   currency:grant.currency,timeZone:grant.timeZone,view,result:data}},{headers});
 }catch(error){
  const reason=error instanceof Error?error.message:"";
  if(reason==="ads_grant_expired")return fail(409,"ads_reconnect_required");
  if(reason==="ads_permission_denied")return fail(403,"ads_permission_denied");
  if(reason==="ads_quota")return fail(429,"ads_quota");
  return fail(503,"ads_unavailable");
 }
}
