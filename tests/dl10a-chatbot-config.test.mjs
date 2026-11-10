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

test("DL10A revision conflict, transactional save, and audit",async()=>{
 const actor={role:"owner",subject:"owner"},calls=[];
 let current={config:{},revision:1};
 const db=async work=>work({query:async(sql,args)=>{
  calls.push(sql);
  if(sql.startsWith("SELECT config"))return {rows:[current]};
  if(sql.startsWith("UPDATE ")){current={config:JSON.parse(args[0]),revision:2};return {rows:[current]};}
  return {rows:[]};
 }});
 const saved=await handleChatbotConfig({request:req({operation:"save",config,revision:1}),actor,db});
 assert.equal(saved.status,200);assert.deepEqual((await saved.json()).data,{config,revision:2});
 assert.ok(calls.some(s=>s.includes("website_chatbot_config_audit")));assert.equal(calls.at(-1),"COMMIT");
 const stale=await handleChatbotConfig({request:req({operation:"save",config,revision:1}),actor,db});
 assert.equal(stale.status,409);assert.equal(calls.at(-1),"ROLLBACK");
});
