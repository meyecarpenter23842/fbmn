export const runtime="nodejs";
export const dynamic="force-dynamic";
const PRIVATE={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
 "Content-Type":"application/json; charset=utf-8"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:PRIVATE});
const GET_ACTIONS=new Set(["","customers","prices"]);
const POST_ACTIONS=new Set(["create","update","approve","deactivate","price","price-approve","resolve"]);
function workerUrl(){
 try{
  const u=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/"?u.origin:null;
 }catch{return null;}
}
async function proxy(request:Request,params:Promise<{path?:string[]}>,method:"GET"|"POST"){
 const {path=[]}=await params;
 if(path.length>1)return fail(404,"not_found");
 const action=path[0]||"";
 if(method==="GET"?!GET_ACTIONS.has(action):!POST_ACTIONS.has(action))return fail(404,"not_found");
 const url=new URL(request.url);
 if(method==="POST"){
  if(request.headers.get("origin")!==url.origin||request.headers.get("sec-fetch-site")==="cross-site")
   return fail(403,"origin_forbidden");
  if(url.search)return fail(400,"invalid_query");
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json")
   return fail(415,"invalid_content_type");
 }
 const token=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(token)||token.length>12010)
  return fail(401,"unauthenticated");
 if(Number(request.headers.get("content-length")||0)>100000)return fail(413,"too_large");
 const base=workerUrl();
 if(!base)return fail(503,"admin_api_unavailable");
 let body:string|undefined;
 if(method==="POST"){
  body=await request.text();
  if(body.length>100000)return fail(413,"too_large");
 }
 try{
  const remote=await fetch(base+"/v1/admin/pricing/managed"+(action?"/"+action:"")+
   (method==="GET"?url.search:""),{
   method,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(14000),
   headers:{Authorization:token,Accept:"application/json",
    ...(method==="POST"?{"Content-Type":"application/json"}:{})},
   ...(body===undefined?{}:{body})
  });
  if(![200,400,401,403,404,405,409,413,503].includes(remote.status))
   return fail(503,"price_lists_unavailable");
  const raw=await remote.text();
  if(raw.length>1500000||!remote.headers.get("content-type")?.includes("application/json"))
   return fail(503,"invalid_response");
  return new Response(raw,{status:remote.status,headers:PRIVATE});
 }catch{return fail(503,"price_lists_unavailable");}
}
export async function GET(request:Request,ctx:{params:Promise<{path?:string[]}>}){
 return proxy(request,ctx.params,"GET");
}
export async function POST(request:Request,ctx:{params:Promise<{path?:string[]}>}){
 return proxy(request,ctx.params,"POST");
}
