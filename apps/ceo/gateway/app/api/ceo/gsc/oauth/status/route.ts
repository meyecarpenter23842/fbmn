import {allowedOrigin} from "@/lib/ceo-push-policy.mjs";
import {oauthConfig,revokeGoogleToken} from "@/lib/ceo-gsc-oauth.mjs";
import {readGscGrant,deleteGscGrant} from "@/lib/ceo-gsc-store";
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
  const token=await readGscGrant(owner!.subject!,config.key);
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
  const token=await readGscGrant(owner!.subject!,config.key);
  await deleteGscGrant(owner!.subject!);
  if(token)await revokeGoogleToken(token);
  return Response.json({data:{status:"disconnected"}},{headers:noStore});
 }catch{return fail(503,"gsc_oauth_store_unavailable");}
}
