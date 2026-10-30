import { createRemoteJWKSet } from "jose";
import { verifyManagedNeonJwt } from "./verify-jwt.mjs";
import { Client } from "pg";
import { createAdminApi } from "./handler.mjs";

const ACCOUNT = "SELECT role::text AS role, enabled FROM fbmn_admin.principals WHERE auth_subject = $1";
const SCOPES = "SELECT channel_code FROM fbmn_admin.principal_channels WHERE auth_subject = $1 ORDER BY channel_code";
const CHANNELS = "SELECT code, label FROM fbmn_admin.channels ORDER BY code";
const AUDIT = "INSERT INTO fbmn_admin.audit_events (auth_subject, action, outcome) VALUES ($1, $2, $3)";
const unavailable = () => new Response(JSON.stringify({error:{code:"service_unavailable",message:"Yêu cầu không thể xử lý."}}),{
  status:503,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
});
function httpsUrl(input) {
  try { return typeof input === "string" && new URL(input).protocol === "https:"; }
  catch { return false; }
}
// This Worker is NOT the public API or the legacy B2B Auth Worker.
export function createAdminStagingWorker({ createDbClient = opts => new Client(opts), fetchJwks = createRemoteJWKSet }) {
  // Worker-instance cache keeps the remote JWKS resolver/key cooldown across requests.
  // Only configured URLs are accepted; prevent growth if stage config rotates.
  const jwksCache = new Map();
  return {
    async fetch(request, env) {
      if (!env?.ADMIN_HYPERDRIVE?.connectionString || env.EXPECTED_ADMIN_DB_ROLE !== "fbmn_admin_http_staging" ||
          !httpsUrl(env.NEON_AUTH_JWKS_URL) || !httpsUrl(env.NEON_AUTH_ISSUER) ||
          !httpsUrl(env.NEON_AUTH_AUDIENCE) || !env.ADMIN_ALLOWED_ORIGINS ||
          // Require an exact branch-scoped JWKS; no untrusted key sources.
          new URL(env.NEON_AUTH_AUDIENCE).origin !== env.NEON_AUTH_ISSUER ||
          env.NEON_AUTH_JWKS_URL !== env.NEON_AUTH_AUDIENCE.replace(/\/$/,"") + "/.well-known/jwks.json" ||
          typeof env.ADMIN_RATE_LIMITER?.limit !== "function") return unavailable();
      let limit;
      try { limit = await env.ADMIN_RATE_LIMITER.limit({ key: (request.headers.get("CF-Connecting-IP") || "unknown").slice(0,100) }); }
      catch { return unavailable(); }
      if (limit?.success !== true) return new Response(JSON.stringify({error:{code:"rate_limited",message:"Yêu cầu không thể xử lý."}}),{
        status:429,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
      });
      let jwks = jwksCache.get(env.NEON_AUTH_JWKS_URL);
      if (!jwks) {
        if (jwksCache.size >= 3) jwksCache.clear();
        jwks = fetchJwks(new URL(env.NEON_AUTH_JWKS_URL));
        jwksCache.set(env.NEON_AUTH_JWKS_URL, jwks);
      }
      const db = async work => {
        const client = createDbClient({
          connectionString: env.ADMIN_HYPERDRIVE.connectionString,
          connectionTimeoutMillis: 3500, query_timeout: 3500, statement_timeout: 3500
        });
        try {
          await client.connect();
          const result = await client.query("SELECT current_user AS role_name");
          if (result.rows?.[0]?.role_name !== env.EXPECTED_ADMIN_DB_ROLE) throw new Error("Unsafe database identity");
          return await work(client);
        } finally { await client.end(); }
      };
      const api = createAdminApi({
        allowedOrigins: env.ADMIN_ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean),
        verifyToken: token => verifyManagedNeonJwt(token, jwks, env.NEON_AUTH_ISSUER),
        loadActor: subject => db(async client => {
          const result = await client.query(ACCOUNT,[subject]);
          if (result.rows.length !== 1) return null;
          const scopes = await client.query(SCOPES,[subject]);
          return { role: result.rows[0].role, enabled:result.rows[0].enabled,
            channels:scopes.rows.map(r=>r.channel_code) };
        }),
        listChannels: (subject, isAdmin) => db(async client => {
          const rows = await client.query(CHANNELS);
          if (isAdmin) return rows.rows;
          const scopes = await client.query(SCOPES,[subject]);
          const permitted = new Set(scopes.rows.map(r=>r.channel_code));
          return rows.rows.filter(row=>permitted.has(row.code));
        }),
        recordAudit: ({subject,action,outcome}) => db(async client => { await client.query(AUDIT,[subject,action,outcome]); }),
      });
      return api.fetch(request);
    }
  };
}
