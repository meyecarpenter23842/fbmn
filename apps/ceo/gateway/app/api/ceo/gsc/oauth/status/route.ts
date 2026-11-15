import {allowedOrigin} from "@/lib/ceo-push-policy.mjs";
import {oauthConfig,revokeGoogleToken} from "@/lib/ceo-gsc-oauth.mjs";
import {readGscGrant,readCompanyGscGrant,deleteGscGrant} from "@/lib/ceo-gsc-store";
import {requireOwner} from "@/lib/owner-gate";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:noStore});

async function ownerAndConfig(request:Request){
 const owner=await requireOwner(request);
 if(owner.status!==200||!owner.subject)return {error:fail(owner.status,"owner_required")};
 let config;
 try{config=oauthConfig();}catch{return {error:fail(503,"gsc_oauth_config_invalid")};}
 return {owner,config};
}
export async function GET(request:Request){
 const info=await ownerAndConfig(request);
 if(info.error)return info.error;
 const {config,owner}=info;
 if(config.status!=="ready")return Response.json({data:{status:"unconfigured"}},{headers:noStore});
 try{
  const token=owner!.role==="owner"?
   await readGscGrant(owner!.subject!,config.key):
   (await readCompanyGscGrant(config.key))?.refreshToken;
  return Response.json({data:{status:token?"connected":"disconnected"}},{headers:noStore});
 }catch{return fail(503,"gsc_oauth_store_unavailable");}
}
export async function DELETE(request:Request){
 if(!allowedOrigin(request))return fail(403,"forbidden_origin");
 const info=await ownerAndConfig(request);
 if(info.error)return info.error;
 const {config,owner}=info;
 if(config.status!=="ready")return fail(503,"gsc_oauth_not_configured");
 try{
  // Disconnect the same company OAuth grant that delegated SEO reports use.
  const grant=owner!.role==="owner"?
   {subject:owner!.subject!,refreshToken:await readGscGrant(owner!.subject!,config.key)}:
   await readCompanyGscGrant(config.key);
  if(grant){
   await deleteGscGrant(grant.subject);
   if(grant.refreshToken)await revokeGoogleToken(grant.refreshToken);
  }
  return Response.json({data:{status:"disconnected"}},{headers:noStore});
 }catch{return fail(503,"gsc_oauth_store_unavailable");}
}
