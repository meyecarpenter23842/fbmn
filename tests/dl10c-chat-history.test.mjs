import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleChatHistory,saveChatTurn,safeChatText} from "../backend/admin-api/chat-history-service.mjs";
import {runChat} from "../backend/admin-api/chatbot-runtime.mjs";
const session="a".repeat(36),uuid="00000000-0000-4000-8000-000000000001";
const url="https://admin.example/v1/admin/website/chat-history";
const actor={role:"owner",subject:"owner"};
const req=(suffix="",body)=>new Request(url+suffix,body?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:undefined);
const dbWith=fn=>async work=>work({query:fn});
test("DL10C redacts credentials and raw IP, writes one atomic pair",async()=>{
 assert.equal(safeChatText("Bearer abcdef 192.168.0.1",300),"[đã ẩn] [đã ẩn]");
 await saveChatTurn({query:async(sql,args)=>{assert.match(sql,/ON CONFLICT/);assert.deepEqual(args,[session,"hello","reply"]);}},{session,question:"hello",answer:"reply"});
});
test("DL10C saves actual reply and isolates a storage failure",async()=>{
 const config={projectId:"futurebook-test",location:"global",agentId:uuid,environmentId:"draft",model:"agent-default"};
 const options={request:{session:uuid,text:"hello"},visitor:"b".repeat(64),secret:"secret",db:async()=>({config,revision:1}),detect:async()=>"reply"};
 let saved;
 assert.deepEqual(await runChat({...options,saveTurn:async t=>{saved=t;}}),{ok:true,text:"reply"});
 assert.equal(saved.question,"hello");assert.equal(saved.answer,"reply");assert.match(saved.session,/^[0-9a-f]{36}$/);
 assert.deepEqual(await runChat({...options,saveTurn:async()=>{throw Error("database");}}),{ok:true,text:"reply"});
 assert.deepEqual(await runChat({...options,detect:async()=>{throw Error("google");},saveTurn:async t=>{saved=t;}}),{ok:false});
 assert.equal(saved.answer,null);
});
test("DL10C role and query validation before database",async()=>{
 const db=()=>{throw Error("should not run");};
 for(const role of ["viewer","admin","editor","publisher","pricing"])assert.equal((await handleChatHistory({request:req(),actor:{role},db})).status,403);
 for(const q of ["?page=0","?page=1&page=2","?from=2026-02-30","?from=2026-11-11&to=2026-11-10","?session=bad","?unknown=1"])
  assert.equal((await handleChatHistory({request:req(q),actor,db})).status,400);
});
test("DL10C list search and dates are parameterized, detail is ordered",async()=>{
 const now="2026-11-10T12:00:00Z";
 const list=await handleChatHistory({request:req("?q=giay&from=2026-11-01&to=2026-11-10&page=2"),actor,db:dbWith(async(sql,args)=>{
  assert.match(sql,/plainto_tsquery/);assert.deepEqual(args,["giay","2026-11-01","2026-11-10",30]);
  return {rows:[{session_id:session,created_at:now,updated_at:now,message_count:2,latest:"reply"}]};
 })});
 assert.equal((await list.json()).data.conversations[0].messageCount,2);
 const detail=await handleChatHistory({request:req("?session="+session),actor,db:dbWith(async(sql,args)=>{
  assert.match(sql,/ORDER BY id/);assert.deepEqual(args,[session,0]);return {rows:[{id:"1",question:"hello",answer:"reply",created_at:now}]};
 })});
 assert.equal((await detail.json()).data.turns[0].answer,"reply");
});
test("DL10C deletes only a selected session and migration cascades",async()=>{
 const result=await handleChatHistory({request:req("",{operation:"delete",session}),actor,db:dbWith(async(sql,args)=>{
  assert.match(sql,/DELETE FROM .*chat_conversations WHERE session_id=\$1/);assert.deepEqual(args,[session]);return {rows:[{session_id:session}]};
 })});
 assert.equal((await result.json()).data.deleted,true);
 const migration=readFileSync(new URL("../backend/neon/migrations/20261110_dl10c_chat_history.up.sql",import.meta.url),"utf8");
 assert.match(migration,/ON DELETE CASCADE/);assert.match(migration,/USING gin/);assert.doesNotMatch(migration,/TO fbmn_p5_public_login/);
});
test("DL10C UI uses shared controls, confirmation and private relay",()=>{
 const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
 const ui=read("apps/admin/app/chat-history-manager.tsx");
 assert.match(ui,/ProductModal/);assert.match(ui,/Xác nhận xóa vĩnh viễn/);assert.match(ui,/fb-ui-field/);
 assert.match(ui,/api\/website\/chat-history/);assert.match(ui,/Tải thêm tin nhắn/);
 assert.match(read("apps/admin/app/page.tsx"),/Quản lý hội thoại/);
 assert.match(read("components/chatbot-widget.tsx"),/Futurebook lưu nội dung trò chuyện/);
});

test("DL10C inbox uses split pane, selected conversation and readable messages",()=>{
 const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
 const ui=read("apps/admin/app/chat-history-manager.tsx"),css=read("apps/admin/app/home-layout.css");
 assert.doesNotMatch(ui,/className="dl4-item/);
 assert.match(css,/\.fb-admin \.dl10c-messages p\{[^}]*white-space:pre-wrap;overflow-wrap:anywhere/);
 assert.match(css,/\.fb-admin \.dl10c-split\{display:grid/);
 assert.match(ui,/aria-current=/);
 assert.match(ui,/aria-label="Nội dung hội thoại"/);
 assert.doesNotMatch(ui,/title="Chi tiết hội thoại"/);
});
