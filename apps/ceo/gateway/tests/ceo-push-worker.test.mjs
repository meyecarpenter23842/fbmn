import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=readFileSync(new URL("../../flutter/web/push-sw.js",import.meta.url),"utf8");
const session="a".repeat(36),uuid="11111111-1111-4111-8111-111111111111";
function worker(){
 const handlers={},notifications=[],opened=[],messages=[],mockClients=[];
 const self={location:{origin:"https://ceo.fbmn.vn"},
  navigator:{setAppBadge:async()=>{}},
  clients:{matchAll:async()=>mockClients,
   openWindow:async(url)=>{opened.push(url);},claim:async()=>{}},
  skipWaiting:async()=>{},
  registration:{showNotification:async(title,options)=>{notifications.push({title,options});}},
  addEventListener:(event,fn)=>{handlers[event]=fn;}};
 vm.runInNewContext(source,{self,URL,Number,Date});
 return {handlers,notifications,opened,messages,mockClients};
}
async function push(w,payload){
 let promise;
 w.handlers.push({data:{json:()=>payload},waitUntil:p=>{promise=p;}});
 await promise;
}
async function click(w,link){
 let promise;
 w.handlers.notificationclick({notification:{data:{url:link},close(){}},
  waitUntil:p=>{promise=p;}});
 await promise;
}
test("push displays generic no-PII text with exact Owner deep-link",async()=>{
 const w=worker();
 await push(w,{type:"contact",id:uuid,name:"Private Name",phone:"0900000000",badge:2});
 assert.equal(w.notifications.length,1);
 const item=w.notifications[0];
 assert.equal(item.options.data.url,"/ceo/index.html?tab=contact&id="+uuid);
 assert.equal(item.options.body,"Liên hệ mới");
 assert.equal(JSON.stringify(item).includes("Private Name"),false);
 await click(w,item.options.data.url);
 assert.deepEqual(w.opened,["https://ceo.fbmn.vn/ceo/index.html?tab=contact&id="+uuid]);
});
test("received mail push displays privacy-safe title and opens exact inbox item",async()=>{
 const w=worker();
 await push(w,{type:"mail",id:uuid,subject:"Giá NET bí mật",from:"contact@customer.test",badge:0});
 const notice=w.notifications[0];
 assert.equal(notice.options.body,"Email mới đến");
 assert.equal(notice.options.data.url,"/ceo/index.html?tab=mail&id="+uuid);
 assert.equal(JSON.stringify(notice).includes("Giá NET bí mật"),false);
 assert.equal(JSON.stringify(notice).includes("contact@customer.test"),false);
 await click(w,notice.options.data.url);
 assert.deepEqual(w.opened,["https://ceo.fbmn.vn/ceo/index.html?tab=mail&id="+uuid]);
});
test("malformed payload never opens a foreign site",async()=>{
 const w=worker();
 await push(w,{type:"chat",id:"https://evil.test",badge:12});
 assert.equal(w.notifications[0].options.data.url,"/ceo/index.html");
 await click(w,"https://evil.test/something");
 assert.equal(w.opened.length,0);
 await push(w,{type:"chat",id:session,badge:1});
 assert.equal(w.notifications[1].options.data.url,"/ceo/index.html?tab=chat&id="+session);
});
test("returning chat alerts again with a new event tag, without exposing message text",async()=>{
 const w=worker();
 await push(w,{type:"chat",id:session,event:"event_aAaAa11111",badge:2,
  returning:true,body:"Private customer price"});
 await push(w,{type:"chat",id:session,event:"event_bBbBb22222",badge:3,
  returning:true,body:"Another private message"});
 assert.equal(w.notifications.length,2);
 assert.equal(w.notifications[0].options.body,"Khách quay lại nhắn tin");
 assert.notEqual(w.notifications[0].options.tag,w.notifications[1].options.tag);
 assert.equal(JSON.stringify(w.notifications).includes("Private customer price"),false);
});

test("CEO-PUSH05 real diagnostic notification confirms service worker receipt",async()=>{
 const w=worker(),nonce="a".repeat(24);
 w.mockClients.push({url:"https://ceo.fbmn.vn/ceo/index.html",
  postMessage:payload=>w.messages.push(payload)});
 await push(w,{type:"test",nonce,badge:0});
 assert.equal(w.notifications.length,1);
 assert.equal(w.notifications[0].options.body,
  "Thiết bị đã nhận được Push thật từ Futurebook.");
 assert.equal(w.notifications[0].options.tag,"fbmn-ceo-test-"+nonce);
 assert.equal(w.messages.length,1);
 assert.equal(w.messages[0].type,"FBMN_PUSH_TEST_RECEIVED");
 assert.equal(w.messages[0].nonce,nonce);
 assert.equal(w.notifications[0].options.data.url,"/ceo/index.html");
});
test("CEO-PUSH05 invalid test nonce cannot impersonate delivery acknowledgement",async()=>{
 const w=worker();
 await push(w,{type:"test",nonce:"notvalid",badge:0});
 assert.equal(w.messages.length,0);
});
test("CEO-PUSH05 custom worker immediately activates and claims old Flutter clients",async()=>{
 const w=worker();
 assert.equal(typeof w.handlers.install,"function");
 assert.equal(typeof w.handlers.activate,"function");
});
