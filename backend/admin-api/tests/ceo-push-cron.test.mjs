import {test} from "node:test";
import assert from "node:assert/strict";
import {deliverScheduledPush} from "../ceo-push-cron.mjs";

test("scheduled push skips dispatch until secret is configured",async()=>{
 let calls=0;
 assert.equal(await deliverScheduledPush({},async()=>{calls++;throw Error("unexpected");}),false);
 assert.equal(await deliverScheduledPush({FBMN_CEO_PUSH_DISPATCH_SECRET:"short"},
   async()=>{calls++;throw Error("unexpected");}),false);
 assert.equal(calls,0);
});
test("cron calls only pinned CEO HTTPS endpoint with bearer secret",async()=>{
 const secret="x".repeat(40);
 const sent=[];
 assert.equal(await deliverScheduledPush({FBMN_CEO_PUSH_DISPATCH_SECRET:secret},
  async(url,opts)=>{
   sent.push({url,auth:opts.headers.Authorization,method:opts.method,redirect:opts.redirect});
   return {ok:true};
  }),true);
 assert.deepEqual(sent,[{url:"https://ceo.fbmn.vn/api/ceo/push/dispatch",
  auth:"Bearer "+secret,method:"GET",redirect:"error"}]);
});
test("cron HTTP failures surface without leaking secret",async()=>{
 const secret="s".repeat(40);
 await assert.rejects(()=>deliverScheduledPush({FBMN_CEO_PUSH_DISPATCH_SECRET:secret},
  async()=>({ok:false})),/unavailable/);
});
