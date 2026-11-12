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

function pushSession(store,{permission="granted",oldSubscription=false,configWait=null}={}){
 const calls=[],notices={prompts:0},registry={current:null};
 let subscription=oldSubscription?subscriptionObject():null;
 function subscriptionObject(){return {
  endpoint:"https://fcm.googleapis.com/fcm/send/mock",
  toJSON:()=>({endpoint:"https://fcm.googleapis.com/fcm/send/mock",
   keys:{auth:"x".repeat(22),p256dh:"y".repeat(87)}}),
  unsubscribe:async()=>{subscription=null;return true;}
 };}
 const notification={permission,requestPermission:()=>{
  notices.prompts++;notification.permission="granted";
  return Promise.resolve("granted");}};
 const registration={active:{scriptURL:"https://ceo.fbmn.vn/ceo/push-sw.js"},pushManager:{
  getSubscription:async()=>subscription,
  subscribe:async()=>{calls.push("subscribe");subscription=subscriptionObject();return subscription;}
 }};
 if(oldSubscription)registry.current=registration;
 const navigator={userAgent:"Chrome",platform:"Linux",maxTouchPoints:0,
  standalone:true,serviceWorker:{
   ready:Promise.resolve(registration),
   getRegistration:async()=>registry.current,
   register:async(url,opts)=>{calls.push("register:"+url);
    registry.current=registration;return registration;}
  }};
 const storage={
  getItem:key=>store.get(key)??null,
  setItem:(key,val)=>store.set(key,val),
  removeItem:key=>store.delete(key)
 };
 const window={isSecureContext:true,PushManager:function(){},
  Notification:notification,navigator,localStorage:storage,
  location:{href:"https://ceo.fbmn.vn/ceo/index.html"},
  matchMedia:()=>({matches:false})};
 const fetch=async(url,opts)=>{
  calls.push(String(url)+" "+opts.method);
  if(url==="/api/auth/token")return {ok:true,json:async()=>({token:"aa.bb.cc"})};
  if(url==="/api/ceo/push/config"){
   if(configWait)await configWait;
   return {ok:true,json:async()=>({
   data:{vapidPublicKey:"a".repeat(87)}})}
  }
  if(url==="/api/ceo/push/subscription")return {ok:true,json:async()=>({data:{}})};
  throw Error("Unexpected request: "+url);
 };
 vm.runInNewContext(source,{window,navigator,Notification:notification,fetch,
  URL,clearTimeout,setTimeout,crypto:{getRandomValues:arr=>arr.fill(42)},
  atob:s=>Buffer.from(s,"base64").toString("binary"),Uint8Array});
 return {window,calls,notices,registry};
}
test("CEO-MAIL03 persistent push consent restores automatically after closing app",async()=>{
 const store=new Map();
 const initial=pushSession(store,{permission:"default"});
 assert.equal(await initial.window.fbmnPushEnable(),"enabled");
 assert.equal(initial.notices.prompts,1);
 assert.equal(store.get("fbmn-ceo-push-opt-in-v1"),"1");
 // A PWA or service-worker update may remove the registration between launches.
 const reopened=pushSession(store);
 assert.equal(await reopened.window.fbmnPushStatus(),"enabled");
 assert.equal(reopened.notices.prompts,0);
 assert.ok(reopened.calls.includes("register:/ceo/push-sw.js"));
 assert.ok(reopened.calls.some(x=>x.includes("/api/ceo/push/subscription POST")));
});
test("CEO-MAIL03 explicit Off stays off, but logout preserves preference for Owner relogin",async()=>{
 const store=new Map([["fbmn-ceo-push-opt-in-v1","1"]]);
 const owner=pushSession(store);
 assert.equal(await owner.window.fbmnPushStatus(),"enabled");
 assert.equal(await owner.window.fbmnPushLogout(),"disabled");
 assert.equal(store.get("fbmn-ceo-push-opt-in-v1"),"1");
 const relogin=pushSession(store);
 assert.equal(await relogin.window.fbmnPushStatus(),"enabled");
 assert.equal(await relogin.window.fbmnPushDisable(),"disabled");
 assert.equal(store.has("fbmn-ceo-push-opt-in-v1"),false);
 const newLaunch=pushSession(store);
 assert.equal(await newLaunch.window.fbmnPushStatus(),"disabled");
 assert.equal(newLaunch.calls.length,0);
});
test("CEO-MAIL03 pre-upgrade subscriptions are adopted and denied browser permissions stay denied",async()=>{
 const store=new Map();
 const legacy=pushSession(store,{oldSubscription:true});
 assert.equal(await legacy.window.fbmnPushStatus(),"enabled");
 assert.equal(store.get("fbmn-ceo-push-opt-in-v1"),"1");
 const blocked=pushSession(store,{permission:"denied"});
 assert.equal(await blocked.window.fbmnPushStatus(),"denied");
 assert.equal(blocked.calls.length,0);
});

test("CEO-MAIL03 logout invalidates a pending startup restore before it subscribes",async()=>{
 const store=new Map([["fbmn-ceo-push-opt-in-v1","1"]]);
 let release;
 const block=new Promise(resolve=>{release=resolve;});
 const app=pushSession(store,{configWait:block});
 const restoring=app.window.fbmnPushStatus();
 // The configuration request is still in-flight; logout revokes consent in this session.
 await Promise.resolve();
 assert.equal(await app.window.fbmnPushLogout(),"disabled");
 release();
 assert.equal(await restoring,"disabled");
 assert.equal(app.calls.includes("register:/ceo/push-sw.js"),false);
 assert.equal(app.calls.some(c=>c.includes("/api/ceo/push/subscription POST")),false);
});
test("CEO-MAIL03 explicit Off wins over concurrent status resubscription",async()=>{
 const store=new Map([["fbmn-ceo-push-opt-in-v1","1"]]);
 let release;
 const block=new Promise(resolve=>{release=resolve;});
 const app=pushSession(store,{configWait:block,oldSubscription:true});
 const restoring=app.window.fbmnPushStatus();
 await Promise.resolve();
 assert.equal(await app.window.fbmnPushDisable(),"disabled");
 release();
 assert.equal(await restoring,"disabled");
 assert.equal(store.has("fbmn-ceo-push-opt-in-v1"),false);
 assert.equal(app.calls.some(c=>c.includes("/api/ceo/push/subscription POST")),false);
});
