import test from "node:test";
import assert from "node:assert/strict";
import {tokenFor,listCxAgents,discoverCx} from "../backend/admin-api/chatbot-config-service.mjs";
const keys=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
const pem="-----BEGIN PRIVATE KEY-----\n"+Buffer.from(await crypto.subtle.exportKey("pkcs8",keys.privateKey)).toString("base64")+"\n-----END PRIVATE KEY-----\n";
const secret=JSON.stringify({type:"service_account",project_id:"futurebook-test",client_email:"bot@futurebook-test.iam.gserviceaccount.com",private_key:pem});
test("native OAuth assertion is a valid RS256 signature with fixed Google audience",async()=>{
 const token=await tokenFor(secret,async(url,init)=>{
  assert.equal(url,"https://oauth2.googleapis.com/token");
  assert.equal(init.redirect,"manual");
  const [h,p,s]=init.body.get("assertion").split(".");
  assert.equal(JSON.parse(Buffer.from(p,"base64url")).aud,url);
  assert.ok(await crypto.subtle.verify("RSASSA-PKCS1-v1_5",keys.publicKey,Buffer.from(s,"base64url"),new TextEncoder().encode(h+"."+p)));
  return Response.json({access_token:"test-token"});
 });
 assert.equal(token,"test-token");
});
test("Google OAuth errors and IAM failures are specific, sanitized",async()=>{
 await assert.rejects(tokenFor(secret,async()=>Response.json({error:"invalid_grant"},{status:400})),/google_auth_failed/);
 await assert.rejects(tokenFor(JSON.stringify({type:"service_account",client_email:"bot",private_key:"bad"}),async()=>{throw Error("should not call");}),/google_invalid_key/);
 const fetcher=async url=>url.includes("oauth2")?Response.json({access_token:"token"}):Response.json({error:{details:[{reason:"SERVICE_DISABLED"}]}},{status:403});
 await assert.rejects(listCxAgents("futurebook-test",secret,fetcher,"global"),/google_api_disabled/);
});
test("selected region avoids locations enumeration and uses regional endpoint",async()=>{
 const seen=[];
 const data=await listCxAgents("futurebook-test",secret,async url=>{
  seen.push(url);if(url.includes("oauth2"))return Response.json({access_token:"token"});
  return Response.json({agents:[{name:"projects/futurebook-test/locations/asia-southeast1/agents/00000000-0000-4000-8000-000000000001",displayName:"Futurebook"}]});
 },"asia-southeast1");
 assert.equal(seen.length,2);assert.match(seen[1],/^https:\/\/asia-southeast1-dialogflow\.googleapis\.com/);assert.equal(data.agents[0].name,"Futurebook");
});

test("Cloudflare Workers accepts manual redirect and rejects Google redirects without following",async()=>{
 const seen=[];
 await assert.rejects(tokenFor(secret,async(url,init)=>{
  seen.push(url);assert.equal(init.redirect,"manual");
  return new Response(null,{status:302,headers:{Location:"https://example.invalid"}});
 }),/google_unavailable/);
 assert.equal(seen.length,1);
 await assert.rejects(listCxAgents("futurebook-test",secret,async(url,init)=>{
  assert.equal(init.redirect,"manual");
  return url.includes("oauth2")?Response.json({access_token:"token"}):new Response(null,{status:302,headers:{Location:"https://example.invalid"}});
 },"global"),/google_unavailable/);
});

test("default Agent discovery does not require environment or Vertex API",async()=>{
 const config={projectId:"futurebook-test",location:"asia-southeast1",agentId:"00000000-0000-4000-8000-000000000001",environmentId:"draft",model:"agent-default"};
 const path="projects/"+config.projectId+"/locations/"+config.location+"/agents/"+config.agentId;
 const result=await discoverCx(config,secret,async url=>{
  assert.ok(!url.includes("/environments/")&&!url.includes("aiplatform"));
  if(url.includes("oauth2"))return Response.json({access_token:"token"});
  if(url.includes("/generativeSettings"))return Response.json({error:{}},{status:403});
  return Response.json({name:path,defaultLanguageCode:"vi"});
 });
 assert.ok(result.models.includes("agent-default"));
});
