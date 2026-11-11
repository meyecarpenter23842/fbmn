/** Authorize only an Owner's CEO deploy comment on dedicated Issue #72. */
import {appendFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
const DEV="meyecarpenter23842/fbmn",UPSTREAM="alibaba240185/fbmn";
const COMMANDS=new Map([["/deploy ceo preview","preview"],["/deploy ceo production","production"]]);
const OWNERS=new Set(["meyecarpenter23842","alibaba240185"]);
const JOBS=["quality","Build isolated public API Worker (dry run only)",
"Build independent Admin frontend (dry run only)","Bundle Admin Worker (dry run only)","flutter","gateway"];
function requireCondition(value,message){if(!value)throw Error(message);}
export function approveCommand({repo,issue,actor,command,pr=false}){
 requireCondition(repo===DEV&&String(issue)==="72"&&!pr,"Only the CEO control Issue #72 is authorized");
 requireCondition(OWNERS.has(String(actor||"").toLowerCase()),"User not authorized");
 requireCondition(COMMANDS.has(command),"Unsupported CEO command");
 return COMMANDS.get(command);
}
export function checksGreen(runs,names=JOBS){
 const latest=new Map();
 for(const r of runs||[])if(r.name&&(!latest.has(r.name)||r.id>latest.get(r.name).id))latest.set(r.name,r);
 return names.every(n=>latest.get(n)?.conclusion==="success"&&latest.get(n)?.status==="completed");
}
export function needsCeoBuildChecks(filenames){
 return (filenames||[]).some(p=>p.startsWith("apps/ceo/")||
  [".github/workflows/dl12a-ceo.yml",".github/workflows/dl12d-ceo-deploy.yml",
   "docs/web-dl12a-ceo-flutter.md","docs/web-dl12d-ceo-vercel.md"].includes(p));
}
export function ownerSyncProof(comments,devSha,treeSha){
 const proofs=[];
 for(const c of comments||[]){
  // The verified receipt is issued by the development repository owner only.
  if(c.user?.login!=="meyecarpenter23842")continue;
  for(const m of (c.body||"").matchAll(/<!-- fbmn-ceo-sync-proof:v1 (\{[^\n]+\}) -->/g)){
   try{
    const p=JSON.parse(m[1]);
    if(p.dev_sha!==devSha||p.tree_sha!==treeSha||
      !/^[a-f0-9]{40}$/.test(p.upstream_sha||""))continue;
    proofs.push({upstream:p.upstream_sha,id:c.id||0,
      created:Date.parse(c.created_at)||0,updated:Date.parse(c.updated_at)||0});
   }catch{}
  }
 }
 proofs.sort((a,b)=>a.updated-b.updated||a.id-b.id);
 return proofs.at(-1);
}
export function latestReview(comments,sha){
 const out=[];
 for(const c of comments||[]){
  if(c.user?.login!=="chatgpt-codex-connector[bot]")continue;
  for(const m of (c.body||"").matchAll(/<!-- codex-review-state:v1 (\{[^\n]+\}) -->/g)){
   try{
    const review=JSON.parse(m[1]).code_review;
    if(review?.commit_sha===sha)out.push({review,t:Date.parse(c.updated_at||c.created_at)||0,id:c.id});
   }catch{}
  }
 }
 out.sort((a,b)=>a.t-b.t||a.id-b.id);
 return out.at(-1)?.review;
}
async function gh(token,path){
 const res=await fetch("https://api.github.com/"+path,{headers:{
  Authorization:"Bearer "+token,Accept:"application/vnd.github+json",
  "X-GitHub-Api-Version":"2022-11-28"},
  redirect:"error",signal:AbortSignal.timeout(15000)});
 requireCondition(res.ok,"GitHub API HTTP "+res.status);
 return res.json();
}
async function changedFiles(token,pr){
 const result=[];
 for(let page=1;page<=50;page++){
  const list=await gh(token,"repos/"+DEV+"/pulls/"+pr+"/files?per_page=100&page="+page);
  result.push(...list.map(x=>x.filename));
  if(list.length<100)return result;
 }
 throw Error("Too many PR files to authorize safely");
}
async function comments(token,pr){
 const all=[];
 for(let page=1;page<=50;page++){
  const group=await gh(token,"repos/"+DEV+"/issues/"+pr+"/comments?per_page=100&page="+page);
  all.push(...group);
  if(group.length<100)return all;
 }
 throw Error("Too many review comments");
}
export async function authorize(env=process.env){
 const token=env.GH_TOKEN;
 requireCondition(token&&env.GITHUB_REPOSITORY_OWNER==="meyecarpenter23842","Invalid trusted workflow context");
 const target=approveCommand({repo:env.GITHUB_REPOSITORY,issue:env.ISSUE_NUMBER,
  actor:env.REQUESTED_BY,command:env.DEPLOY_COMMAND,pr:env.IS_PULL_REQUEST==="true"});
 const issue=await gh(token,"repos/"+DEV+"/issues/72");
 requireCondition(issue.state==="open"&&!issue.pull_request,"Control issue closed");
 const devRef=await gh(token,"repos/"+DEV+"/git/ref/heads/main");
 const devSha=devRef.object?.sha;
 requireCondition(/^[a-f0-9]{40}$/.test(devSha||""),"Invalid dev main ref");
 if(env.EXPECTED_SHA)requireCondition(env.EXPECTED_SHA===devSha,
  "Approved SHA is stale: main advanced after authorization; comment again");
 const devCommit=await gh(token,"repos/"+DEV+"/git/commits/"+devSha);
 const tree=devCommit.tree?.sha;
 requireCondition(/^[a-f0-9]{40}$/.test(tree||""),"Invalid dev main tree");
 let upSha,proofType="live";
 try{
  const upRef=await gh(token,"repos/"+UPSTREAM+"/git/ref/heads/main");
  upSha=upRef.object?.sha;
  requireCondition(/^[a-f0-9]{40}$/.test(upSha||""),"Invalid upstream ref");
  const upCommit=await gh(token,"repos/"+UPSTREAM+"/git/commits/"+upSha);
  requireCondition(upCommit.tree?.sha===tree,"Development and upstream main trees differ");
 }catch(error){
  // The dev-repository GITHUB_TOKEN often cannot read the separate upstream
  // account. In that case, require a reviewed Owner-authenticated sync receipt
  // posted after direct verification of both repos (not merely a statement in PR).
  if(!/^GitHub API HTTP (403|404)$/.test(String(error?.message)))throw error;
  const proof=ownerSyncProof(await comments(token,72),devSha,tree);
  requireCondition(!!proof,"Cannot read upstream and no valid Owner sync receipt for this commit");
  upSha=proof.upstream;
  proofType="owner-verified-receipt";
 }
 const prs=await gh(token,"repos/"+DEV+"/commits/"+devSha+"/pulls?per_page=100");
 const reviewed=(prs||[]).find(p=>p.merged_at&&p.merge_commit_sha===devSha&&
  p.base?.ref==="main"&&p.base?.repo?.full_name===DEV&&p.head?.repo?.full_name===DEV);
 requireCondition(!!reviewed,"Latest dev main is not a reviewed PR merge");
 const head=reviewed.head.sha;
 const checks=await gh(token,"repos/"+DEV+"/commits/"+head+"/check-runs?per_page=100");
 const files=await changedFiles(token,reviewed.number);
 const ceoRelated=needsCeoBuildChecks(files);
 // CEO jobs are intentionally path-filtered. If they ran, their latest status
 // must be green; if source changed, both are mandatory. The deploy job will
 // rerun Flutter and gateway tests even after unrelated merges.
 const extra=(checks.check_runs||[]).filter(r=>r.name==="flutter"||r.name==="gateway")
   .map(r=>r.name);
 const needed=[...new Set([...JOBS.slice(0,4),...(ceoRelated?JOBS.slice(4):extra)])];
 requireCondition(checksGreen(checks.check_runs,needed),"Required PR checks not green");
 const mainRuns=await gh(token,"repos/"+DEV+"/actions/workflows/ci.yml/runs?head_sha="+devSha+"&event=push&per_page=20");
 const mainRun=(mainRuns.workflow_runs||[]).filter(r=>r.head_sha===devSha&&r.event==="push")
  .sort((a,b)=>b.id-a.id)[0];
 requireCondition(mainRun?.status==="completed"&&mainRun.conclusion==="success",
  "Latest dev main CI must be green");
 const review=latestReview(await comments(token,reviewed.number),head);
 requireCondition(review?.status==="completed"&&review.has_any_findings===false&&
  review.has_unresolved_findings===false,"Codex has outstanding findings");
 return {sha:devSha,tree,target,pr:reviewed.number,upstream:upSha,proofType};
}
async function run(){
 const out=await authorize();
 requireCondition(process.env.GITHUB_OUTPUT,"No workflow output file");
 appendFileSync(process.env.GITHUB_OUTPUT,
  "sha="+out.sha+"\ntarget="+out.target+"\npr="+out.pr+"\n");
 console.log("Approved CEO "+out.target+" SHA "+out.sha.slice(0,12)+" PR #"+out.pr+"; sync proof "+out.proofType);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await run();
