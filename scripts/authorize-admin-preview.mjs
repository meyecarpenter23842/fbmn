/** A manual, owner-only Admin PREVIEW release authorization; never production. */
import { appendFileSync } from "node:fs";

const { GH_TOKEN, GITHUB_REPOSITORY: repo, GITHUB_REPOSITORY_OWNER: owner,
  ISSUE_NUMBER: number, REQUESTED_BY: user, DEPLOY_COMMAND: command,
  GITHUB_OUTPUT: output } = process.env;
function check(value, message) { if (!value) throw new Error(message); }
async function github(path) {
  const response = await fetch("https://api.github.com/" + path, {
    headers: { Authorization: "Bearer " + GH_TOKEN, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (!response.ok) throw new Error("GitHub request failed: " + response.status);
  return response.json();
}
check(GH_TOKEN && repo && owner && number && output, "Missing GitHub context");
check(repo === owner + "/fbmn", "Incorrect repository");
check(user?.toLowerCase() === owner.toLowerCase(), "Only repository owner may deploy");
check(command === "/deploy admin preview", "Unsupported command (Admin production is disabled)");
check(/^\d+$/.test(number), "Invalid PR");
const pr = await github(`repos/${repo}/pulls/${number}`);
check(pr.head?.repo?.full_name === repo && pr.base?.repo?.full_name === repo && pr.base?.ref === "main", "Unexpected target or fork");
check(pr.user?.login?.toLowerCase() === owner.toLowerCase(), "Unexpected PR author");
const reviewSha = pr.head.sha;
let sha, event;
if (pr.state === "open" && !pr.merged) {
  sha = reviewSha;
  event = "pull_request";
} else {
  check(pr.merged === true, "Preview requires open or merged PR");
  const main = await github(`repos/${repo}/git/ref/heads/main`);
  check(main.object?.sha === pr.merge_commit_sha, "Only latest merged PR can trigger main preview");
  sha = main.object.sha;
  event = "push";
}
check(/^[a-f0-9]{40}$/i.test(sha), "Invalid sha");
const runs = await github(`repos/${repo}/actions/workflows/ci.yml/runs?head_sha=${sha}&per_page=100`);
const matching = (runs.workflow_runs ?? []).filter(r => r.head_sha === sha && r.event === event)
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
check(matching[0]?.status === "completed" && matching[0]?.conclusion === "success", "Latest PR CI must be green");
// Review summary can be on any issue-comment page; do not trust just page 1.
const comments = [];
for (let page = 1; page <= 100; page++) {
  const batch = await github(`repos/${repo}/issues/${number}/comments?per_page=100&page=${page}`);
  comments.push(...batch.filter(c => c.user?.login === "chatgpt-codex-connector[bot]"));
  if (batch.length < 100) break;
  check(page < 100, "Too many comments to verify review safely");
}
// Gate on the LATEST state for this commit: an older clean review cannot override
// a newer pending/failed one. Bot summary comments can be updated in place.
const reviews = comments.flatMap(c => [...(c.body || "").matchAll(/<!-- codex-review-state:v1 (\{[^\n]+\}) -->/g)].map(m => {
  try { return { review: JSON.parse(m[1]).code_review, updated: Date.parse(c.updated_at || c.created_at) || 0, id: c.id }; }
  catch { return null; }
})).filter(entry => entry?.review?.commit_sha === reviewSha)
  .sort((a, b) => a.updated - b.updated || a.id - b.id);
const latestReview = reviews.at(-1)?.review;
check(latestReview?.status === "completed" && latestReview?.has_unresolved_findings === false,
  "Latest Codex review for exact head must finish with no unresolved findings");
appendFileSync(output, "sha=" + sha + "\npr_number=" + number + "\n");
console.log("Authorized Admin preview commit " + sha.slice(0, 12));
