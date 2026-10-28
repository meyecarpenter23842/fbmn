/** Release authorizer. Executes on trusted main without Vercel secrets. */
import { appendFileSync } from "node:fs";

const {
  GH_TOKEN, GITHUB_REPOSITORY: repo, GITHUB_REPOSITORY_OWNER: owner,
  ISSUE_NUMBER: issueNumber, REQUESTED_BY: requester,
  DEPLOY_COMMAND: command, GITHUB_OUTPUT: output,
} = process.env;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
async function api(path) {
  const response = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`GitHub API error ${response.status} for ${path.split("?")[0]}`);
  return response.json();
}

assert(GH_TOKEN && repo && owner && issueNumber && output, "Required authorizer context missing");
assert(requester?.toLowerCase() === owner.toLowerCase(), "Only the repository owner can deploy");
assert(/^\d+$/.test(issueNumber), "Invalid issue number");
assert(["/deploy preview", "/deploy production"].includes(command), "Unsupported command");
assert(repo === `${owner}/fbmn`, "Unexpected repository");

const pr = await api(`repos/${repo}/pulls/${issueNumber}`);
assert(pr.base?.repo?.full_name === repo && pr.base?.ref === "main", "PR must target main");
assert(pr.head?.repo?.full_name === repo, "Fork PRs cannot deploy");
assert(pr.user?.login?.toLowerCase() === owner.toLowerCase(), "PR must belong to repository owner");

let sha;
let event;
let target;
if (command === "/deploy preview") {
  assert(pr.state === "open" && !pr.merged, "Preview requires an open PR");
  sha = pr.head.sha;
  event = "pull_request";
  target = "preview";
} else {
  assert(pr.merged === true, "Production requires merged PR");
  const main = await api(`repos/${repo}/git/ref/heads/main`);
  sha = main.object?.sha;
  event = "push";
  target = "production";
}
assert(/^[a-f\d]{40}$/i.test(sha), "Invalid SHA");

const data = await api(`repos/${repo}/actions/workflows/ci.yml/runs?head_sha=${sha}&per_page=100`);
const matching = (data.workflow_runs ?? [])
  .filter((run) => run.head_sha === sha && run.event === event)
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
assert(matching.length > 0, `No CI run for commit ${sha}`);
assert(matching[0].status === "completed" && matching[0].conclusion === "success", "Latest CI is not green");

appendFileSync(output, `sha=${sha}\ntarget=${target}\npr_number=${issueNumber}\n`);
console.log(`Release authorized for ${target} at ${sha.slice(0,12)}`);
