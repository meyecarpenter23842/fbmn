import test from "node:test";
import assert from "node:assert/strict";
import {createAdminApi} from "../handler.mjs";
import {PERMISSIONS,ROLE_DEFAULTS,allowed,validStaffPayload} from "../user-permissions.mjs";
const subject="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const payload={email:"nhanvien@example.com",name:"Nhân viên Futurebook",role:"admin",enabled:true,
 permissions:[...ROLE_DEFAULTS.admin],channels:["public_web"]};
function api(actor){
 let saved=0;
 const database=async callback=>callback({query:async(sql,args)=>{
  if(sql.includes("user01_list_staff"))return {rows:[{users:[]}]};
  if(sql.includes("user01_save_staff")){saved++;return {rows:[{saved:{id:subject,revision:1}}]};}
  throw Error("unsupported SQL");
 }});
 const server=createAdminApi({
  allowedOrigins:["https://admin.fbmn.vn"], verifyToken:async()=>subject,
  loadActor:async()=>actor,listChannels:async()=>[],recordAudit:async()=>{},
  catalogueDb:database
 });
 const hit=(path,method="GET",body)=>server.fetch(new Request("https://admin.fbmn.vn"+path,{
  method,headers:{Authorization:"Bearer a.b.c",...(body?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 }));
 return {hit,count:()=>saved};
}
test("USER01 Admin can create another Admin, but not Owner",async()=>{
 const a=api({role:"admin",enabled:true,permissions:["admin.users.manage"],channels:[]});
 assert.equal((await a.hit("/v1/admin/users/preflight","POST",payload)).status,200);
 assert.equal((await a.hit("/v1/admin/users","POST",payload)).status,200);
 assert.equal(a.count(),1);
 assert.equal((await a.hit("/v1/admin/users","POST",{...payload,role:"owner"})).status,400);
 assert.equal(a.count(),1);
});
test("USER01 employee cannot elevate role or grant staff management",async()=>{
 const viewer=api({role:"viewer",enabled:true,permissions:["admin.catalogue.read"],channels:[]});
 assert.equal((await viewer.hit("/v1/admin/users")).status,403);
 const admin=api({role:"admin",enabled:true,permissions:["admin.users.manage"],channels:[]});
 assert.equal((await admin.hit("/v1/admin/users","POST",{...payload,role:"viewer"})).status,400);
 assert.equal((await admin.hit("/v1/admin/users","POST",{...payload,permissions:["unrecognised.scope"]})).status,400);
 assert.equal((await admin.hit("/v1/admin/users","POST",{...payload,permissions:["admin.users.manage","admin.users.manage"]})).status,400);
 assert.equal((await admin.hit("/v1/admin/users","PATCH",{...payload,revision:0})).status,400);
 assert.equal(admin.count(),0);
});
test("USER01 permissions are explicit, role presets are not implicit access",()=>{
 assert.ok(PERMISSIONS.some(p=>p.key==="ceo.mail.send"&&p.detail));
 assert.ok(PERMISSIONS.some(p=>p.key==="admin.users.manage"&&p.detail));
 assert.equal(validStaffPayload(payload),true);
 assert.equal(validStaffPayload({...payload,role:"owner"}),false);
 assert.equal(allowed({role:"admin",enabled:true,permissions:[]},"admin.users.manage"),false);
 assert.equal(allowed({role:"admin",enabled:true,permissions:["admin.users.manage"]},"admin.users.manage"),true);
 assert.equal(allowed({role:"editor",enabled:true,permissions:["admin.users.manage"]},"admin.users.manage"),false);
 assert.equal(allowed({role:"owner",enabled:true,permissions:[]},"ceo.mail.send"),true);
});
