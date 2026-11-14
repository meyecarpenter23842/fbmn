import {allowedOrigin} from "@/lib/ceo-push-policy.mjs";
import {authorizationRequest,oauthConfig} from "@/lib/ceo-gsc-oauth.mjs";
import {requireOwner} from "@/lib/owner-gate";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:noStore});

// Owner-only mutation, same-origin. OAuth state is AES-GCM sealed for 10 min;
// no browser cookie is required across the Google consent redirect.
export async function POST(request:Request){
 if(!allowedOrigin(request))return fail(403,"forbidden_origin");
 const owner=await requireOwner(request);
 if(owner.status!==200||!owner.subject)return fail(owner.status,"owner_required");
 let config;
 try{config=oauthConfig();}catch{return fail(503,"gsc_oauth_config_invalid");}
 if(config.status!=="ready")return fail(503,"gsc_oauth_not_configured");
 const {authorizationUrl}=authorizationRequest(config,owner.subject);
 return Response.json({data:{authorizationUrl}},{headers:noStore});
}
