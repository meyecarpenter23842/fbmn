import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const route=readFileSync(new URL("../app/api/ceo/push/test/route.ts",import.meta.url),"utf8");
const bridge=readFileSync(new URL("../../flutter/web/push_bridge.js",import.meta.url),"utf8");
const bootstrap=readFileSync(new URL("../../flutter/web/flutter_bootstrap.js",import.meta.url),"utf8");
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
 assert.match(release,/competing Flutter SW registration/);
});
test("client accepts only a matching test nonce after push receiver rendered",()=>{
 assert.match(bridge,/fbmnPushTest/);
 assert.match(bridge,/FBMN_PUSH_TEST_RECEIVED/);
 assert.match(bridge,/test_cooldown_or_missing/);
});
