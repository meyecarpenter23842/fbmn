import test from "node:test";
import assert from "node:assert/strict";
import {parseServiceAccount,handleChatbotConfig} from "../backend/admin-api/chatbot-config-service.mjs";
import {createCredentialStore} from "../backend/admin-api/chatbot-credentials.mjs";
const account={type:"service_account",project_id:"futurebook-test",client_email:"bot@futurebook-test.iam.gserviceaccount.com",private_key:"-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",token_uri:"https://evil.example"};
test("service account import extracts only expected fields without trusting token URI",()=>{
 const c=parseServiceAccount(JSON.stringify(account));assert.equal(c.project_id,account.project_id);assert.equal(c.token_uri,undefined);
 assert.equal(parseServiceAccount("export default (()=>{})()"),null);
});
test("credential storage encrypts and authenticates revision; ciphertext only",async()=>{
 const map=new Map(),bucket={put:async(k,v)=>map.set(k,v),get:async k=>map.has(k)?{size:map.get(k).length,arrayBuffer:async()=>map.get(k).buffer}:null};
 const store=createCredentialStore(bucket,"ab".repeat(32));await store.write(2,JSON.stringify(account));
 assert.ok(!new TextDecoder().decode(map.get("chatbot/credential-2")).includes("PRIVATE KEY"));
 assert.deepEqual(JSON.parse(await store.read(2)),account);
 map.set("chatbot/credential-3",map.get("chatbot/credential-2"));await assert.rejects(store.read(3));
});
test("owner lists agents using imported credentials without echoing key",async()=>{
 const request=new Request("https://example.test/v1/admin/website/chatbot-config",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({operation:"list_agents",projectId:account.project_id,credential:JSON.stringify(account)})});
 const response=await handleChatbotConfig({request,actor:{role:"owner"},db:async()=>{},listAgents:async(project,secret)=>{assert.equal(project,account.project_id);assert.equal(JSON.parse(secret).private_key,account.private_key);return {agents:[{id:"a",location:"global",name:"Futurebook"}],failedLocations:[]};}});
 assert.equal(response.status,200);assert.doesNotMatch(await response.text(),/PRIVATE KEY/);
});
