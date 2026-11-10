import test from "node:test";
import assert from "node:assert/strict";
import {parseChatRequest} from "../lib/chatbot/chat-request.ts";
import {handleChat} from "../backend/public-api/chat-service.mjs";
import {runChat,cxSessionId,detectCx} from "../backend/admin-api/chatbot-runtime.mjs";
const session="00000000-0000-4000-8000-000000000001",visitor="a".repeat(64);
const data={session,text:"Sản phẩm"};
const config={projectId:"futurebook-test",location:"global",agentId:session,environmentId:"00000000-0000-4000-8000-000000000002",model:"gemini-2.5-flash"};
const req=(body=data,origin="https://www.fbmn.vn")=>new Request("https://api.example/v1/public/chat",{method:"POST",headers:{"content-type":"application/json",Origin:origin},body:JSON.stringify(body)});
test("DL10B rejects arbitrary config and bounds chat input",()=>{
 assert.deepEqual(parseChatRequest(data),data);
 assert.equal(parseChatRequest({...data,model:"other"}),null);
 assert.equal(parseChatRequest({...data,text:"x".repeat(301)}),null);
});
test("DL10B proof, origin and rate limits precede Google",async()=>{
 let called=0;const options={allowedOrigins:["https://www.fbmn.vn"],verifyProxy:async()=>visitor,limitVisitor:async()=>({success:true}),limitGlobal:async()=>({success:true}),chat:async()=>{called++;return {ok:true,text:"hello"};}};
 assert.equal((await handleChat({...options,request:req(data,"https://evil.example")})).status,403);
 assert.equal((await handleChat({...options,request:req(),verifyProxy:async()=>null})).status,403);
 assert.equal((await handleChat({...options,request:req(),limitVisitor:async()=>({success:false})})).status,429);
 assert.equal(called,0);
 assert.deepEqual(await (await handleChat({...options,request:req()})).json(),{ok:true,text:"hello"});
});
test("DL10B isolates sessions and refuses drafts or missing credentials",async()=>{
 assert.notEqual(await cxSessionId(visitor,session,1),await cxSessionId("b".repeat(64),session,1));
 assert.notEqual(await cxSessionId(visitor,session,1),await cxSessionId(visitor,session,2));
 const opts={request:data,visitor,secret:"secret",db:async()=>({config,revision:1}),detect:async()=> "reply"};
 assert.deepEqual(await runChat(opts),{ok:true,text:"reply"});
 assert.deepEqual(await runChat({...opts,secret:""}),{ok:false});
 assert.deepEqual(await runChat({...opts,db:async()=>({config:{...config,environmentId:"draft"},revision:1})}),{ok:false});
});
test("DL10B detectIntent targets saved environment/model and strips nontext data",async()=>{
 const answer=await detectCx({config,secret:"secret",session:"abc",text:"hi",getToken:async()=> "token",fetcher:async(url,init)=>{
 assert.match(url,/\/environments\/.*\/sessions\/abc:detectIntent$/);
 const body=JSON.parse(init.body);assert.equal(body.queryParams.llmModelSettings.model,config.model);
 assert.equal(body.queryParams.disableWebhook,true);
 return Response.json({queryResult:{parameters:{private:"secret"},responseMessages:[{text:{text:["Hello"]}},{payload:{secret:"ignore"}}]}});
 }});
 assert.equal(answer,"Hello");
});
