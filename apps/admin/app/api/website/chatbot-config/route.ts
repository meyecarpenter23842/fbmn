// DL10A Owner-only same-origin configuration relay.
export const maxDuration=120;export const runtime="nodejs";export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store","Content-Type":"application/json; charset=utf-8",
 "X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:HEADERS});
function baseUrl(){
 try{const u=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/"?u.origin:null;
 }catch{return null;}
}
async function proxy(request:Request,method:"GET"|"POST"){
 const u=new URL(request.url);
 if(u.search||(method==="POST"&&(request.headers.get("origin")!==u.origin||request.headers.get("sec-fetch-site")==="cross-site")))
  return fail(403,"origin_forbidden");
 const authorization=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(authorization)||authorization.length>12010)
  return fail(401,"unauthenticated");
 if(method==="POST"&&request.headers.get("content-type")?.split(";")[0]!=="application/json")
  return fail(415,"invalid_content_type");
 if(Number(request.headers.get("content-length")||0)>20000)return fail(413,"too_large");
 let body:string|undefined;
 if(method==="POST"){body=await request.text();if(body.length>20000)return fail(413,"too_large");}
 const base=baseUrl();if(!base)return fail(503,"config_unavailable");
 try{
  const upstream=await fetch(base+"/v1/admin/website/chatbot-config"+(method==="GET"?u.search:""),{
   method,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(120000),
   headers:{Authorization:authorization,Accept:"application/json",
    ...(body!==undefined?{"Content-Type":"application/json"}:{})},
   ...(body!==undefined?{body}:{})});
  if(![200,400,401,403,404,405,409,413,415,429,503].includes(upstream.status)||
     !upstream.headers.get("content-type")?.includes("application/json"))
    return fail(503,"config_upstream_unavailable");
  const raw=await upstream.text();if(raw.length>500000)return fail(503,"config_unavailable");
  if(upstream.status===404&&method==="GET")return fail(503,"config_worker_not_deployed");
  return new Response(raw,{status:upstream.status,headers:HEADERS});
 }catch{return fail(503,"config_upstream_unavailable");}
}
export async function GET(request:Request){return proxy(request,"GET");}
export async function POST(request:Request){return proxy(request,"POST");}
