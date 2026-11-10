// DL10B internal RPC only. No HTTP route, no private business data or conversation persistence.
import {normalizeConfig,tokenFor} from "./chatbot-config-service.mjs";
import {parseChatRequest} from "../../lib/chatbot/chat-request.ts";
const HEX=/^[0-9a-f]{64}$/;
const encoder=new TextEncoder();
export async function cxSessionId(visitor,session,revision){
 if(!HEX.test(visitor)||!Number.isSafeInteger(revision)||revision<1)throw Error("invalid_session");
 const hash=await crypto.subtle.digest("SHA-256",encoder.encode(visitor+":"+session+":"+revision));
 return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,"0")).join("").slice(0,36);
}
export async function detectCx({config,secret,session,text,fetcher=fetch,getToken=tokenFor}){
 const c=normalizeConfig(config);
 // Production traffic must use a published Environment; drafts never receive public messages.
 if(!c||!c.model||c.environmentId==="draft"||!secret)throw Error("chat_unavailable");
 const host=c.location==="global"?"dialogflow.googleapis.com":c.location+"-dialogflow.googleapis.com";
 const resource="projects/"+c.projectId+"/locations/"+c.location+"/agents/"+c.agentId+
  "/environments/"+c.environmentId+"/sessions/"+session;
 const token=await getToken(secret,fetcher);
 const response=await fetcher("https://"+host+"/v3beta1/"+resource+":detectIntent",{
  method:"POST",redirect:"error",signal:AbortSignal.timeout(15000),
  headers:{Authorization:"Bearer "+token,"Content-Type":"application/json",Accept:"application/json"},
  body:JSON.stringify({queryInput:{text:{text},languageCode:"vi"},queryParams:{
   timeZone:"Asia/Ho_Chi_Minh",sessionTtl:"1800s",disableWebhook:true,llmModelSettings:{model:c.model}}})});
 if(!response.ok)throw Error("chat_unavailable");
 const result=await response.json();
 const messages=result?.queryResult?.responseMessages;
 if(!Array.isArray(messages))throw Error("chat_unavailable");
 // Render text only. Never forward parameters, diagnostics, tool calls, audio or arbitrary links.
 const reply=messages.flatMap(m=>Array.isArray(m?.text?.text)?m.text.text:[])
  .filter(t=>typeof t==="string").map(t=>t.trim()).filter(Boolean).join("\n").slice(0,3000);
 if(!reply)throw Error("chat_unavailable");
 return reply;
}
export async function runChat({request,visitor,db,secret,loadSecret,detect=detectCx}){
 const checked=parseChatRequest(request);
 if(!checked||!HEX.test(visitor)||typeof db!=="function"||(!secret&&!loadSecret))return {ok:false};
 try{
  const row=await db();
  const config=normalizeConfig(row?.config),revision=Number(row?.revision);
  if(!config||!config.model||config.environmentId==="draft")return {ok:false};
  const session=await cxSessionId(visitor,checked.session,revision);
  const credential=loadSecret?await loadSecret(revision)||secret:secret;
  if(!credential)return {ok:false};
  const text=await detect({config,secret:credential,session,text:checked.text});
  return {ok:true,text};
 }catch{return {ok:false};}
}
