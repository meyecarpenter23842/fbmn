import {requireOwner} from "@/lib/owner-gate";
import {GSC_PERIODS,fetchGscReport} from "@/lib/ceo-search-console.mjs";
import {oauthConfig,refreshGoogleToken} from "@/lib/ceo-gsc-oauth.mjs";
import {readGscGrant,saveGscGrant} from "@/lib/ceo-gsc-store";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={
 "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
 "Referrer-Policy":"no-referrer"
};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:HEADERS});

// SEO06 has its own route so a Google outage never breaks PostHog/PH01/PH02.
export async function GET(request:Request){
 const url=new URL(request.url);
 if([...url.searchParams.keys()].some(x=>x!=="period"&&x!=="fresh")||
   url.searchParams.getAll("period").length>1||
   url.searchParams.getAll("fresh").length>1)return fail(400,"invalid_query");
 const period=url.searchParams.get("period")||"7d";
 if(!Object.prototype.hasOwnProperty.call(GSC_PERIODS,period))
  return fail(400,"invalid_period");
 const fresh=url.searchParams.get("fresh");
 if(fresh!==null&&fresh!=="1")return fail(400,"invalid_refresh");
 const owner=await requireOwner(request);
 if(owner.status!==200||!owner.subject)return fail(owner.status,"owner_required");
 try{
  const config=oauthConfig();
  if(config.status!=="ready"){
   return Response.json({data:{status:"unconfigured",source:"google_search_console",
    period,site:"www.fbmn.vn",oauthStatus:"unconfigured",
    metrics:null,daily:[],queries:[],pages:[]}},{headers:HEADERS});
  }
  const refresh=await readGscGrant(owner.subject,config.key);
  if(!refresh){
   return Response.json({data:{status:"unconfigured",source:"google_search_console",
    period,site:"www.fbmn.vn",oauthStatus:"disconnected",
    metrics:null,daily:[],queries:[],pages:[]}},{headers:HEADERS});
  }
  const {accessToken,rotated}=await refreshGoogleToken(config,refresh);
  if(rotated)await saveGscGrant(owner.subject,rotated,config.key);
  const data=await fetchGscReport(period,{accessToken,site:config.property,compare:true});
  return Response.json({data:{...data,oauthStatus:"connected"}},{status:200,headers:HEADERS});
 }catch(error){
  const message=error instanceof Error?error.message:"";
  if(message==="gsc_config_invalid"||message==="gsc_property_invalid")
   return fail(503,"gsc_configuration_invalid");
  if(message==="gsc_permission_denied"||message==="gsc_auth_denied")
   return fail(503,"gsc_permission_denied");
  if(message==="gsc_oauth_config_invalid")return fail(503,"gsc_oauth_config_invalid");
  if(message==="gsc_oauth_grant_invalid")return fail(409,"gsc_oauth_reconnect_required");
  if(message==="gsc_rate_limited")return fail(503,"gsc_rate_limited");
  return fail(503,"gsc_unavailable");
 }
}
