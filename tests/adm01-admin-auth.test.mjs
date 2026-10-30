import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createAdminApi } from "../backend/admin-api/handler.mjs";

const origin="https://admin-staging.example.test";
const actor=(role,channels=["public_web"])=>({role,enabled:true,channels});
function make(options={}) {
  const audit=[];
  let revoked=false;
  const api=createAdminApi({
    allowedOrigins:[origin],
    verifyToken:async token=>{if(token!=="signed.test.token")throw Error("invalid signature");return "user-01";},
    loadActor:async()=>revoked?null:actor("editor"),
    listChannels:async()=>[{code:"public_web",label:"Website"}],
    recordAudit:async event=>{audit.push(event);},
    ...options,
  });
  const hit=(path,init={})=>api.fetch(new Request("https://admin.invalid"+path,{
    ...init,headers:{Authorization:"Bearer signed.test.token",...init.headers},
  }));
  return {hit,audit,revoke:()=>{revoked=true;}};
}
test("401 missing/invalid bearer; 403 missing DB allowlist",async()=>{
  const f=make();
  assert.equal((await f.hit("/v1/admin/session",{headers:{Authorization:""}})).status,401);
  assert.equal((await f.hit("/v1/admin/session",{headers:{Authorization:"Bearer spoofed.payload.sig"}})).status,401);
  assert.equal((await make({loadActor:async()=>null}).hit("/v1/admin/session")).status,403);
  assert.equal((await make({loadActor:async()=>actor("admin")}).hit("/v1/admin/session")).status,200);
});
test("Server RBAC blocks self elevation and routes by role",async()=>{
  const editor=make();
  assert.equal((await editor.hit("/v1/admin/publish-capability")).status,403);
  assert.equal((await editor.hit("/v1/admin/pricing-capability")).status,403);
  assert.equal((await editor.hit("/v1/admin/publish-capability",{headers:{"X-Role":"admin"}})).status,403);
  const pub=make({loadActor:async()=>actor("publisher")});
  assert.equal((await pub.hit("/v1/admin/publish-capability")).status,200);
  assert.equal((await pub.hit("/v1/admin/pricing-capability")).status,403);
  assert.equal((await make({loadActor:async()=>actor("pricing")}).hit("/v1/admin/pricing-capability")).status,200);
  assert.equal((await make({loadActor:async()=>actor("admin")}).hit("/v1/admin/publish-capability")).status,200);
});
test("Revoke is immediate on next lookup, scopes and audit are server-owned",async()=>{
  const f=make();
  const res=await f.hit("/v1/admin/session");
  assert.equal(res.status,200);
  assert.deepEqual((await res.json()).data,{role:"editor",channels:["public_web"]});
  assert.equal(res.headers.get("cache-control"),"no-store");
  assert.equal((await f.hit("/v1/admin/channels")).status,200);
  assert.deepEqual(f.audit.map(a=>a.action),["session.read","channels.read"]);
  f.revoke();
  assert.equal((await f.hit("/v1/admin/session")).status,403);
  assert.deepEqual(f.audit.at(-1),{subject:"user-01",action:"session.read",outcome:"denied"});
});
test("Origin, query, method, private-only endpoints",async()=>{
  const f=make();
  assert.equal((await f.hit("/v1/admin/session",{headers:{Origin:"https://untrusted.invalid"}})).status,403);
  assert.equal((await f.hit("/v1/admin/session?role=admin")).status,400);
  assert.equal((await f.hit("/v1/admin/session",{method:"POST"})).status,405);
  assert.equal((await f.hit("/v1/admin/net-pricebook")).status,404);
  assert.equal((await f.hit("/v1/admin/channels",{method:"OPTIONS",headers:{Origin:origin}})).status,204);
  assert.equal((await f.hit("/v1/admin/channels",{method:"OPTIONS",headers:{Origin:"https://untrusted.invalid"}})).status,403);
});
test("Any audit outage or DB outage fails closed; disabled principal denied",async()=>{
  assert.equal((await make({recordAudit:async()=>{throw Error("db");}}).hit("/v1/admin/session")).status,503);
  assert.equal((await make({loadActor:async()=>{throw Error("db");}}).hit("/v1/admin/session")).status,503);
  assert.equal((await make({loadActor:async()=>({...actor("admin"),enabled:false})}).hit("/v1/admin/session")).status,403);
});
test("Migration gate and isolated API contract",()=>{
  const up=readFileSync(new URL("../backend/neon/migrations/20261029_adm01_admin_foundation.up.sql",import.meta.url),"utf8");
  const down=readFileSync(new URL("../backend/neon/migrations/20261029_adm01_admin_foundation.down.sql",import.meta.url),"utf8");
  assert.match(up,/CREATE SCHEMA fbmn_admin/);
  assert.match(up,/CREATE ROLE fbmn_admin_runtime NOLOGIN/);
  assert.match(up,/GRANT SELECT ON fbmn_admin.channels,fbmn_admin.principals/);
  assert.doesNotMatch(up,/GRANT (INSERT|UPDATE|DELETE) ON fbmn_admin.principals/);
  assert.match(up,/principal_channels/);
  assert.match(up,/audit_events/);
  assert.match(down,/fbmn.rollback_confirmed/);
  assert.match(down,/DROP SCHEMA fbmn_admin/);
  const publicContract=JSON.parse(readFileSync(new URL("../backend/public-api/openapi.json",import.meta.url),"utf8"));
  assert.ok(Object.keys(publicContract.paths).every(path=>path.startsWith("/v1/public/")));
});


test("Admin Cloudflare config is staging-only, least-privilege and does not cache grants",()=>{
  const jsonc=readFileSync(new URL("../backend/admin-api/wrangler.jsonc",import.meta.url),"utf8");
  const conf=JSON.parse(jsonc.slice(jsonc.indexOf("{")));
  assert.equal(conf.name,"futurebook-mien-nam-admin-api-staging");
  assert.equal(conf.workers_dev,true);
  assert.equal(conf.routes,undefined);
  assert.deepEqual(conf.hyperdrive,[{binding:"ADMIN_HYPERDRIVE",id:"fb85a0f952de42f4a21cd8e3c7a9bf8b"}]);
  assert.equal(conf.vars.EXPECTED_ADMIN_DB_ROLE,"fbmn_admin_http_staging");
  assert.ok(conf.vars.ADMIN_ALLOWED_ORIGINS.includes("fbmn-admin-g19nfukpu-alibaba240185.vercel.app"));
  assert.ok(conf.vars.NEON_AUTH_JWKS_URL.startsWith("https://"));
  assert.ok(conf.vars.NEON_AUTH_JWKS_URL.endsWith("/.well-known/jwks.json"));
  assert.match(conf.vars.NEON_AUTH_ISSUER,/^https:\/\//);
  assert.ok(conf.vars.NEON_AUTH_AUDIENCE);
  assert.equal(conf.ratelimits[0].name,"ADMIN_RATE_LIMITER");
  assert.equal(conf.ratelimits[0].simple.period,60);
  assert.ok(conf.ratelimits[0].simple.limit<=60);
});

test("Owner is the top-most distinct role and cannot be created by a public Admin API",async()=>{
  const owner=make({loadActor:async()=>actor("owner",[]),listChannels:async()=>[{code:"public_web",label:"Website"}]});
  const session=await owner.hit("/v1/admin/session");
  assert.equal(session.status,200);
  assert.deepEqual((await session.json()).data,{role:"owner",channels:["public_web","dealer_app","consumer_app"]});
  assert.equal((await owner.hit("/v1/admin/pricing-capability")).status,200);
  assert.equal((await owner.hit("/v1/admin/publish-capability")).status,200);
  assert.equal((await owner.hit("/v1/admin/create-owner",{method:"POST"})).status,404);
  assert.equal((await make({loadActor:async()=>({...actor("owner"),enabled:false})}).hit("/v1/admin/session")).status,403);
  const migration=readFileSync(new URL("../backend/neon/migrations/20261030_adm01_owner_staging.up.sql",import.meta.url),"utf8");
  assert.match(migration,/ALTER TYPE fbmn_admin.admin_role ADD VALUE IF NOT EXISTS 'owner'/);
  const indexMigration=readFileSync(new URL("../backend/neon/migrations/20261030_adm01_owner_staging_index.up.sql",import.meta.url),"utf8");
  assert.match(indexMigration,/CREATE UNIQUE INDEX IF NOT EXISTS principals_single_owner_idx/);
  assert.match(indexMigration,/AFTER migration/);
  assert.doesNotMatch(migration,/enabled\s*=\s*true/i);
});
