import test from "node:test";
import assert from "node:assert/strict";
import {normalizeConfig,parseConfigFile,handleChatbotConfig} from "../backend/admin-api/chatbot-config-service.mjs";
const config={projectId:"futurebook-test",location:"global",agentId:"00000000-0000-4000-8000-000000000001",environmentId:"draft",model:""};
const endpoint="https://admin.example/v1/admin/website/chatbot-config";
const req=body=>new Request(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
test("DL10A strict literal file formats and no code execution",()=>{
 assert.deepEqual(parseConfigFile(JSON.stringify(config)),config);
 assert.deepEqual(parseConfigFile("export default "+JSON.stringify(config)+";"),config);
 assert.deepEqual(parseConfigFile("module.exports = "+JSON.stringify(config)),config);
 assert.equal(parseConfigFile("export default (()=>("+JSON.stringify(config)+"))()"),null);
 assert.equal(normalizeConfig({...config,private_key:"secret"}),null);
 assert.equal(normalizeConfig({...config,location:"evil.example"}),null);
 assert.equal(normalizeConfig({...config,model:"unknown"}),null);
});
test("DL10A owner gate and no credential disclosure",async()=>{
 const actor={role:"owner",subject:"owner"};
 const db=async work=>work({query:async()=>({rows:[{config,revision:1}]})});
 assert.equal((await handleChatbotConfig({request:new Request(endpoint),actor:{role:"admin"},db})).status,403);
 const result=await handleChatbotConfig({request:new Request(endpoint),actor,db,googleSecret:"secret"});
 assert.equal(result.headers.get("cache-control"),"private, no-store");
 const json=await result.json();assert.equal(json.data.credentialsConfigured,true);assert.equal(JSON.stringify(json).includes("secret"),false);
 assert.equal((await handleChatbotConfig({request:req({operation:"discover",config}),actor,db})).status,503);
 assert.equal((await handleChatbotConfig({request:req({operation:"save",config:{...config,model:"gemini-2.5-flash"},revision:1}),actor,db,googleSecret:"secret",discover:async()=>({models:[]})})).status,400);
});
