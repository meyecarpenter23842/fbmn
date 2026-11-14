import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomBytes} from "node:crypto";
import {readFileSync} from "node:fs";
import {
 GSC_SCOPE,GSC_CALLBACK,GSC_AUTH_URL,
 oauthConfig,encryptSecret,decryptSecret,authorizationRequest,verifyCallback,
 exchangeGoogleCode,refreshGoogleToken,hasGoogleProperty,revokeGoogleToken
} from "../lib/ceo-gsc-oauth.mjs";
const ENV={
 FBMN_CEO_GSC_SITE_URL:"sc-domain:fbmn.vn",
 FBMN_CEO_GSC_OAUTH_CLIENT_ID:"123456789012-abcdefghijklmnop.apps.googleusercontent.com",
 FBMN_CEO_GSC_OAUTH_CLIENT_SECRET:"GOCSPX-test-client-secret-value",
 FBMN_CEO_GSC_OAUTH_ENCRYPTION_KEY:randomBytes(32).toString("hex")
};
const config=oauthConfig(ENV);
const owner="neon_owner_42";
const now=Date.UTC(2026,10,14);

test("OAuth config accepts only FBMN property, OAuth Web Client and AES-256 key",()=>{
 assert.equal(oauthConfig({}).status,"unconfigured");
 assert.equal(config.status,"ready");
 assert.equal(config.property,"sc-domain:fbmn.vn");
 assert.throws(()=>oauthConfig({...ENV,FBMN_CEO_GSC_SITE_URL:"sc-domain:attacker.com"}),/config_invalid/);
 assert.throws(()=>oauthConfig({...ENV,FBMN_CEO_GSC_OAUTH_CLIENT_ID:"attacker"}),/config_invalid/);
 assert.throws(()=>oauthConfig({...ENV,FBMN_CEO_GSC_OAUTH_ENCRYPTION_KEY:"short"}),/config_invalid/);
 assert.throws(()=>oauthConfig({FBMN_CEO_GSC_OAUTH_CLIENT_ID:ENV.FBMN_CEO_GSC_OAUTH_CLIENT_ID}),/config_invalid/);
});
test("AES-256-GCM seals refresh tokens with randomized IV and verifies integrity",()=>{
 const secret="1//0g_refresh_token"+randomBytes(20).toString("hex");
 const a=encryptSecret(secret,config.key),b=encryptSecret(secret,config.key);
 assert.notEqual(a,b);
 assert.equal(decryptSecret(a,config.key),secret);
 assert.equal(decryptSecret(b,config.key),secret);
 assert.throws(()=>decryptSecret(a.slice(0,-4)+"AAAA",config.key),/invalid_ciphertext/);
 assert.throws(()=>decryptSecret(a,randomBytes(32)),/invalid_ciphertext/);
});
test("AEAD-sealed OAuth state works without cookie or JWT and binds Owner + PKCE + TTL",()=>{
 const {authorizationUrl}=authorizationRequest(config,owner,now);
 const uri=new URL(authorizationUrl);
 assert.equal(uri.origin,new URL(GSC_AUTH_URL).origin);
 assert.equal(uri.searchParams.get("redirect_uri"),GSC_CALLBACK);
 assert.equal(uri.searchParams.get("scope"),GSC_SCOPE);
 assert.equal(uri.searchParams.get("access_type"),"offline");
 assert.equal(uri.searchParams.get("prompt"),"consent");
 assert.equal(uri.searchParams.get("code_challenge_method"),"S256");
 assert.equal(uri.searchParams.get("response_type"),"code");
 assert.equal(uri.searchParams.get("client_secret"),null);
 const state=uri.searchParams.get("state");
 assert.match(state,/^v1\.[A-Za-z0-9_-]{40,5000}$/);
 // Google callback only has query parameters. No browser cookie or fresh JWT.
 const code="4/0AX4XfWhValidGoogleAuthorizationCode";
 const granted=verifyCallback(config,{state,code},"",null,now+15000);
 assert.ok(granted);
 assert.equal(granted.subject,owner);
 assert.equal(createHash("sha256").update(granted.verifier).digest("base64url"),
  uri.searchParams.get("code_challenge"));
 assert.equal(verifyCallback(config,{state,code},"","other_owner",now+15000),null);
 assert.equal(verifyCallback(config,{state,code},"",null,now+600001),null);
 assert.equal(verifyCallback(config,{state,code},"",null,now-1),null);
 const flip=state.slice(0,-5)+(state.slice(-5,-4)==="A"?"B":"A")+state.slice(-4);
 assert.equal(verifyCallback(config,{state:flip,code},"",null,now+15000),null);
 assert.equal(verifyCallback(config,{state:"a".repeat(43),code},"",null,now+15000),null);
 assert.equal(verifyCallback(config,{state,code},"",null,now+15000).subject,owner);
 assert.equal(verifyCallback(oauthConfig({...ENV,
  FBMN_CEO_GSC_OAUTH_ENCRYPTION_KEY:randomBytes(32).toString("hex")}),
  {state,code},"",null,now+15000),null);
 // A stale or corrupt browser cookie cannot break the newly sealed state.
 assert.equal(verifyCallback(config,{state,code},"stale-cookie",null,now+15000).subject,owner);
});
test("legacy random OAuth state is only valid with its authentic cookie",()=>{
 const state="a".repeat(43),verifier="b".repeat(64);
 const cookie=encryptSecret(JSON.stringify({state,verifier,subject:owner,createdAt:now}),config.key);
 const code="4/0AX4XfWhValidGoogleAuthorizationCode";
 assert.equal(verifyCallback(config,{state,code},cookie,null,now+3000).subject,owner);
 assert.equal(verifyCallback(config,{state,code},"",null,now+3000),null);
 assert.equal(verifyCallback(config,{state,code},"tampered-cookie",null,now+3000),null);
 assert.equal(verifyCallback(config,{state:"c".repeat(43),code},cookie,null,now+3000),null);
});
test("OAuth code exchange and refresh never send client secret to CEO browser",async()=>{
 const post=[];
 const fetchImpl=async(url,options)=>{
  post.push({url,options});
  assert.equal(options.method,"POST");
  assert.equal(options.redirect,"error");
  assert.equal(url,"https://oauth2.googleapis.com/token");
  const params=new URLSearchParams(options.body);
  assert.equal(params.get("client_secret"),config.clientSecret);
  assert.equal(params.get("client_id"),config.clientId);
  if(params.get("grant_type")==="authorization_code"){
   assert.equal(params.get("redirect_uri"),GSC_CALLBACK);
   assert.equal(params.get("code_verifier").length,64);
   return new Response(JSON.stringify({
    access_token:"ya29."+randomBytes(32).toString("hex"),
    refresh_token:"1//0g"+randomBytes(32).toString("hex"),
    token_type:"Bearer",scope:GSC_SCOPE
   }),{status:200});
  }
  assert.equal(params.get("grant_type"),"refresh_token");
  return new Response(JSON.stringify({
   access_token:"ya29."+randomBytes(32).toString("hex"),
   token_type:"Bearer",scope:GSC_SCOPE
  }),{status:200});
 };
 const auth=authorizationRequest(config,owner,now);
 const verifier=verifyCallback(config,{
  state:new URL(auth.authorizationUrl).searchParams.get("state"),
  code:"4/0AX4XfWhValidGoogleAuthorizationCode"
 },"",owner,now);
 const grant=await exchangeGoogleCode(config,verifier.code,verifier.verifier,fetchImpl);
 assert.equal(typeof grant.refreshToken,"string");
 const refreshed=await refreshGoogleToken(config,grant.refreshToken,fetchImpl);
 assert.equal(refreshed.rotated,null);
 assert.equal(post.length,2);
});
test("OAuth rejects missing refresh token and broader/unapproved scopes",async()=>{
 const fake=(obj)=>async()=>new Response(JSON.stringify(obj),{status:200});
 await assert.rejects(()=>exchangeGoogleCode(config,"4/0AX4XfWhValidGoogleAuthorizationCode",
  "a".repeat(64),fake({access_token:"a".repeat(45),token_type:"Bearer",scope:GSC_SCOPE})),
 /refresh_missing/);
 await assert.rejects(()=>exchangeGoogleCode(config,"4/0AX4XfWhValidGoogleAuthorizationCode",
  "a".repeat(64),fake({access_token:"a".repeat(45),token_type:"Bearer",
   refresh_token:"r".repeat(45),scope:"https://www.googleapis.com/auth/webmasters"})),
 /scope_denied/);
});
test("Google property must match configured FBMN site exactly and grant read permission",async()=>{
 let called=0;
 const google=async(url,opts)=>{
  called++;
  assert.equal(url,"https://www.googleapis.com/webmasters/v3/sites");
  assert.equal(opts.redirect,"error");
  return new Response(JSON.stringify({siteEntry:[
   {siteUrl:"sc-domain:other.vn",permissionLevel:"siteOwner"},
   {siteUrl:"sc-domain:fbmn.vn",permissionLevel:"siteRestrictedUser"}]}),{status:200});
 };
 assert.equal(await hasGoogleProperty(config,"a".repeat(40),google),true);
 assert.equal(called,1);
 assert.equal(await hasGoogleProperty(config,"a".repeat(40),
  async()=>new Response(JSON.stringify({siteEntry:[]}),{status:200})),false);
 await assert.rejects(()=>hasGoogleProperty(config,"a".repeat(40),
  async()=>new Response("",{status:403})),/permission_denied/);
});
test("OAuth routes check Owner, origin and state; do not expose token in query or response",()=>{
 const read=(p)=>readFileSync(new URL("../app/api/ceo/gsc/oauth/"+p+"/route.ts",import.meta.url),"utf8");
 const start=read("start"),callback=read("callback"),status=read("status");
 for(const route of [start,status]){
  assert.match(route,/requireOwner/);
  assert.match(route,/no-store/);
 }
 assert.match(callback,/no-store/);
 assert.doesNotMatch(callback,/requireOwner/);
 assert.match(callback,/saveGscGrant\(verified\.subject/);
 assert.match(callback,/verifyCallback\(config/);
 // Distinct safe callback diagnostics must never echo code/state/tokens.
 for(const reason of ["invalid","permission","config","token","storage","google_api","connected"]){
  assert.match(callback,new RegExp('finish\\("'+reason+'"\\)'));
 }
 assert.match(start,/allowedOrigin/);
 assert.doesNotMatch(start,/Set-Cookie|HttpOnly|SameSite=/);
 assert.match(start,/authorizationRequest/);
 assert.match(callback,/verifyCallback/);
 assert.match(callback,/hasGoogleProperty/);
 assert.match(callback,/saveGscGrant/);
 assert.match(callback,/Max-Age=0/);
 assert.match(status,/deleteGscGrant/);
 assert.match(status,/revokeGoogleToken/);
 for(const route of [start,callback,status])
  assert.doesNotMatch(route,/console\.log|NEXT_PUBLIC_|localStorage|client_secret\s*:/);
 const oauthReport=readFileSync(new URL("../app/api/ceo/search-console/route.ts",import.meta.url),"utf8");
 assert.match(oauthReport,/refreshGoogleToken/);
 assert.match(oauthReport,/readGscGrant/);
 assert.match(oauthReport,/fetchGscReport/);
 assert.doesNotMatch(oauthReport,/FBMN_CEO_GSC_SERVICE_ACCOUNT_JSON/);
});

test("sealed OAuth callback cannot rely on a new JWT from Google's redirect",()=>{
 const {authorizationUrl}=authorizationRequest(config,owner,now);
 const state=new URL(authorizationUrl).searchParams.get("state");
 const code="4/0AX4XfWhValidGoogleAuthorizationCode";
 const verified=verifyCallback(config,{state,code},"",null,now+20000);
 assert.equal(verified?.subject,owner);
 assert.equal(verified?.code,code);
 assert.equal(verifyCallback(config,{state,code},"","other_owner",now+20000),null);
});
