import {test} from "node:test";
import assert from "node:assert/strict";
import {approveCommand,checksGreen,latestReview,needsCeoBuildChecks,ownerSyncProof} from "../scripts/authorize-ceo-issue-deploy.mjs";
const valid={repo:"meyecarpenter23842/fbmn",issue:"72",actor:"alibaba240185",command:"/deploy ceo production"};
test("Owner can deploy CEO only from Issue 72 with exact comment",()=>{
 assert.equal(approveCommand(valid),"production");
 assert.equal(approveCommand({...valid,command:"/deploy ceo preview"}),"preview");
 for(const p of [{issue:"71"},{actor:"stranger"},{pr:true},{command:"/deploy admin production"},
   {command:"/deploy ceo production\n"},{repo:"alibaba240185/fbmn"}])
  assert.throws(()=>approveCommand({...valid,...p}));
});
test("CI check latest state must be success for every required job",()=>{
 const names=["flutter","gateway"];
 const a=[{id:1,name:"flutter",status:"completed",conclusion:"success"},
  {id:2,name:"gateway",status:"completed",conclusion:"success"}];
 assert.equal(checksGreen(a,names),true);
 assert.equal(checksGreen(a.slice(0,1),names),false);
 assert.equal(checksGreen([...a,{id:3,name:"gateway",status:"in_progress"}],names),false);
});
test("Old Codex clean result cannot override newer running status",()=>{
 const sha="1".repeat(40);
 const c=(id,date,data)=>({id,updated_at:date,user:{login:"chatgpt-codex-connector[bot]"},
  body:"<!-- codex-review-state:v1 "+JSON.stringify({code_review:{commit_sha:sha,...data}})+" -->"});
 const clean={status:"completed",has_any_findings:false,has_unresolved_findings:false};
 const running={status:"running",has_any_findings:null,has_unresolved_findings:null};
 assert.equal(latestReview([c(1,"2026-11-11T00:00:00Z",clean),
  c(2,"2026-11-11T00:01:00Z",running)],sha).status,"running");
 assert.equal(latestReview([c(1,"2026-11-11T00:00:00Z",clean)],sha).has_any_findings,false);
 assert.equal(latestReview([c(1,"2026-11-11T00:00:00Z",clean)],"2".repeat(40)),undefined);
});

test("Path-filtered Flutter and gateway checks are needed only for CEO changes",()=>{
 assert.equal(needsCeoBuildChecks(["app/page.tsx","docs/roadmap.md"]),false);
 assert.equal(needsCeoBuildChecks(["apps/ceo/gateway/lib/owner-gate.ts"]),true);
 assert.equal(needsCeoBuildChecks([".github/workflows/dl12d-ceo-deploy.yml"]),true);
});

test("Trusted owner sync receipt must bind dev/main SHA and exact tree",()=>{
 const dev="1".repeat(40),tree="2".repeat(40),up="3".repeat(40);
 const payload="<!-- fbmn-ceo-sync-proof:v1 "+JSON.stringify({
  dev_sha:dev,upstream_sha:up,tree_sha:tree})+" -->";
 const valid={id:123,created_at:"2026-11-11T05:56:00Z",
  updated_at:"2026-11-11T05:56:00Z",user:{login:"meyecarpenter23842"},body:payload};
 assert.equal(ownerSyncProof([valid],dev,tree)?.upstream,up);
 assert.equal(ownerSyncProof([{...valid,user:{login:"stranger"}}],dev,tree),undefined);
 assert.equal(ownerSyncProof([valid],"4".repeat(40),tree),undefined);
 assert.equal(ownerSyncProof([valid],dev,"4".repeat(40)),undefined);
});
