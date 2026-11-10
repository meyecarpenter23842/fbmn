import {CHAT_PATH,CHAT_PROOF_PREFIX,readChatRequest} from "../../lib/chatbot/chat-request.ts";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Vary":"Origin"};
const fail=(status,code)=>Response.json({ok:false,error:{code}},{status,headers:HEADERS});
export async function handleChat({request,allowedOrigins,verifyProxy,limitVisitor,limitGlobal,chat}){
 const url=new URL(request.url);
 if(url.pathname!==CHAT_PATH)return fail(404,"not_found");
 if(request.method!=="POST")return fail(405,"method_not_allowed");
 if(url.search)return fail(400,"invalid_query");
 if(!allowedOrigins.includes(request.headers.get("Origin")))return fail(403,"origin_forbidden");
 const data=await readChatRequest(request);
 if(!data)return fail(400,"invalid_request");
 try{
  const visitor=await verifyProxy(request,CHAT_PROOF_PREFIX+JSON.stringify(data));
  if(!visitor)return fail(403,"untrusted_proxy");
  if((await limitVisitor(visitor))?.success!==true||(await limitGlobal())?.success!==true)return fail(429,"request_limited");
  const result=await chat(data,visitor);
  if(result?.ok!==true||typeof result.text!=="string"||!result.text.trim()||result.text.length>3000)
   return fail(503,"chat_unavailable");
  return Response.json({ok:true,text:result.text},{headers:HEADERS});
 }catch{return fail(503,"chat_unavailable");}
}
