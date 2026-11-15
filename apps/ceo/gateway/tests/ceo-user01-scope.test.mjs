import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ceoScope,canAccessCeo} from "../lib/ceo-user01-scope.mjs";
const url=path=>"https://ceo.fbmn.vn"+path;
test("USER01 CEO permissions match exact routes and methods",()=>{
 assert.equal(ceoScope(url("/api/ceo/session")),"ceo.any");
 assert.equal(ceoScope(url("/api/ceo/mail"),"GET"),"ceo.mail.read");
 assert.equal(ceoScope(url("/api/ceo/mail"),"POST"),"ceo.mail.send");
 assert.equal(ceoScope(url("/api/ceo/statistics")),"ceo.statistics");
 assert.equal(ceoScope(url("/api/ceo/ads"),"GET"),"ceo.ads.read");
 assert.equal(ceoScope(url("/api/ceo/ads/drafts"),"POST"),"ceo.ads.draft");
 assert.equal(ceoScope(url("/api/ceo/ads/oauth/status"),"POST"),"ceo.ads.manage");
 assert.equal(ceoScope(url("/api/ceo/ads/oauth/callback"),"GET"),null);
 assert.equal(ceoScope(url("/api/ceo/contact-requests")),"ceo.contacts");
 assert.equal(ceoScope(url("/api/ceo/gsc/oauth/status"),"DELETE"),"ceo.gsc.manage");
 // Reads receipt scope is determined by validated JSON kind in the route.
 assert.equal(ceoScope(url("/api/ceo/reads"),"POST"),"ceo.notifications");
 for(const path of ["/api/ceo/random","/api/ceo/mail/webhook","/api/ceo/push/dispatch"]){
  assert.equal(ceoScope(url(path)) ,null,path);
 }
});
test("USER01 ungranted CEO scopes deny; Owner remains unrestricted",()=>{
 assert.equal(canAccessCeo("owner",[],null),true);
 assert.equal(canAccessCeo("admin",["ceo.mail.read"],"ceo.any"),true);
 assert.equal(canAccessCeo("admin",["ceo.mail.read"],"ceo.mail.read"),true);
 assert.equal(canAccessCeo("admin",["ceo.mail.read"],"ceo.mail.send"),false);
 assert.equal(canAccessCeo("ceo",[],"ceo.any"),false);
 assert.equal(canAccessCeo("viewer",["admin.catalogue.read"],"ceo.any"),false);
 assert.equal(canAccessCeo("admin",["ceo.mail.send"],null),false);
});

test("USER01 mail and chat receipts use validated per-kind grant; notifications GET stays separate",()=>{
 const alerts=readFileSync(new URL("../app/api/ceo/alerts/route.ts",import.meta.url),"utf8");
 assert.match(alerts,/kind==="mail"\?"ceo\.mail\.read":"ceo\.conversations"/);
 assert.match(alerts,/requireOwner\(request,scope\)/);
 assert.match(alerts,/validRef\(kind,id\)/);
 assert.match(alerts,/export async function GET\(request:Request\)\{\s*const owner=await requireOwner\(request\)/);
});
test("USER01 authorized SEO readers use the company GSC connection, rotating original grant",()=>{
 const report=readFileSync(new URL("../app/api/ceo/search-console/route.ts",import.meta.url),"utf8");
 const oauthStatus=readFileSync(new URL("../app/api/ceo/gsc/oauth/status/route.ts",import.meta.url),"utf8");
 const store=readFileSync(new URL("../lib/ceo-gsc-store.ts",import.meta.url),"utf8");
 assert.match(report,/requireOwner\(request\)/);
 assert.match(report,/owner\.role==="owner"/);
 assert.match(report,/readCompanyGscGrant\(config\.key\)/);
 assert.match(report,/saveGscGrant\(grant\.subject,rotated,config\.key\)/);
 assert.match(oauthStatus,/readCompanyGscGrant\(config\.key\)/);
 assert.match(oauthStatus,/await deleteGscGrant\(grant\.subject\)/);
 assert.match(oauthStatus,/revokeGoogleToken\(grant\.refreshToken\)/);
 assert.match(store,/ORDER BY updated_at DESC LIMIT 1/);
 assert.doesNotMatch(store,/NEXT_PUBLIC_|console\.log/);
});
