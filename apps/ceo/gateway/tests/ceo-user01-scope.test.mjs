import test from "node:test";
import assert from "node:assert/strict";
import {ceoScope,canAccessCeo} from "../lib/ceo-user01-scope.mjs";
const url=path=>"https://ceo.fbmn.vn"+path;
test("USER01 CEO permissions match exact routes and methods",()=>{
 assert.equal(ceoScope(url("/api/ceo/session")),"ceo.any");
 assert.equal(ceoScope(url("/api/ceo/mail"),"GET"),"ceo.mail.read");
 assert.equal(ceoScope(url("/api/ceo/mail"),"POST"),"ceo.mail.send");
 assert.equal(ceoScope(url("/api/ceo/statistics")),"ceo.statistics");
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
