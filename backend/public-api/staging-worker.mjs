import { createPublicApi } from "./handler.mjs";
import { createReadModel, PUBLIC_READ_QUERIES } from "./read-model.mjs";
import { handlePublicCatalogueRequest } from "./catalogue-books-public.mjs";
import {handleContactRequest} from "./contact-service.mjs";
import {handleOutsourcingRequest} from "./outsourcing-service.mjs";
import {verifyIntakeProof} from "../../lib/outsourcing/proxy-proof.ts";

const ALLOWED_SQL = new Set(Object.values(PUBLIC_READ_QUERIES));
const ROUTES = new Set(["/v1/public/categories", "/v1/public/products", "/v1/public/catalog", "/v1/public/content", "/v1/public/cms", "/v1/public/home-layout", "/v1/public/category-display", "/v1/public/catalogue-books", "/v1/public/outsourcing-requests", "/v1/public/contact-requests"]);
// Owner-approved single decorative image. This Worker binding is in the same
// Cloudflare account as the private fbmn R2 bucket. Never accept caller keys.
const DECORATIVE_ROUTE = "/v1/public/decorative-background";
const CMS_IMAGE_ROUTE="/v1/public/cms/image";
const CATALOGUE_IMAGE_ROUTE="/v1/public/catalogue-image";
const CATALOGUE_PDF_ROUTE="/v1/public/catalogue-pdf";
const CATALOGUE_BOOKS_ROUTE="/v1/public/catalogue-books";
const OUTSOURCING_ROUTE="/v1/public/outsourcing-requests";
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
      const isCmsImage=url.pathname===CMS_IMAGE_ROUTE;
      const isCatalogueImage=url.pathname===CATALOGUE_IMAGE_ROUTE;
      const isCataloguePdf=url.pathname===CATALOGUE_PDF_ROUTE;
      const isCatalogueRequest=isCatalogueImage||isCataloguePdf||url.pathname===CATALOGUE_BOOKS_ROUTE;
      const isImage=url.pathname==="/v1/public/image"||isDecorative||isCmsImage||isCatalogueImage||isCataloguePdf;
      // Vercel's image proxy pools many visitors behind a small number of
      // egress IPs. Use a separate bounded per-image budget for public WebP,
      // never spoofable X-Forwarded-For. Other API traffic keeps its old limit.
      if(isImage&&typeof env.IMAGE_RATE_LIMITER?.limit!=="function")
        return error(503,"service_unavailable");
      let rate;
      try {
        const actor=(request.headers.get("CF-Connecting-IP")||"unknown").slice(0,100);
        const key=isImage?"media:"+actor+":"+(isDecorative?"g04-backdrop":
          (isCataloguePdf?url.searchParams.get("book"):isCatalogueImage?url.searchParams.get("asset"):url.searchParams.get("id"))?.slice(0,40)):
          actor+":"+(ROUTES.has(url.pathname)?url.pathname:"other");
        rate=await (isImage?env.IMAGE_RATE_LIMITER:env.RATE_LIMITER).limit({key});
      } catch {
        return error(503,"service_unavailable");
      }
      if (rate?.success !== true) return error(429,"rate_limited");
      try {
        const origins=env.PUBLIC_ALLOWED_ORIGINS.split(",").map(s=>s.trim()).filter(Boolean);
        if(url.pathname===OUTSOURCING_ROUTE){
          if(env.PUBLIC_DL6_ENABLED!=="true"||typeof env.OUTSOURCING_RATE_LIMITER?.limit!=="function"||
             !/^[0-9a-f]{64}$/.test(env.DL6_PROXY_SECRET||""))
            return error(503,"intake_unavailable");
          return handleOutsourcingRequest({request,enabled:true,allowedOrigins:origins,
            verifyProxy:(req,payload)=>verifyIntakeProof(env.DL6_PROXY_SECRET,req.headers,payload),
            limitVisitor:visitor=>env.OUTSOURCING_RATE_LIMITER.limit({key:"dl6:"+visitor}),
            submit:async data=>{
              const client=createDbClient({connectionString:env.HYPERDRIVE.connectionString,
                connectionTimeoutMillis:3500,query_timeout:3500,statement_timeout:3500});
              try{await client.connect();
                const identity=await client.query("SELECT current_user AS role_name");
                if(identity.rows?.[0]?.role_name!==env.EXPECTED_DB_ROLE)throw Error("Unsafe database role");
                await client.query("SELECT fbmn_public.submit_outsourcing_request($1,$2,$3,$4,$5,$6,$7,$8,$9)",
                  [data.name,data.email,data.phone,data.productType,data.specifications,
                   data.quantity,data.desiredDate,data.details,data.consent]);
              }finally{await client.end();}
            }});
        }
        if(url.pathname==="/v1/public/contact-requests"){
          if(env.PUBLIC_DL6_ENABLED!=="true"||typeof env.OUTSOURCING_RATE_LIMITER?.limit!=="function"||
             !/^[0-9a-f]{64}$/.test(env.DL6_PROXY_SECRET||""))
            return error(503,"intake_unavailable");
          return handleContactRequest({request,enabled:true,allowedOrigins:origins,
            verifyProxy:(req,payload)=>verifyIntakeProof(env.DL6_PROXY_SECRET,req.headers,payload),
            limitVisitor:visitor=>env.OUTSOURCING_RATE_LIMITER.limit({key:"dl9:"+visitor}),
            submit:async data=>{
              const client=createDbClient({connectionString:env.HYPERDRIVE.connectionString,
                connectionTimeoutMillis:3500,query_timeout:3500,statement_timeout:3500});
              try{await client.connect();
                const identity=await client.query("SELECT current_user AS role_name");
                if(identity.rows?.[0]?.role_name!==env.EXPECTED_DB_ROLE)throw Error("Unsafe database role");
                await client.query("SELECT fbmn_public.submit_contact_request($1,$2,$3,$4,$5,$6,$7,$8,$9)",
                  [data.name,data.email,data.phone,data.productType,data.specifications,
                   data.quantity,data.desiredDate,data.details,data.consent]);
              }finally{await client.end();}
            }});
        }
        if(isCatalogueRequest){
          return handlePublicCatalogueRequest({
            request,enabled:env.PUBLIC_DL7C_ENABLED==="true",
            pdfEnabled:env.PUBLIC_DL7A_PDF_ENABLED==="true",allowedOrigins:origins,r2:env.CATALOGUE_MEDIA_R2,
            listBooks:()=>readModel(env,m=>m.getReadyCatalogueBooks()),
            getSettings:()=>readModel(env,m=>m.getCatalogueViewerSettings()),
            getBook:id=>readModel(env,m=>m.getReadyCatalogueBook(id)),
            getAssets:id=>readModel(env,m=>m.getReadyCatalogueAssets(id)),
            getKey:id=>readModel(env,m=>m.getReadyCatalogueAssetKey(id)),
            getPdf:(id,download)=>readModel(env,m=>m.getReadyCataloguePdf(id,download)),
          });
        }
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
        if(isCmsImage){
          if(env.PUBLIC_CMS_ENABLED!=="true"||request.method!=="GET"||
             typeof env.PUBLIC_MEDIA_R2?.get!=="function")return error(404,"not_found");
          const origin=request.headers.get("Origin");
          if(origin&&!origins.includes(origin))return error(403,"origin_forbidden");
          const keys=[...url.searchParams.keys()];
          if(keys.length<2||keys.length>3||new Set(keys).size!==keys.length||
             keys.some(k=>!["id","device","slide"].includes(k))||
             url.searchParams.getAll("id").length!==1||
             url.searchParams.getAll("device").length!==1||
             (url.searchParams.has("slide")&&url.searchParams.getAll("slide").length!==1))
            return error(400,"invalid_query");
          const id=url.searchParams.get("id")||"",device=url.searchParams.get("device")||"";
          const slide=url.searchParams.has("slide")?Number(url.searchParams.get("slide")):1;
          if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||
              !["desktop","mobile"].includes(device)||!Number.isInteger(slide)||slide<1||slide>5||
              (url.searchParams.has("slide")&&!/^[1-5]$/.test(url.searchParams.get("slide")||"")))
            return error(400,"invalid_query");
          // The SQL view rechecks publication, approval and time at each request.
          const key=await readModel(env,m=>m.getPublicCmsImageKey(id,device,slide));
          if(!key)return error(404,"not_found");
          const object=await env.PUBLIC_MEDIA_R2.get(key);
          if(!object?.body||object.size<100||object.size>5*1024*1024||
              object.httpMetadata?.contentType!=="image/webp")return error(404,"not_found");
          return new Response(object.body,{status:200,headers:{
            "Content-Type":"image/webp","Cache-Control":"no-store",
            "X-Content-Type-Options":"nosniff","Cross-Origin-Resource-Policy":"same-origin"
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
          getPublicCms:()=>readModel(env,m=>m.getPublicCms()),
          getPublicHomeLayout:()=>readModel(env,m=>m.getPublicHomeLayout()),
          getPublicCategoryDisplay:()=>readModel(env,m=>m.getPublicCategoryDisplay()),
          categoryDisplayEnabled:env.PUBLIC_P5_ENABLED==="true",
          homeLayoutEnabled:env.PUBLIC_DL4_ENABLED==="true",
          cmsEnabled:env.PUBLIC_CMS_ENABLED==="true",
          allowedOrigins:origins,
        });
        return await api.fetch(request);
      } catch {
        return error(503,"service_unavailable");
      }
    },
  };
}
