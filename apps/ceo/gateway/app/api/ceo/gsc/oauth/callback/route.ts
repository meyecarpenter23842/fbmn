import {oauthConfig,verifyCallback,exchangeGoogleCode,hasGoogleProperty} from "@/lib/ceo-gsc-oauth.mjs";
import {saveGscGrant} from "@/lib/ceo-gsc-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={
 "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
 "Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex"
};
const LANDING="https://ceo.fbmn.vn/ceo/index.html?tab=4&gsc=";
const clear="fbmn_gsc_oauth=; Path=/api/ceo/gsc/oauth/callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
function finish(reason:string){
 // Only internal fixed status codes reach the client; never echo OAuth code,
 // state, refresh/access token, Google response body, or session details.
 return new Response(null,{status:303,headers:{...noStore,Location:LANDING+reason,
  "Set-Cookie":clear}});
}
function cookieValue(header:string|null){
 const value=header?.split(";").map(s=>s.trim()).find(s=>s.startsWith("fbmn_gsc_oauth="));
 return value?.slice("fbmn_gsc_oauth=".length)||"";
}
// Owner is verified at /start using a short-lived bearer JWT, then sealed into
// the 10-minute HttpOnly state cookie with PKCE. A cross-site Google redirect
// does NOT supply that bearer JWT. Requiring auth.token() again here can fail
// if Better Auth's session cookie is not available at the callback URL.
// Trust only the AES-GCM authenticated and state-matching Owner identity sealed
// by /start; never accept an Owner subject from a query parameter.
export async function GET(request:Request){
 const url=new URL(request.url);
 if(url.origin!=="https://ceo.fbmn.vn")return finish("invalid");
 if(url.searchParams.get("error"))return finish("cancelled");
 if([...url.searchParams.keys()].some(k=>!["code","state","scope","authuser","prompt"].includes(k))||
    url.searchParams.getAll("state").length!==1||
    url.searchParams.getAll("code").length!==1||
    Number(request.headers.get("content-length")||0)>4096)return finish("invalid");
 let config;
 try{config=oauthConfig();}catch{return finish("config");}
 if(config.status!=="ready")return finish("config");
 const verified=verifyCallback(config,{
  code:url.searchParams.get("code"),state:url.searchParams.get("state")
 },cookieValue(request.headers.get("cookie")));
 if(!verified)return finish("invalid");
 let grant;
 try{
  grant=await exchangeGoogleCode(config,verified.code,verified.verifier);
 }catch{return finish("token");}
 let allowed;
 try{
  allowed=await hasGoogleProperty(config,grant.accessToken);
 }catch{return finish("google_api");}
 if(!allowed)return finish("permission");
 try{
  await saveGscGrant(verified.subject,grant.refreshToken,config.key);
 }catch{return finish("storage");}
 return finish("connected");
}
