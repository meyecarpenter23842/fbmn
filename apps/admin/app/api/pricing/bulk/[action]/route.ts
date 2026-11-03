export const runtime="nodejs";
export const dynamic="force-dynamic";
const PRIVATE={"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store",
 "X-Content-Type-Options":"nosniff"};
const fail=(s:number,code:string)=>Response.json({error:{code}},{status:s,headers:PRIVATE});
const allowed=new Set(["export","history","preview","apply","approve"]);
function baseUrl(){
 try{const u=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/"?u.origin:null;
 }catch{return null;}
}
async function proxy(request:Request,action:string,method:"GET"|"POST"){
 if(!allowed.has(action)||method==="GET"&&!["export","history"].includes(action)||
  method==="POST"&&["export","history"].includes(action))return fail(404,"not_found");
 const url=new URL(request.url);
 if(method==="POST"){
  if(request.headers.get("origin")!==url.origin||request.headers.get("sec-fetch-site")==="cross-site")
   return fail(403,"origin_forbidden");
  if(url.search!=="")return fail(400,"invalid_query");
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json")
   return fail(415,"invalid_content_type");
 }
 if(Number(request.headers.get("content-length")||0)>350000)return fail(413,"too_large");
 const authorization=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(authorization)||authorization.length>12010)
  return fail(401,"invalid_bearer");
 const base=baseUrl();if(!base)return fail(503,"admin_api_unavailable");
 const path=action==="export"?"bulk":action==="history"?"history":action==="approve"?"approve":"bulk/"+action;
 let body:undefined|string;
 if(method==="POST"){body=await request.text();if(body.length>350000)return fail(413,"too_large");}
 try{
  const resp=await fetch(base+"/v1/admin/pricing/"+path+(method==="GET"?url.search:""),{
   method,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(18000),
   headers:{Authorization:authorization,Accept:"application/json",
    ...(method==="POST"?{"Content-Type":"application/json"}:{})},
   ...(body===undefined?{}:{body})
  });
  if(![200,400,401,403,404,405,409,413,503].includes(resp.status))return fail(503,"pricebook_unavailable");
  const raw=await resp.text();
  if(raw.length>1500000||!resp.headers.get("content-type")?.includes("application/json"))
   return fail(503,"invalid_pricebook_response");
  return new Response(raw,{status:resp.status,headers:PRIVATE});
 }catch{return fail(503,"pricebook_unavailable");}
}
export async function GET(request:Request,context:{params:Promise<{action:string}>}){
 const {action}=await context.params;return proxy(request,action,"GET");
}
export async function POST(request:Request,context:{params:Promise<{action:string}>}){
 const {action}=await context.params;return proxy(request,action,"POST");
}
