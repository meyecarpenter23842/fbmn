import {randomBytes,createHash} from "node:crypto";
import {encryptSecret,decryptSecret} from "./ceo-gsc-oauth.mjs";
const SCOPE="https://www.googleapis.com/auth/adwords";
const CALLBACK="https://ceo.fbmn.vn/api/ceo/ads/oauth/callback";
const CLIENT=/^[0-9]{8,30}-[a-z0-9_-]{8,90}\.apps\.googleusercontent\.com$/;
const TOKEN=/^[A-Za-z0-9._~+/\-=]{15,6000}$/;
const CODE=/^[A-Za-z0-9._~+/\-=]{8,2048}$/;
const SEALED=/^v1\.[A-Za-z0-9_-]{40,12000}$/;
export function adsOAuthConfig(env=process.env){
 const clientId=String(env.FBMN_CEO_ADS_OAUTH_CLIENT_ID||"");
 const clientSecret=String(env.FBMN_CEO_ADS_OAUTH_CLIENT_SECRET||"");
 const key=String(env.FBMN_CEO_ADS_OAUTH_ENCRYPTION_KEY||"");
 if(!clientId&&!clientSecret&&!key)return {status:"unconfigured"};
 if(!CLIENT.test(clientId)||clientSecret.length<16||clientSecret.length>256||
  !/^[a-f0-9]{64}$/i.test(key))throw new Error("ads_oauth_bad_config");
 return {status:"ready",clientId,clientSecret,key:Buffer.from(key,"hex")};
}
function stateUnseal(config,text,kind,subject,ttl,now=Date.now()){
 if(config.status!=="ready"||typeof text!=="string"||!SEALED.test(text))return null;
 try{
  const o=JSON.parse(decryptSecret(text,config.key));
  if(o.kind!==kind||typeof o.subject!=="string"||o.subject.length>200||
   (subject!==null&&o.subject!==subject)||
   !Number.isFinite(o.createdAt)||o.createdAt>now||now-o.createdAt>ttl)return null;
  return o;
 }catch{return null;}
}
export function adsAuthorize(config,subject,now=Date.now()){
 if(config.status!=="ready"||typeof subject!=="string"||!subject||
  subject.length>200)throw new Error("ads_oauth_invalid_owner");
 const verifier=randomBytes(48).toString("base64url");
 const challenge=createHash("sha256").update(verifier).digest("base64url");
 const state=encryptSecret(JSON.stringify({
  kind:"ads_state_v1",subject,verifier,nonce:randomBytes(18).toString("base64url"),
  createdAt:now
 }),config.key);
 const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
 for(const [k,v] of Object.entries({
  client_id:config.clientId,redirect_uri:CALLBACK,response_type:"code",
  scope:SCOPE,state,code_challenge:challenge,code_challenge_method:"S256",
  access_type:"offline",prompt:"consent"
 }))url.searchParams.set(k,v);
 return url.toString();
}
export function adsCallback(config,code,state,now=Date.now()){
 const p=stateUnseal(config,state,"ads_state_v1",null,600000,now);
 if(!p||!CODE.test(code)||typeof p.verifier!=="string"||
  !/^[A-Za-z0-9_-]{43,128}$/.test(p.verifier))return null;
 return {code,verifier:p.verifier,subject:p.subject};
}
export function adsTicket(config,cb,now=Date.now()){
 return encryptSecret(JSON.stringify({...cb,kind:"ads_ticket_v1",createdAt:now}),config.key);
}
export function adsVerifyTicket(config,ticket,subject,now=Date.now()){
 const p=stateUnseal(config,ticket,"ads_ticket_v1",subject,120000,now);
 return p&&CODE.test(p.code)&&/^[A-Za-z0-9_-]{43,128}$/.test(p.verifier)?p:null;
}
async function tokenRequest(config,params,fetchImpl=fetch){
 let response;
 try{response=await fetchImpl("https://oauth2.googleapis.com/token",{
  method:"POST",redirect:"error",cache:"no-store",
  headers:{"Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,...params}).toString(),
  signal:AbortSignal.timeout(8000)
 });}catch{throw new Error("ads_google_unavailable");}
 if(response.status===400||response.status===401)throw new Error("ads_grant_expired");
 if(response.status!==200)throw new Error("ads_google_unavailable");
 const raw=await response.text();
 if(raw.length>7000)throw new Error("ads_google_unavailable");
 let j;try{j=JSON.parse(raw);}catch{throw new Error("ads_google_unavailable");}
 if(!TOKEN.test(j.access_token)||j.token_type!=="Bearer"||
  (j.scope!==undefined&&!String(j.scope).split(" ").includes(SCOPE)))
  throw new Error("ads_grant_expired");
 return j;
}
export async function adsExchangeCode(config,code,verifier,fetchImpl=fetch){
 if(!CODE.test(code)||!/^[A-Za-z0-9_-]{43,128}$/.test(verifier))
  throw new Error("ads_grant_expired");
 const j=await tokenRequest(config,{grant_type:"authorization_code",code,
  redirect_uri:CALLBACK,code_verifier:verifier},fetchImpl);
 if(!TOKEN.test(j.refresh_token))throw new Error("ads_no_refresh_token");
 return {accessToken:j.access_token,refreshToken:j.refresh_token};
}
export async function adsRefresh(config,refreshToken,fetchImpl=fetch){
 if(config.status!=="ready"||!TOKEN.test(refreshToken))throw new Error("ads_grant_expired");
 const j=await tokenRequest(config,{grant_type:"refresh_token",refresh_token:refreshToken},fetchImpl);
 return {accessToken:j.access_token,rotated:TOKEN.test(j.refresh_token)?j.refresh_token:null};
}
export async function adsRevoke(refreshToken,fetchImpl=fetch){
 if(!TOKEN.test(refreshToken))return false;
 try{
  const r=await fetchImpl("https://oauth2.googleapis.com/revoke",{method:"POST",redirect:"error",
   headers:{"Content-Type":"application/x-www-form-urlencoded"},
   body:new URLSearchParams({token:refreshToken}).toString(),signal:AbortSignal.timeout(6000)});
  return r.status===200;
 }catch{return false;}
}
