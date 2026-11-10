// DL4 same-origin Owner relay. Opaque short-lived JWT; never store in cookies/localStorage.
export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Type":"application/json; charset=utf-8"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:HEADERS});
async function proxy(request:Request,method:"GET"|"POST"){
 const url=new URL(request.url);
 if(url.search)return fail(400,"invalid_query");
 if(method==="POST"&&(request.headers.get("origin")!==url.origin||
    request.headers.get("sec-fetch-site")==="cross-site"))return fail(403,"origin_forbidden");
 const authorization=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(authorization)||authorization.length>12010)
  return fail(401,"unauthenticated");
 let base:URL;
 try{
  base=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  if(base.protocol!=="https:"||base.pathname!=="/"||base.username||base.password||
     base.search||base.hash)return fail(503,"display_unavailable");
 }catch{return fail(503,"display_unavailable");}
 let body:string|undefined;
 if(method==="POST"){
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json"||
   Number(request.headers.get("content-length")||0)>15000)return fail(415,"invalid_content_type");
  body=await request.text();
  if(body.length>15000)return fail(413,"too_large");
 }
 try{
  const response=await fetch(base.origin+"/v1/admin/website/category-display",{
    method,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(20000),
    headers:{Authorization:authorization,Accept:"application/json",
     ...(method==="POST"?{"Content-Type":"application/json"}:{})},
    ...(body===undefined?{}:{body})
  });
  if(![200,400,401,403,404,405,409,413,415,429,503].includes(response.status))
   return fail(503,"display_unavailable");
  const raw=await response.text();
  if(raw.length>4000000||!response.headers.get("content-type")?.includes("application/json"))
   return fail(503,"display_unavailable");
  if(response.status===404)return fail(503,"display_worker_not_deployed");
  return new Response(raw,{status:response.status,headers:HEADERS});
 }catch{return fail(503,"display_unavailable");}
}
export async function GET(request:Request){return proxy(request,"GET")}
export async function POST(request:Request){return proxy(request,"POST")}
