import {allowedOrigin} from "@/lib/ceo-push-policy.mjs";
import {oauthConfig,verifyCompletionTicket,exchangeGoogleCode,hasGoogleProperty} from "@/lib/ceo-gsc-oauth.mjs";
import {saveGscGrant} from "@/lib/ceo-gsc-store";
import {requireOwner} from "@/lib/owner-gate";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex"};
const result=(status:number,reason:string)=>Response.json({status:reason},{status,headers:noStore});

// Google callback only renders a confirmation screen. Persistence requires
// fresh Owner JWT proof from the initiating CEO session and a sealed ticket
// with the same Owner subject. A stolen Google auth URL alone cannot save.
export async function POST(request:Request){
 if(!allowedOrigin(request))return result(403,"invalid");
 const owner=await requireOwner(request);
 if(owner.status!==200||!owner.subject)return result(owner.status===403?403:401,"login");
 if(Number(request.headers.get("content-length")||0)>6000)return result(400,"invalid");
 let body;
 try{body=await request.json();}catch{return result(400,"invalid");}
 if(!body||typeof body!=="object"||Array.isArray(body)||
    Object.keys(body).length!==1||typeof body.ticket!=="string")return result(400,"invalid");
 let config;
 try{config=oauthConfig();}catch{return result(503,"config");}
 if(config.status!=="ready")return result(503,"config");
 const verified=verifyCompletionTicket(config,body.ticket,owner.subject);
 if(!verified)return result(400,"invalid");
 let grant;
 try{grant=await exchangeGoogleCode(config,verified.code,verified.verifier);}
 catch{return result(502,"token");}
 let allowed;
 try{allowed=await hasGoogleProperty(config,grant.accessToken);}
 catch{return result(502,"google_api");}
 if(!allowed)return result(403,"permission");
 try{await saveGscGrant(owner.subject,grant.refreshToken,config.key);}
 catch{return result(503,"storage");}
 return result(200,"connected");
}
