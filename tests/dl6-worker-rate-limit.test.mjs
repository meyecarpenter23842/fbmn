import test from "node:test";
import assert from "node:assert/strict";
import {createStagingWorker} from "../backend/public-api/staging-worker.mjs";
import {createIntakeProof} from "../lib/outsourcing/proxy-proof.ts";
const url="https://worker.example.test/v1/public/outsourcing-requests";
function env(overrides={}){return {
 HYPERDRIVE:{connectionString:"postgresql://stub"},PUBLIC_P5_ENABLED:"true",
 EXPECTED_DB_ROLE:"fbmn_p5_public_login",PUBLIC_DL6_ENABLED:"true",
 PUBLIC_ALLOWED_ORIGINS:"https://fbmn-web.vercel.app",
 RATE_LIMITER:{limit:async()=>({success:true})},
 OUTSOURCING_RATE_LIMITER:{limit:async()=>({success:false})},
 DL6_PROXY_SECRET:"a".repeat(64),
 ...overrides};}
const form=()=>({name:"Nguyễn A",email:"a@example.com",phone:"",productType:"Tập vở",
 specifications:"",quantity:"",desiredDate:"",details:"Hỏi về gia công tập vở theo yêu cầu.",consent:true,website:"",startedAt:Date.now()-5000});
async function request(visitor="198.51.100.5"){
 const body=JSON.stringify(form());
 const p=await createIntakeProof("a".repeat(64),visitor,body);
 return new Request(url,{method:"POST",headers:{"Origin":"https://fbmn-web.vercel.app",
 "CF-Connecting-IP":"203.0.113.2","Content-Type":"application/json",
 "X-FBMN-DL6-Visitor":p.visitor,"X-FBMN-DL6-Time":p.time,"X-FBMN-DL6-Signature":p.signature},body});
}
test("DL6 Worker denies without dedicated intake rate limiter, never touches DB",async()=>{
 let connections=0;const worker=createStagingWorker({createDbClient:()=>{connections++;throw Error("never");}});
 const response=await worker.fetch(await request(),env({OUTSOURCING_RATE_LIMITER:undefined}));
 assert.equal(response.status,503);assert.equal(connections,0);
});
test("DL6 Worker checks strict dedicated intake limit before database",async()=>{
 let connections=0;const worker=createStagingWorker({createDbClient:()=>{connections++;throw Error("never");}});
 const response=await worker.fetch(await request(),env());
 assert.equal(response.status,429);assert.equal(connections,0);
});
