import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {authorizeAdminProduction} from "../scripts/authorize-admin-production.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const sha="a".repeat(40),head="b".repeat(40);
const env={
  GH_TOKEN:"dummy-ci-token",GITHUB_REPOSITORY:"alibaba240185/fbmn",
  GITHUB_REPOSITORY_OWNER:"alibaba240185",ISSUE_NUMBER:"72",
  REQUESTED_BY:"alibaba240185",DEPLOY_COMMAND:"/deploy admin production",
  GITHUB_OUTPUT:"/dev/null",
};
const valid={
  pr:{merged:true,state:"closed",merge_commit_sha:sha,
    user:{login:"alibaba240185"},
    base:{repo:{full_name:"alibaba240185/fbmn"},ref:"main"},
    head:{repo:{full_name:"alibaba240185/fbmn"},sha:head}},
  main:{object:{sha}},
  ci:{workflow_runs:[{head_sha:sha,event:"push",path:".github/workflows/ci.yml",
    status:"completed",conclusion:"success",created_at:"2026-11-01T00:00:00Z"}]},
  comments:[{id:100,user:{login:"chatgpt-codex-connector[bot]"},
    updated_at:"2026-11-01T00:01:00Z",
    body:"<!-- codex-review-state:v1 "+JSON.stringify({code_review:{
      commit_sha:head,status:"completed",has_any_findings:false,has_unresolved_findings:false,
    }})+" -->"}],
};
function mock(patch={}){
  const f={...valid,...patch};
  return async function(url){
    let data;
    if(url.includes("/pulls/"))data=f.pr;
    else if(url.endsWith("/git/ref/heads/main"))data=f.main;
    else if(url.includes("/ci.yml/runs?"))data=f.ci;
    else if(url.includes("/issues/72/comments?"))data=f.comments;
    else throw new Error("Unexpected GitHub API path");
    return{ok:true,status:200,json:async()=>data};
  };
}
test("Owner can deploy only latest merged PR with passing main CI and clean exact-head review",async()=>{
  const result=await authorizeAdminProduction(env,mock());
  assert.deepEqual(result,{sha,pr_number:"72",review_sha:head});
});
test("Comment deployment rejects non-owner, wrong command and malicious PR number",async()=>{
  await assert.rejects(authorizeAdminProduction({...env,REQUESTED_BY:"someone-else"},mock()),/Only repository owner/);
  await assert.rejects(authorizeAdminProduction({...env,DEPLOY_COMMAND:"/deploy production"},mock()),/Unsupported deployment command/);
  await assert.rejects(authorizeAdminProduction({...env,ISSUE_NUMBER:"72; echo hacked"},mock()),/Invalid pull request/);
});
test("Comment deployment refuses unmerged, fork and stale PRs",async()=>{
  await assert.rejects(authorizeAdminProduction(env,mock({pr:{...valid.pr,merged:false}})),/already merged/);
  await assert.rejects(authorizeAdminProduction(env,mock({pr:{...valid.pr,head:{repo:{full_name:"outsider/fork"},sha:head}}})),/Unexpected base or fork/);
  await assert.rejects(authorizeAdminProduction(env,mock({main:{object:{sha:"c".repeat(40)}}})),/not the latest merged PR/);
});
test("Comment deployment fails closed on no CI or red CI",async()=>{
  await assert.rejects(authorizeAdminProduction(env,mock({ci:{workflow_runs:[]}})),/main CI must be green/);
  await assert.rejects(authorizeAdminProduction(env,mock({ci:{workflow_runs:[{...valid.ci.workflow_runs[0],conclusion:"failure"}]}})),/main CI must be green/);
});
test("Comment deployment rejects pending, older or unsuccessful review",async()=>{
  await assert.rejects(authorizeAdminProduction(env,mock({comments:[]})),/Latest Codex/);
  const pending={...valid.comments[0],body:"<!-- codex-review-state:v1 "+JSON.stringify({code_review:{
    commit_sha:head,status:"running",has_any_findings:null,has_unresolved_findings:null,
  }})+" -->"};
  await assert.rejects(authorizeAdminProduction(env,mock({comments:[pending]})),/Latest Codex/);
  const fail={...valid.comments[0],body:"<!-- codex-review-state:v1 "+JSON.stringify({code_review:{
    commit_sha:head,status:"completed",has_any_findings:true,has_unresolved_findings:true,
  }})+" -->"};
  await assert.rejects(authorizeAdminProduction(env,mock({comments:[fail]})),/Latest Codex/);
});
test("Workflow is owner-comment only, scopes production secret and targets separate Admin project",()=>{
  const yml=read(".github/workflows/admin-production-comment-deploy.yml");
  assert.match(yml,/on:\n  issue_comment:/);
  assert.match(yml,/github.event.issue.pull_request != null/);
  assert.match(yml,/github.event.comment.user.login == github.repository_owner/);
  assert.match(yml,/github.event.comment.body == '\/deploy admin production'/);
  assert.match(yml,/environment: production/);
  assert.match(yml,/VERCEL_PROJECT_ID: prj_zfE2VTQuZJkEgOzOfJdokQsk5VZS/);
  assert.doesNotMatch(yml,/prj_PlxssxAIqvTWCgOzX2SAc81dRCGq/);
  assert.match(yml,/secrets.VERCEL_TOKEN/);
  assert.match(yml,/--prod --skip-domain/);
  assert.match(yml,/vercel promote "\$STAGED_URL" --yes/);
  assert.match(yml,/main advanced: refusing to promote stale deployment/);
  assert.doesNotMatch(yml,/\bpush:\s*\n\s*branches:/);
  assert.doesNotMatch(yml,/--token=/);
});
