import {oauthConfig,verifyCallbackTransaction,exchangeGoogleCode,hasGoogleProperty} from "@/lib/ceo-gsc-oauth.mjs";
import {saveGscGrant} from "@/lib/ceo-gsc-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};

const LANDING="https://ceo.fbmn.vn/ceo/index.html?tab=4&gsc=";
const clear="fbmn_gsc_oauth=; Path=/api/ceo/gsc/oauth/callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
type Outcome="connected"|"cancelled"|"invalid"|"config"|"state"|"permission"|"google"|"storage"|"error";
function finish(reason:Outcome){
 // Only enum-like diagnostic reason; never log code, state, cookies, tokens or email.
 if(reason!=="connected")console.warn("GSC_OAUTH_CALLBACK_REJECTED",reason);
 return new Response(null,{status:303,headers:{...noStore,Location:LANDING+reason,
  "Set-Cookie":clear}});
}
function cookieValue(header:string|null){
 const value=header?.split(";").map(s=>s.trim()).find(s=>s.startsWith("fbmn_gsc_oauth="));
 return value?.slice("fbmn_gsc_oauth=".length)||"";
}
// /oauth/start already validated the Owner's signed JWT and sealed that Owner
// subject, PKCE verifier and state in an authenticated HttpOnly cookie.
// Google's top-level redirect carries no Flutter bearer JWT; authorize this
// callback solely with the short-lived owner-bound sealed OAuth transaction.
export async function GET(request:Request){
 const url=new URL(request.url);
 if(url.origin!=="https://ceo.fbmn.vn"||
    url.searchParams.get("error"))return finish("cancelled");
 if([...url.searchParams.keys()].some(k=>!["code","state","scope","authuser","prompt"].includes(k))||
    url.searchParams.getAll("state").length!==1||
    url.searchParams.getAll("code").length!==1||
    Number(request.headers.get("content-length")||0)>4096)return finish("invalid");
 let config;
 try{config=oauthConfig();}catch{return finish("config");}
 if(config.status!=="ready")return finish("config");
 const transaction=verifyCallbackTransaction(config,{
  code:url.searchParams.get("code"),state:url.searchParams.get("state")
 },cookieValue(request.headers.get("cookie")));
 if(!transaction)return finish("state");
 let grant;
 try{
  grant=await exchangeGoogleCode(config,transaction.code,transaction.verifier);
 }catch{return finish("google");}
 try{
  if(!await hasGoogleProperty(config,grant.accessToken))return finish("permission");
 }catch{return finish("permission");}
 try{
  await saveGscGrant(transaction.subject,grant.refreshToken,config.key);
  return finish("connected");
 }catch{return finish("storage");}
}
