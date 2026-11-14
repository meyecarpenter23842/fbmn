// Owner authenticated same-origin relay; never expose Admin Worker or JWT to the Website.
export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:HEADERS});
async function proxy(request:Request,method:"GET"|"POST"){
 const url=new URL(request.url);
 if(url.search)return fail(400,"invalid_query");
 if(method==="POST"&&(request.headers.get("origin")!==url.origin||
   request.headers.get("sec-fetch-site")==="cross-site"))return fail(403,"origin_forbidden");
 const auth=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(auth)||auth.length>12010)return fail(401,"unauthenticated");
 let origin:string;
 try{const base=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  if(base.protocol!=="https:"||base.pathname!=="/"||base.username||base.password||base.search||base.hash)
   return fail(503,"config_unavailable");
  origin=base.origin;
 }catch{return fail(503,"config_unavailable");}
 let body:string|undefined;
 if(method==="POST"){
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json"||
   Number(request.headers.get("content-length")||0)>3000)return fail(415,"invalid_content_type");
  body=await request.text();if(body.length>3000)return fail(413,"too_large");
 }
 try{
  const response=await fetch(origin+"/v1/admin/website/app-download",{
   method,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(12000),
   headers:{"Authorization":auth,"Accept":"application/json",...(body?{"Content-Type":"application/json"}:{})},
   ...(body?{body}:{})
  });
  if(![200,400,401,403,404,405,409,413,415,429,503].includes(response.status))
   return fail(503,"config_unavailable");
  const text=await response.text();
  if(text.length>5000||!response.headers.get("content-type")?.includes("application/json"))
   return fail(503,"config_unavailable");
  if(response.status===404)return fail(503,"worker_not_deployed");
  return new Response(text,{status:response.status,headers:{...HEADERS,"Content-Type":"application/json; charset=utf-8"}});
 }catch{return fail(503,"config_unavailable");}
}
export async function GET(request:Request){return proxy(request,"GET")}
export async function POST(request:Request){return proxy(request,"POST")}
