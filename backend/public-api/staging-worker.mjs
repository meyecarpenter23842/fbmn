import { createPublicApi } from "./handler.mjs";
import { createReadModel, PUBLIC_READ_QUERIES } from "./read-model.mjs";

const ALLOWED_SQL = new Set(Object.values(PUBLIC_READ_QUERIES));
const ROUTES = new Set(["/v1/public/categories", "/v1/public/products", "/v1/public/content"]);
const error = (status,code) => new Response(JSON.stringify({error:{code,message:"Yêu cầu không thể xử lý."}}),
  {status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});

export function createStagingWorker({createDbClient}) {
  if (typeof createDbClient !== "function") throw new Error("Missing DB driver");
  async function readModel(env,read) {
    const client = createDbClient({connectionString:env.HYPERDRIVE.connectionString,
      connectionTimeoutMillis:3500,query_timeout:3500,statement_timeout:3500});
    try {
      await client.connect();
      const identity = await client.query("SELECT current_user AS role_name");
      if (identity.rows?.length !== 1 || identity.rows[0].role_name !== env.EXPECTED_DB_ROLE) {
        throw new Error("Unsafe database role");
      }
      const model = createReadModel(async sql=>{
        if (!ALLOWED_SQL.has(sql)) throw new Error("Unapproved SQL");
        return (await client.query(sql)).rows;
      });
      return await read(model);
    } finally {
      await client.end();
    }
  }
  return {
    async fetch(request,env) {
      if (!env?.HYPERDRIVE?.connectionString ||
          typeof env.RATE_LIMITER?.limit !== "function" ||
          env.EXPECTED_DB_ROLE !== "fbmn_public_http_staging" ||
          typeof env.PUBLIC_ALLOWED_ORIGINS !== "string") return error(503,"service_unavailable");
      const url=new URL(request.url);
      let rate;
      try {
        const actor=request.headers.get("CF-Connecting-IP")||"unknown";
        rate=await env.RATE_LIMITER.limit({
          key:actor.slice(0,100)+":"+(ROUTES.has(url.pathname)?url.pathname:"other")
        });
      } catch {
        return error(503,"service_unavailable");
      }
      if (rate?.success !== true) return error(429,"rate_limited");
      try {
        const origins=env.PUBLIC_ALLOWED_ORIGINS.split(",").map(s=>s.trim()).filter(Boolean);
        const api=createPublicApi({
          getPublicCatalog:()=>readModel(env,m=>m.getPublicCatalog()),
          getPublicContent:()=>readModel(env,m=>m.getPublicContent()),
          allowedOrigins:origins,
        });
        return await api.fetch(request);
      } catch {
        return error(503,"service_unavailable");
      }
    },
  };
}
