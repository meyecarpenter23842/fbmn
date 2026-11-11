import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=readFileSync(new URL("../../flutter/web/push_bridge.js",import.meta.url),"utf8");
test("Notification consent is requested directly on user gesture, before fetch",async()=>{
 const calls=[];
 const notification={permission:"default",requestPermission:()=>{calls.push("prompt");return Promise.resolve("denied")}};
 const window={isSecureContext:true,PushManager:function(){},Notification:notification,
  navigator:{standalone:true},matchMedia:()=>({matches:false})};
 const context={window,navigator:{userAgent:"Chrome",platform:"Linux",maxTouchPoints:0,
  standalone:true,serviceWorker:{getRegistration:async()=>null}},Notification:notification,
  fetch:async()=>{calls.push("fetch");throw Error("unexpected")}};
 vm.runInNewContext(source,context);
 const p=window.fbmnPushEnable();
 assert.deepEqual(calls,["prompt"]);
 assert.equal(await p,"denied");
});
test("iPhone Safari must install PWA before notifications",async()=>{
 const window={isSecureContext:true,PushManager:function(){},Notification:{permission:"default"},
  navigator:{standalone:false},matchMedia:()=>({matches:false})};
 const context={window,navigator:{userAgent:"iPhone",platform:"iPhone",maxTouchPoints:5,
  standalone:false,serviceWorker:{}},Notification:window.Notification};
 vm.runInNewContext(source,context);
 assert.equal(await window.fbmnPushEnable(),"ios_install");
});
