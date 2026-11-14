import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const source=readFileSync(new URL("../app/api/ceo/gsc/oauth/callback/route.ts",import.meta.url),"utf8");
const begin=source.indexOf("const htmlTemplate="),end=source.indexOf(";\nfunction confirm(",begin);
assert.ok(begin>=0&&end>begin);
const html=JSON.parse(source.slice(begin+"const htmlTemplate=".length,end));
const script=html.match(/<script nonce="__NONCE__">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);

function setup(fetch){
 let click;
 const message={textContent:""};
 const button={disabled:false,addEventListener:(name,listener)=>{
  assert.equal(name,"click");
  click=listener;
 }};
 let destination=null,historyCleared=false;
 const context={
  document:{getElementById(id){return id==="confirm"?button:message;}},
  fetch,
  history:{replaceState(a,b,path){
   assert.equal(path,"/api/ceo/gsc/oauth/callback");
   historyCleared=true;
  }},
  location:{replace(path){destination=path;}}
 };
 runInNewContext(script,context,{timeout:1000});
 return {click:()=>click(),button,message,destination:()=>destination,historyCleared:()=>historyCleared};
}

test("OAuth confirmation uses shared desktop/mobile control sizes and nonce CSP",()=>{
 assert.match(html,/--fb-control-height-compact:36px/);
 assert.match(html,/--fb-control-height-touch:44px/);
 assert.match(html,/--fb-control-font-size:13px/);
 assert.match(html,/--fb-control-radius:9px/);
 assert.match(html,/@media\(max-width:780px\)/);
 assert.match(source,/Content-Security-Policy/);
 assert.match(source,/script-src 'nonce-/);
 assert.match(source,/Cache-Control/);
 assert.match(source,/Referrer-Policy/);
});

test("OAuth confirmation needs click and recovers JWT from refreshed session",async()=>{
 const calls=[];
 const freshJwt="header.payload.signature";
 const fetch=async(url,options)=>{
  calls.push({url,options});
  if(url==="/api/auth/token")
   return {ok:false,status:401,json:async()=>({})};
  if(url==="/api/auth/get-session")
   return {ok:true,json:async()=>({data:{session:{access_token:freshJwt}}})};
  if(url==="/api/ceo/gsc/oauth/complete"){
   assert.equal(options.method,"POST");
   assert.equal(options.headers.Authorization,"Bearer "+freshJwt);
   assert.equal(options.credentials,"same-origin");
   assert.deepEqual(JSON.parse(options.body),{ticket:"__TICKET__"});
   return {ok:true,json:async()=>({status:"connected"})};
  }
  throw Error("unexpected URL "+url);
 };
 const ui=setup(fetch);
 assert.equal(ui.historyCleared(),true);
 assert.equal(calls.length,0,"No grant saved before explicit Owner click");
 await ui.click();
 assert.equal(calls.length,3);
 assert.equal(ui.destination(),"/ceo/index.html?tab=4&gsc=connected");
});

test("OAuth confirmation never saves without valid Owner JWT",async()=>{
 const calls=[];
 const fetch=async(url)=>{
  calls.push(url);
  if(url==="/api/auth/token")return {ok:false,status:401,json:async()=>({})};
  if(url==="/api/auth/get-session")return {ok:true,json:async()=>({session:null})};
  throw Error("Should not reach complete");
 };
 const ui=setup(fetch);
 await ui.click();
 assert.equal(ui.destination(),"/ceo/index.html?tab=4&gsc=login");
 assert.equal(calls.some(x=>x.includes("/complete")),false);
});

test("OAuth confirmation accepts refreshed camelCase session accessToken",async()=>{
 const token="header.payload.signature";
 const fetch=async(url,opts)=>{
  if(url==="/api/auth/token")return {ok:true,json:async()=>({data:{token:null}})};
  if(url==="/api/auth/get-session")return {ok:true,json:async()=>({session:{accessToken:token}})};
  if(url==="/api/ceo/gsc/oauth/complete"){
   assert.equal(opts.headers.Authorization,"Bearer "+token);
   return {ok:true,json:async()=>({status:"connected"})};
  }
  throw Error("Unexpected "+url);
 };
 const ui=setup(fetch);
 await ui.click();
 assert.equal(ui.destination(),"/ceo/index.html?tab=4&gsc=connected");
});
