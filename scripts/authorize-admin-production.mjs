/** Authorize a comment-triggered, Owner-only Admin PRODUCTION release.
 * Runs on trusted main without Vercel credentials; never executes PR content.
 */
import {appendFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

function requireThat(ok,message){if(!ok)throw new Error(message);}
const hash=value=>typeof value==="string"&&/^[a-f0-9]{40}$/i.test(value);
export async function authorizeAdminProduction(env,fetcher=fetch,expectedCommand="/deploy admin production"){
  const {GH_TOKEN,GITHUB_REPOSITORY:repo,GITHUB_REPOSITORY_OWNER:owner,
    ISSUE_NUMBER:number,REQUESTED_BY:user,DEPLOY_COMMAND:command,GITHUB_OUTPUT:output}=env;
  requireThat(GH_TOKEN&&repo&&owner&&number&&output,"Missing authorization context");
  requireThat(repo===owner+"/fbmn","Wrong repository");
  requireThat(user?.toLowerCase()===owner.toLowerCase(),"Only repository owner may deploy");
  requireThat(command===expectedCommand,"Unsupported deployment command");
  requireThat(/^\d+$/.test(number),"Invalid pull request number");
  async function get(path){
    const response=await fetcher("https://api.github.com/"+path,{
      headers:{Authorization:"Bearer "+GH_TOKEN,Accept:"application/vnd.github+json",
        "X-GitHub-Api-Version":"2022-11-28"},
    });
    requireThat(response.ok,"GitHub release check HTTP "+response.status);
    return response.json();
  }
  const pr=await get("repos/"+repo+"/pulls/"+number);
  requireThat(pr.merged===true&&pr.state==="closed","Production requires an already merged PR");
  requireThat(pr.base?.repo?.full_name===repo&&pr.base?.ref==="main"&&
    pr.head?.repo?.full_name===repo,"Unexpected base or fork PR");
  requireThat(pr.user?.login?.toLowerCase()===owner.toLowerCase(),"PR must belong to repository owner");
  const reviewSha=pr.head.sha;
  requireThat(hash(reviewSha)&&hash(pr.merge_commit_sha),"Invalid reviewed or merge commit SHA");
  const main=await get("repos/"+repo+"/git/ref/heads/main");
  const sha=main.object?.sha;
  requireThat(hash(sha)&&sha===pr.merge_commit_sha,
    "This is not the latest merged PR on main");
  const runs=await get("repos/"+repo+"/actions/workflows/ci.yml/runs?head_sha="+sha+"&per_page=100");
  const matching=(runs.workflow_runs||[]).filter(r=>
    r.head_sha===sha&&r.event==="push"&&r.path?.endsWith("/ci.yml"))
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  requireThat(matching.length>0&&matching[0].status==="completed"&&
    matching[0].conclusion==="success","Latest main CI must be green");
  const summaries=[];
  for(let page=1;page<=100;page++){
    const list=await get("repos/"+repo+"/issues/"+number+"/comments?per_page=100&page="+page);
    requireThat(Array.isArray(list),"Invalid review summary response");
    for(const comment of list){
      if(comment.user?.login!=="chatgpt-codex-connector[bot]")continue;
      for(const match of (comment.body||"").matchAll(/<!-- codex-review-state:v1 (\{[^\n]+\}) -->/g)){
        try{
          const review=JSON.parse(match[1]).code_review;
          if(review?.commit_sha===reviewSha)summaries.push({
            review,updated:Date.parse(comment.updated_at||comment.created_at)||0,id:comment.id,
          });
        }catch{}
      }
    }
    if(list.length<100)break;
    requireThat(page<100,"Too many review comments to safely verify");
  }
  summaries.sort((a,b)=>a.updated-b.updated||a.id-b.id);
  const latest=summaries.at(-1)?.review;
  requireThat(latest?.status==="completed"&&
    latest?.has_any_findings===false&&latest?.has_unresolved_findings===false,
    "Latest Codex code review must be completed without findings");
  return {sha,pr_number:number,review_sha:reviewSha};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const release=await authorizeAdminProduction(process.env);
  appendFileSync(process.env.GITHUB_OUTPUT,"sha="+release.sha+"\npr_number="+release.pr_number+"\n");
  console.log("Authorized Admin production release "+release.sha.slice(0,12));
}
