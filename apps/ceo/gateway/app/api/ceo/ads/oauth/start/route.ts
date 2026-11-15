import {requireOwner} from "@/lib/owner-gate";
import {allowedOrigin} from "@/lib/ceo-push-policy.mjs";
import {adsOAuthConfig,adsAuthorize} from "@/lib/ceo-ads-oauth.mjs";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",
 "X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
export async function POST(request:Request){
 if(!allowedOrigin(request))return fail(403,"forbidden_origin");
 const owner=await requireOwner(request);
 if(owner.status!==200||owner.role!=="owner"||!owner.subject)return fail(403,"owner_required");
 try{
  const config=adsOAuthConfig();
  if(config.status!=="ready")return fail(503,"ads_not_configured");
  return Response.json({data:{authorizationUrl:adsAuthorize(config,owner.subject)}},{headers});
 }catch{return fail(503,"ads_not_configured");}
}
