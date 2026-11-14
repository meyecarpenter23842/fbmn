import {createCipheriv,createDecipheriv,createHash,randomBytes,timingSafeEqual} from "node:crypto";

export const GSC_SCOPE="https://www.googleapis.com/auth/webmasters.readonly";
export const GSC_CALLBACK="https://ceo.fbmn.vn/api/ceo/gsc/oauth/callback";
export const GSC_AUTH_URL="https://accounts.google.com/o/oauth2/v2/auth";
export const GSC_TOKEN_URL="https://oauth2.googleapis.com/token";
const PROPERTIES=new Set(["sc-domain:fbmn.vn","https://www.fbmn.vn/"]);
const CLIENT_ID=/^[0-9]{8,30}-[a-z0-9_-]{8,90}\.apps\.googleusercontent\.com$/;
const TOKEN=/^[A-Za-z0-9._~+/\-=]{20,5000}$/;
const STATE=/^[A-Za-z0-9_-]{32,80}$/;
const SEALED_STATE=/^v1\.[A-Za-z0-9_-]{40,5000}$/;
const CODE=/^[A-Za-z0-9/_\-.]{8,2048}$/;

/** @returns {{status:"unconfigured"} | {status:"ready",property:string,clientId:string,clientSecret:string,key:import("node:buffer").Buffer}} */
export function oauthConfig(env=process.env){
 const property=String(env.FBMN_CEO_GSC_SITE_URL||"").trim();
 const clientId=String(env.FBMN_CEO_GSC_OAUTH_CLIENT_ID||"").trim();
 const clientSecret=String(env.FBMN_CEO_GSC_OAUTH_CLIENT_SECRET||"").trim();
 const key=String(env.FBMN_CEO_GSC_OAUTH_ENCRYPTION_KEY||"").trim();
 if(!clientId&&!clientSecret&&!key)return {status:"unconfigured"};
 if(!PROPERTIES.has(property)||!CLIENT_ID.test(clientId)||
  clientSecret.length<16||clientSecret.length>256||
  !/^[a-f0-9]{64}$/i.test(key))throw new Error("gsc_oauth_config_invalid");
 return {status:"ready",property,clientId,clientSecret,key:Buffer.from(key,"hex")};
}
export function encryptSecret(plaintext,key){
 if(typeof plaintext!=="string"||plaintext.length>7000||plaintext.length<1)
  throw new Error("gsc_oauth_invalid_secret");
 const nonce=randomBytes(12);
 const cipher=createCipheriv("aes-256-gcm",key,nonce);
 const encrypted=Buffer.concat([cipher.update(plaintext,"utf8"),cipher.final()]);
 return "v1."+Buffer.concat([nonce,cipher.getAuthTag(),encrypted]).toString("base64url");
}
export function decryptSecret(sealed,key){
 if(typeof sealed!=="string"||sealed.length<32||sealed.length>15000||!sealed.startsWith("v1."))
  throw new Error("gsc_oauth_invalid_ciphertext");
 try{
  const b=Buffer.from(sealed.slice(3),"base64url");
  if(b.length<29)throw new Error("short");
  const decipher=createDecipheriv("aes-256-gcm",key,b.subarray(0,12));
  decipher.setAuthTag(b.subarray(12,28));
  return Buffer.concat([decipher.update(b.subarray(28)),decipher.final()]).toString("utf8");
 }catch{throw new Error("gsc_oauth_invalid_ciphertext");}
}
export function authorizationRequest(config,subject,now=Date.now()){
 if(config.status!=="ready"||typeof subject!=="string"||
  subject.length<1||subject.length>200)throw new Error("gsc_oauth_invalid_owner");
 const state=randomBytes(32).toString("base64url");
 const verifier=randomBytes(48).toString("base64url");
 const challenge=createHash("sha256").update(verifier).digest("base64url");
 const payload=JSON.stringify({state,verifier,subject,createdAt:now});
 // The Google round-trip must not depend on a browser cookie. A short-lived,
 // AEAD-sealed state carries the Owner-verified subject, nonce and PKCE verifier.
 // Google sees only opaque ciphertext. The authorization code remains one-use.
 const sealedState=encryptSecret(payload,config.key);
 const url=new URL(GSC_AUTH_URL);
 for(const [k,v] of Object.entries({
  client_id:config.clientId,redirect_uri:GSC_CALLBACK,response_type:"code",
  scope:GSC_SCOPE,state:sealedState,code_challenge:challenge,
  code_challenge_method:"S256",access_type:"offline",prompt:"consent"
 }))url.searchParams.set(k,v);
 return {authorizationUrl:url.toString()};
}
// A browser may drop cookies across Google consent (mobile/in-app browsers).
// Authenticate the AEAD-sealed OAuth state itself; it was created only after
// requireOwner passed at /start. For pre-release in-flight OAuth attempts,
// legacy random state + cookie remains supported for up to ten minutes.
export function verifyCallback(config,query,cookie="",subject=null,now=Date.now()){
 if(config?.status!=="ready"||!query||typeof query!=="object"||
  typeof query.state!=="string"||typeof query.code!=="string"||
  !CODE.test(query.code)||
  (subject!==null&&(typeof subject!=="string"||!subject)))return null;
 const sealed=SEALED_STATE.test(query.state);
 if(!sealed&&!STATE.test(query.state))return null;
 let payload;
 try{payload=JSON.parse(decryptSecret(sealed?query.state:cookie,config.key));}catch{return null;}
 if(!payload||typeof payload!=="object"||
  typeof payload.state!=="string"||!STATE.test(payload.state)||
  typeof payload.verifier!=="string"||!STATE.test(payload.verifier)||
  typeof payload.subject!=="string"||payload.subject.length<1||
  payload.subject.length>200||(subject!==null&&payload.subject!==subject)||
  !Number.isFinite(payload.createdAt)||now-payload.createdAt<0||
  now-payload.createdAt>600000)return null;
 // Legacy state needs a timing-safe nonce comparison with its cookie.
 // New state is fully authenticated by AES-GCM, without browser cookies.
 if(!sealed){
  const a=Buffer.from(payload.state),b=Buffer.from(query.state);
  if(a.length!==b.length||!timingSafeEqual(a,b))return null;
 }
 return {code:query.code,verifier:payload.verifier,subject:payload.subject};
}
async function googleJson(fetchImpl,url,params,timeout=8000){
 let response;
 try{response=await fetchImpl(url,{method:"POST",redirect:"error",cache:"no-store",
  headers:{"Content-Type":"application/x-www-form-urlencoded","Accept":"application/json"},
  body:new URLSearchParams(params).toString(),signal:AbortSignal.timeout(timeout)});
 }catch{throw new Error("gsc_oauth_google_unavailable");}
 if(response.status!==200)throw new Error(response.status===400||response.status===401?
  "gsc_oauth_grant_invalid":"gsc_oauth_google_unavailable");
 const raw=await response.text();
 if(raw.length>6500)throw new Error("gsc_oauth_google_unavailable");
 try{return JSON.parse(raw);}catch{throw new Error("gsc_oauth_google_unavailable");}
}
function validAccessToken(result){
 if(!result||typeof result!=="object"||typeof result.access_token!=="string"||
  !TOKEN.test(result.access_token)||result.token_type!=="Bearer")
  throw new Error("gsc_oauth_grant_invalid");
 if(result.scope!==undefined&&!String(result.scope).split(" ").includes(GSC_SCOPE))
  throw new Error("gsc_oauth_scope_denied");
 return result.access_token;
}
export async function exchangeGoogleCode(config,code,verifier,fetchImpl=fetch){
 if(config.status!=="ready"||!CODE.test(code)||!STATE.test(verifier))
  throw new Error("gsc_oauth_grant_invalid");
 const result=await googleJson(fetchImpl,GSC_TOKEN_URL,{
  client_id:config.clientId,client_secret:config.clientSecret,code,
  redirect_uri:GSC_CALLBACK,grant_type:"authorization_code",code_verifier:verifier
 });
 const accessToken=validAccessToken(result);
 if(typeof result.refresh_token!=="string"||!TOKEN.test(result.refresh_token))
  throw new Error("gsc_oauth_refresh_missing");
 return {accessToken,refreshToken:result.refresh_token};
}
export async function refreshGoogleToken(config,refreshToken,fetchImpl=fetch){
 if(config.status!=="ready"||typeof refreshToken!=="string"||!TOKEN.test(refreshToken))
  throw new Error("gsc_oauth_grant_invalid");
 const result=await googleJson(fetchImpl,GSC_TOKEN_URL,{
  client_id:config.clientId,client_secret:config.clientSecret,
  refresh_token:refreshToken,grant_type:"refresh_token"
 });
 const accessToken=validAccessToken(result);
 const rotated=typeof result.refresh_token==="string"&&TOKEN.test(result.refresh_token)?
  result.refresh_token:null;
 return {accessToken,rotated};
}
export async function hasGoogleProperty(config,accessToken,fetchImpl=fetch){
 if(config.status!=="ready"||!TOKEN.test(accessToken))throw new Error("gsc_oauth_permission_denied");
 let response;
 try{response=await fetchImpl("https://www.googleapis.com/webmasters/v3/sites",{
  method:"GET",redirect:"error",cache:"no-store",
  headers:{Authorization:"Bearer "+accessToken,Accept:"application/json"},
  signal:AbortSignal.timeout(7000)});
 }catch{throw new Error("gsc_oauth_google_unavailable");}
 if(response.status===401||response.status===403)throw new Error("gsc_oauth_permission_denied");
 if(response.status!==200)throw new Error("gsc_oauth_google_unavailable");
 const raw=await response.text();
 if(raw.length>65000)throw new Error("gsc_oauth_google_unavailable");
 let data;
 try{data=JSON.parse(raw);}catch{throw new Error("gsc_oauth_google_unavailable");}
 const sites=Array.isArray(data.siteEntry)?data.siteEntry:[];
 return sites.some(entry=>entry.siteUrl===config.property&&
  ["siteOwner","siteFullUser","siteRestrictedUser"].includes(entry.permissionLevel));
}
export async function revokeGoogleToken(refreshToken,fetchImpl=fetch){
 if(!TOKEN.test(refreshToken))return false;
 try{
  const response=await fetchImpl("https://oauth2.googleapis.com/revoke",{
   method:"POST",redirect:"error",cache:"no-store",
   headers:{"Content-Type":"application/x-www-form-urlencoded"},
   body:new URLSearchParams({token:refreshToken}).toString(),
   signal:AbortSignal.timeout(6000)});
  return response.status===200;
 }catch{return false;}
}
