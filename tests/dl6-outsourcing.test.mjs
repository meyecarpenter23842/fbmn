import test from "node:test";
import assert from "node:assert/strict";
import {validateOutsourcingRequest} from "../lib/outsourcing/validation.ts";
import {handleOutsourcingRequest} from "../backend/public-api/outsourcing-service.mjs";
const now=Date.now();
const draft={name:"Nguyễn Văn A",email:" A@Example.com ",phone:"",productType:"Tập vở",specifications:"A5",
 quantity:"",desiredDate:"",details:"Tôi muốn trao đổi quy cách và giá gia công.",consent:true,website:"",startedAt:now-5000};
test("DL6 validation normalizes valid contact without fabricating pricing",()=>{
 const r=validateOutsourcingRequest(draft,now);assert.equal(r.ok,true);
 if(r.ok){assert.equal(r.data.email,"a@example.com");assert.equal("netPrice" in r.data,false);}
});
test("DL6 consent, honeypot, time and extra fields are blocked",()=>{
 for(const change of [{consent:false},{website:"spam"},{startedAt:now-100},{netPrice:100}])
  assert.equal(validateOutsourcingRequest({...draft,...change},now).ok,false);
});
test("DL6 rejects oversized descriptions and invalid emails",()=>{
 assert.equal(validateOutsourcingRequest({...draft,details:"a".repeat(2001)},now).ok,false);
 assert.equal(validateOutsourcingRequest({...draft,email:"bad"},now).ok,false);
});
const url="https://api.example.test/v1/public/outsourcing-requests";
function req(body,origin="https://fbmn-web.vercel.app"){return new Request(url,{method:"POST",headers:{
 "Content-Type":"application/json","Origin":origin},body:JSON.stringify(body)});}
test("DL6 public intake fails closed and rejects untrusted origin",async()=>{
 const submit=async()=>{};
 assert.equal((await handleOutsourcingRequest({request:req(draft),enabled:false,allowedOrigins:["https://fbmn-web.vercel.app"],submit})).status,503);
 assert.equal((await handleOutsourcingRequest({request:req(draft,"https://evil.test"),enabled:true,allowedOrigins:["https://fbmn-web.vercel.app"],submit})).status,403);
});
test("DL6 accepts a valid request only after durable submit succeeds",async()=>{
 let calls=0;const submit=async data=>{calls++;assert.equal(data.email,"a@example.com");};
 const res=await handleOutsourcingRequest({request:req(draft),enabled:true,allowedOrigins:["https://fbmn-web.vercel.app"],submit});
 assert.equal(res.status,201);assert.deepEqual(await res.json(),{ok:true});assert.equal(calls,1);
});
test("DL6 failed storage never gives false success",async()=>{
 const res=await handleOutsourcingRequest({request:req(draft),enabled:true,allowedOrigins:["https://fbmn-web.vercel.app"],submit:async()=>{throw Error("db down");}});
 assert.equal(res.status,503);
});
