import test from "node:test";
import assert from "node:assert/strict";
import {createStagingWorker} from "../backend/public-api/staging-worker.mjs";
const url="https://worker.example.test/v1/public/outsourcing-requests";
function env(overrides={}){return {
 HYPERDRIVE:{connectionString:"postgresql://stub"},PUBLIC_P5_ENABLED:"true",
 EXPECTED_DB_ROLE:"fbmn_p5_public_login",PUBLIC_DL6_ENABLED:"true",
 PUBLIC_ALLOWED_ORIGINS:"https://fbmn-web.vercel.app",
 RATE_LIMITER:{limit:async()=>({success:true})},
 OUTSOURCING_RATE_LIMITER:{limit:async()=>({success:false})},
 ...overrides};}
const request=()=>new Request(url,{method:"POST",headers:{"Origin":"https://fbmn-web.vercel.app","CF-Connecting-IP":"203.0.113.2","Content-Type":"application/json"},
 body:JSON.stringify({name:"Nguyễn A",email:"a@example.com",phone:"",productType:"Tập vở",
 specifications:"",quantity:"",desiredDate:"",details:"Hỏi về gia công tập vở theo yêu cầu.",consent:true,website:"",startedAt:Date.now()-5000})});
test("DL6 Worker denies without dedicated intake rate limiter, never touches DB",async()=>{
 let connections=0;const worker=createStagingWorker({createDbClient:()=>{connections++;throw Error("never");}});
 const response=await worker.fetch(request(),env({OUTSOURCING_RATE_LIMITER:undefined}));
 assert.equal(response.status,503);assert.equal(connections,0);
});
test("DL6 Worker checks strict dedicated intake limit before database",async()=>{
 let connections=0;const worker=createStagingWorker({createDbClient:()=>{connections++;throw Error("never");}});
 const response=await worker.fetch(request(),env());
 assert.equal(response.status,429);assert.equal(connections,0);
});
