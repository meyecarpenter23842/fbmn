import {test} from "node:test";
import assert from "node:assert/strict";
import {approveCommand,checksGreen,latestReview} from "../authorize-ceo-issue-deploy.mjs";
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
