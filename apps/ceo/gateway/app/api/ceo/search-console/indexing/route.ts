import {requireOwner} from "@/lib/owner-gate";
import {oauthConfig,refreshGoogleToken} from "@/lib/ceo-gsc-oauth.mjs";
import {readGscGrant,readCompanyGscGrant,saveGscGrant} from "@/lib/ceo-gsc-store";
import {p3Watchlist,p3Target,p3InspectLive,p3InspectGoogle,p3InspectPerformance}
 from "@/lib/ceo-gsc-indexing.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
 "Referrer-Policy":"no-referrer"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:HEADERS});
const unavailableTechnical={http:{status:null,canonical:null,canonicalMatches:null,
 noindex:null},sitemap:{status:"unavailable",included:null},ready:false};
const googleError=(e:unknown)=>{
 const code=e instanceof Error?e.message:"";
 return code==="p3_gsc_rate_limited"?"rate_limited":
  code==="p3_gsc_permission_denied"?"permission_denied":
  code==="gsc_oauth_grant_invalid"?"reconnect_required":"unavailable";
};

// Read-only: each explicit request checks ONE allowlisted URL only. Never submit
// an indexing request, mutate GSC/sitemaps, or cache unverified outcomes.
export async function GET(request:Request){
 const url=new URL(request.url);
 const keys=[...url.searchParams.keys()];
 if(keys.some(key=>key!=="key")||url.searchParams.getAll("key").length>1)
  return fail(400,"invalid_query");
 const key=url.searchParams.get("key");
 if(key!==null&&!p3Target(key))return fail(400,"invalid_url");
 const session=await requireOwner(request);
 if(session.status!==200||!session.subject)return fail(session.status,"owner_required");
 if(key===null)return Response.json({data:p3Watchlist()},{headers:HEADERS});

 const target=p3Target(key)!;
 const livePromise=p3InspectLive(key).catch(()=>unavailableTechnical);
 let google:Record<string,unknown>={status:"disconnected"};
 let performance:Record<string,unknown>={status:"unavailable"};
 try{
  const config=oauthConfig();
  if(config.status!=="ready"){
   google={status:"unconfigured"};
   performance={status:"unconfigured"};
  }else{
   const grant=session.role==="owner"?
    {subject:session.subject,refreshToken:await readGscGrant(session.subject,config.key)}:
    await readCompanyGscGrant(config.key);
   if(grant?.refreshToken){
    const {accessToken,rotated}=await refreshGoogleToken(config,grant.refreshToken);
    if(rotated)await saveGscGrant(grant.subject,rotated,config.key);
    const [index,traffic]=await Promise.allSettled([
     p3InspectGoogle(key,accessToken,config.property),
     p3InspectPerformance(key,accessToken,config.property)
    ]);
    google=index.status==="fulfilled"?{status:"ready",...index.value}:
     {status:googleError(index.reason)};
    performance=traffic.status==="fulfilled"?{status:"ready",...traffic.value}:
     {status:googleError(traffic.reason)};
   }
  }
 }catch(error){
  google={status:googleError(error)};
  performance={status:googleError(error)};
 }
 const technical=await livePromise;
 return Response.json({data:{
  key:target.key,label:target.label,url:target.url,
  checkedAt:new Date().toISOString(),
  google,performance,technical
 }},{headers:HEADERS});
}
