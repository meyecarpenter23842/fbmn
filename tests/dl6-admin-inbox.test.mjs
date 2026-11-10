import test from "node:test";
import assert from "node:assert/strict";
import {handleOutsourcingRequests} from "../backend/admin-api/outsourcing-requests-service.mjs";
const url="https://api.example.test/v1/admin/website/outsourcing-requests";
test("DL6 inbox fails closed to non Owner",async()=>{
 const response=await handleOutsourcingRequests({request:new Request(url),actor:{role:"editor"},db:async()=>({})});
 assert.equal(response.status,403);
});
test("DL6 inbox rejects malformed id and status before DB",async()=>{
 const request=new Request(url,{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({operation:"delete",id:"not-a-uuid",expectedStatus:"new"})});
 const response=await handleOutsourcingRequests({request,actor:{role:"owner"},db:async()=>{throw Error("must not be called")}});
 assert.equal(response.status,400);
});
test("DL6 private inbox refuses unknown request methods and query keys",async()=>{
 const db=async()=>{throw Error("must not be called")};
 assert.equal((await handleOutsourcingRequests({request:new Request(url,{method:"PUT"}),actor:{role:"owner"},db})).status,405);
 assert.equal((await handleOutsourcingRequests({request:new Request(url+"?email=secret"),actor:{role:"owner"},db})).status,400);
});
