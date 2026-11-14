import {requireOwner} from "@/lib/owner-gate";
import {oauthConfig,verifyCallback,exchangeGoogleCode,hasGoogleProperty} from "@/lib/ceo-gsc-oauth.mjs";
import {saveGscGrant} from "@/lib/ceo-gsc-store";
import {requireOwner} from "@/lib/owner-gate";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:noStore});

const LANDING="https://ceo.fbmn.vn/ceo/index.html?tab=4&gsc=";
const clear="fbmn_gsc_oauth=; Path=/api/ceo/gsc/oauth/callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
function finish(reason:string){
 return new Response(null,{status:303,headers:{...noStore,Location:LANDING+reason,
  "Set-Cookie":clear}});
}
function cookieValue(header:string|null){
 const value=header?.split(";").map(s=>s.trim()).find(s=>s.startsWith("fbmn_gsc_oauth="));
 return value?.slice("fbmn_gsc_oauth=".length)||"";
}
// Google redirect does not carry a bearer token; verify the Owner's existing
// same-origin Better Auth cookie, then bind state to the same Owner subject.
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
 const owner=await requireOwner(request);
 if(owner.status!==200||!owner.subject)return finish("login");
 const expected=verifyCallback(config,{
  code:url.searchParams.get("code"),state:url.searchParams.get("state")
 },cookieValue(request.headers.get("cookie")),owner.subject);
 if(!expected)return finish("invalid");
 try{
  const grant=await exchangeGoogleCode(config,expected.code,expected.verifier);
  if(!await hasGoogleProperty(config,grant.accessToken))return finish("permission");
  await saveGscGrant(owner.subject,grant.refreshToken,config.key);
  return finish("connected");
 }catch{return finish("error");}
}
