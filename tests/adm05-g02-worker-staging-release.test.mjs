import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {authorizeAdminProduction} from "../scripts/authorize-admin-production.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const workflow=read(".github/workflows/admin-worker-staging-comment-deploy.yml");
const guard=read("scripts/authorize-admin-worker-staging.mjs");
const production=read(".github/workflows/admin-production-comment-deploy.yml");
const wrangler=read("backend/admin-api/wrangler.jsonc");

test("Manual Admin Worker release is owner-only, staging-only and exact-green-commit only",()=>{
  assert.match(workflow,/github.event.comment.user.login == github.repository_owner/);
  assert.match(workflow,/github.event.comment.body == '\/deploy admin worker staging'/);
  assert.match(workflow,/authorize-admin-worker-staging\.mjs/);
  assert.match(workflow,/needs: authorize/);
  assert.match(workflow,/ref: \$\{\{ needs.authorize.outputs.sha \}\}/);
  assert.match(workflow,/main changed: refusing stale staging deployment/);
  assert.match(workflow,/npm install --prefix backend\/admin-api --no-audit --no-fund --no-package-lock/);
  assert.doesNotMatch(workflow,/npm ci --prefix backend\/admin-api/);
  assert.match(workflow,/npm run build:check --prefix backend\/admin-api/);
  assert.match(workflow,/wrangler deploy --config wrangler.jsonc/);
  assert.match(workflow,/CLOUDFLARE_API_TOKEN: \$\{\{ secrets.CLOUDFLARE_API_TOKEN \}\}/);
  assert.match(wrangler,/"name": "futurebook-mien-nam-admin-api-staging"/);
  assert.doesNotMatch(workflow,/vercel deploy|vercel promote|fbmn-web|backend\/public-api/);
  assert.match(guard,/authorizeAdminProduction\(process.env,fetch,"\/deploy admin worker staging"\)/);
  assert.match(production,/DEPLOY_COMMAND: \$\{\{ github.event.comment.body \}\}/);
});

test("Production guard rejects unknown command; staging command must be explicitly supplied",async()=>{
  const env={GH_TOKEN:"x",GITHUB_REPOSITORY:"alibaba240185/fbmn",
    GITHUB_REPOSITORY_OWNER:"alibaba240185",ISSUE_NUMBER:"91",
    REQUESTED_BY:"alibaba240185",DEPLOY_COMMAND:"/deploy admin worker staging",
    GITHUB_OUTPUT:"/tmp/unused"};
  await assert.rejects(authorizeAdminProduction(env),/Unsupported deployment command/);
  await assert.rejects(authorizeAdminProduction(
    {...env,DEPLOY_COMMAND:"/deploy admin production"},fetch,"/deploy admin worker staging"),
    /Unsupported deployment command/);
});
