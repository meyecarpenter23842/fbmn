import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const route=readFileSync(new URL("../app/api/ceo/push/test/route.ts",import.meta.url),"utf8");
const bridge=readFileSync(new URL("../../flutter/web/push_bridge.js",import.meta.url),"utf8");
const bootstrap=readFileSync(new URL("../../flutter/web/flutter_bootstrap.js",import.meta.url),"utf8");
import {safeCeoBootstrap} from "../scripts/check-ceo-push-bootstrap.mjs";
import {execFileSync} from "node:child_process";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
const release=readFileSync(new URL("../scripts/vercel-build-ceo.sh",import.meta.url),"utf8");
test("real Push test is Owner-only, exact subscribed endpoint, cooldown, no user content",()=>{
 assert.match(route,/requireOwner\(request\)/);
 assert.match(route,/allowedOrigin\(request\)/);
 assert.match(route,/UPDATE fbmn_catalog_private\.ceo_push_subscriptions/);
 assert.match(route,/owner_subject=\$2/);
 assert.match(route,/last_test_at<now\(\)-interval '60 seconds'/);
 assert.match(route,/webpush\.sendNotification/);
 assert.match(route,/urgency:"high"/);
 assert.doesNotMatch(route,/\.body\.message|userText|notifyAll/i);
});
test("Flutter bootstrap does not register a competing Service Worker",()=>{
 assert.match(bootstrap,/_flutter\.loader\.load\(\);/);
 assert.doesNotMatch(bootstrap,/serviceWorkerSettings/);
 assert.match(release,/--pwa-strategy=none/);
 assert.match(release,/check-ceo-push-bootstrap[.]mjs/);
});
test("client accepts only a matching test nonce after push receiver rendered",()=>{
 assert.match(bridge,/fbmnPushTest/);
 assert.match(bridge,/FBMN_PUSH_TEST_RECEIVED/);
 assert.match(bridge,/test_cooldown_or_missing/);
});

test("CEO-PUSH05 executable Vercel guard accepts real custom bootstrap and rejects legacy Flutter offline worker",()=>{
 assert.equal(safeCeoBootstrap(bootstrap),true);
 const oldFlutter=`_flutter.loader.load({
   serviceWorkerSettings: {serviceWorkerVersion: "123"}
 });`;
 assert.equal(safeCeoBootstrap(oldFlutter),false);
 assert.equal(safeCeoBootstrap("_flutter.loader.load();"),true);
 assert.equal(safeCeoBootstrap("unrelated JavaScript"),false);
 const path=fileURLToPath(new URL("../scripts/check-ceo-push-bootstrap.mjs",import.meta.url));
 const dir=mkdtempSync(join(tmpdir(),"ceo-push-bootstrap-"));
 try{
  const source=join(dir,"flutter_bootstrap.js");
  writeFileSync(source,bootstrap);
  assert.doesNotThrow(()=>execFileSync(process.execPath,[path,source]));
  writeFileSync(source,oldFlutter);
  assert.throws(()=>execFileSync(process.execPath,[path,source],
   {stdio:"pipe"}));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
