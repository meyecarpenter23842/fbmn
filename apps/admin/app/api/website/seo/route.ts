// SEO02B same-origin Owner proxy. No localStorage or logs of bearer tokens.
export const runtime="nodejs";
export const dynamic="force-dynamic";
const H={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Type":"application/json; charset=utf-8"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:H});
async function proxy(request:Request,method:"GET"|"POST"){
 const u=new URL(request.url);
 if(method==="POST"&&u.search)return fail(400,"invalid_query");
 if(method==="GET"&&(u.searchParams.size>1||[...u.searchParams.keys()].some(k=>k!=="page")||
  (u.searchParams.has("page")&&(!/^[1-9]\d{0,1}$/.test(u.searchParams.get("page")||"")||
   Number(u.searchParams.get("page"))>50))))return fail(400,"invalid_query");
 if(method==="POST"&&(request.headers.get("origin")!==u.origin||request.headers.get("sec-fetch-site")==="cross-site"))
  return fail(403,"origin_forbidden");
 const bearer=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(bearer)||bearer.length>12010)return fail(401,"unauthenticated");
 let base:URL;
 try{
  base=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  if(base.protocol!=="https:"||base.pathname!=="/"||base.username||base.password||base.search||base.hash)
   return fail(503,"seo_unavailable");
 }catch{return fail(503,"seo_unavailable");}
 let body:string|undefined;
 if(method==="POST"){
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return fail(415,"invalid_type");
  if(Number(request.headers.get("content-length")||0)>4000)return fail(413,"too_large");
  body=await request.text();if(body.length>4000)return fail(413,"too_large");
 }
 try{
  const r=await fetch(base.origin+"/v1/admin/website/seo"+(method==="GET"?u.search:""),{
   method,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(20000),
   headers:{Authorization:bearer,Accept:"application/json",...(body===undefined?{}:{"Content-Type":"application/json"})},
   ...(body===undefined?{}:{body})
  });
  if(![200,400,401,403,404,405,409,413,415,429,503].includes(r.status))return fail(503,"seo_unavailable");
  const raw=await r.text();
  if(raw.length>2500000||!r.headers.get("content-type")?.includes("application/json"))
   return fail(503,"seo_unavailable");
  if(r.status===404)return fail(503,"seo_worker_not_deployed");
  return new Response(raw,{status:r.status,headers:H});
 }catch{return fail(503,"seo_unavailable");}
}
export async function GET(request:Request){return proxy(request,"GET")}
export async function POST(request:Request){return proxy(request,"POST")}
