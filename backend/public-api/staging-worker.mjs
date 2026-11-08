import { createPublicApi } from "./handler.mjs";
import { createReadModel, PUBLIC_READ_QUERIES } from "./read-model.mjs";

const ALLOWED_SQL = new Set(Object.values(PUBLIC_READ_QUERIES));
const ROUTES = new Set(["/v1/public/categories", "/v1/public/products", "/v1/public/catalog", "/v1/public/content"]);
// Owner-approved single decorative image. This Worker binding is in the same
// Cloudflare account as the private fbmn R2 bucket. Never accept caller keys.
const DECORATIVE_ROUTE = "/v1/public/decorative-background";
const DECORATIVE_KEY = "banners/G04/backdrop-v1.webp";
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
      const model = createReadModel(async (sql,args=[])=>{
        if (!ALLOWED_SQL.has(sql)) throw new Error("Unapproved SQL");
        return (await client.query(sql,args)).rows;
      },{enableP5:env.PUBLIC_P5_ENABLED==="true"});
      return await read(model);
    } finally {
      await client.end();
    }
  }
  return {
    async fetch(request,env) {
      const requiredRole=env?.PUBLIC_P5_ENABLED==="true" ? "fbmn_p5_public_login" : "fbmn_public_http_staging";
      if (!env?.HYPERDRIVE?.connectionString ||
          typeof env.RATE_LIMITER?.limit !== "function" ||
          env.EXPECTED_DB_ROLE !== requiredRole ||
          typeof env.PUBLIC_ALLOWED_ORIGINS !== "string") return error(503,"service_unavailable");
      const url=new URL(request.url);
      const isDecorative=url.pathname===DECORATIVE_ROUTE;
      const isImage=url.pathname==="/v1/public/image"||isDecorative;
      // Vercel's image proxy pools many visitors behind a small number of
      // egress IPs. Use a separate bounded per-image budget for public WebP,
      // never spoofable X-Forwarded-For. Other API traffic keeps its old limit.
      if(isImage&&typeof env.IMAGE_RATE_LIMITER?.limit!=="function")
        return error(503,"service_unavailable");
      let rate;
      try {
        const actor=(request.headers.get("CF-Connecting-IP")||"unknown").slice(0,100);
        const key=isImage?"media:"+actor+":"+(isDecorative?"g04-backdrop":url.searchParams.get("id")?.slice(0,40)):
          actor+":"+(ROUTES.has(url.pathname)?url.pathname:"other");
        rate=await (isImage?env.IMAGE_RATE_LIMITER:env.RATE_LIMITER).limit({key});
      } catch {
        return error(503,"service_unavailable");
      }
      if (rate?.success !== true) return error(429,"rate_limited");
      try {
        const origins=env.PUBLIC_ALLOWED_ORIGINS.split(",").map(s=>s.trim()).filter(Boolean);
        if(isDecorative){
          const origin=request.headers.get("Origin");
          if(origin&&!origins.includes(origin))return error(403,"origin_forbidden");
          if(request.method!=="GET")return error(405,"method_not_allowed");
          if(url.searchParams.size!==0)return error(400,"invalid_query");
          if(typeof env.PUBLIC_MEDIA_R2?.get!=="function")return error(503,"service_unavailable");
          // No SQL, user-supplied path, or bucket listing: exact approved key only.
          const image=await env.PUBLIC_MEDIA_R2.get(DECORATIVE_KEY);
          if(!image||!image.body||image.size<16||image.size>5*1024*1024||
              image.httpMetadata?.contentType!=="image/webp")
            return error(404,"not_found");
          return new Response(image.body,{status:200,headers:{
            "Content-Type":"image/webp",
            "Content-Length":String(image.size),
            "Cache-Control":"no-store",
            "X-Content-Type-Options":"nosniff",
            "Cross-Origin-Resource-Policy":"same-origin"
          }});
        }
        if(url.pathname==="/v1/public/image"){
          if(request.method!=="GET"||!env.PUBLIC_MEDIA_R2?.get||env.PUBLIC_P5_ENABLED!=="true")
            return error(404,"not_found");
          const origin=request.headers.get("Origin");
          if(origin&&!origins.includes(origin))return error(403,"origin_forbidden");
          if(url.searchParams.size!==1||url.searchParams.getAll("id").length!==1)
            return error(400,"invalid_query");
          const assetId=url.searchParams.get("id")||"";
          if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(assetId))
            return error(400,"invalid_query");
          const key=await readModel(env,m=>m.getPublicImageKey(assetId));
          if(!key)return error(404,"not_found");
          const image=await env.PUBLIC_MEDIA_R2.get(key);
          if(!image||image.size>5*1024*1024)return error(404,"not_found");
          return new Response(image.body,{status:200,headers:{
            "Content-Type":"image/webp","Cache-Control":"no-store",
            "X-Content-Type-Options":"nosniff",
            "Cross-Origin-Resource-Policy":"same-origin"
          }});
        }
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
