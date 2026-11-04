export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE = {
 "Cache-Control":"private, no-store",
 "X-Content-Type-Options":"nosniff",
 "Content-Type":"application/json; charset=utf-8",
};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:PRIVATE});
const ACTIONS=new Set(["create","update","publish","hide"]);
function baseUrl(){
 try{
  const u=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&
   u.pathname==="/"?u.origin:null;
 }catch{return null;}
}
async function proxy(request:Request,params:Promise<{path?:string[]}>,method:"GET"|"POST"){
 const {path=[]}=await params;
 if(path.length>1)return fail(404,"not_found");
 const action=path[0]||"";
 if(method==="GET" ? !["","entry"].includes(action) : !ACTIONS.has(action))return fail(404,"not_found");
 const url=new URL(request.url);
 if(method==="GET"){
  const keys=[...url.searchParams.keys()];
  const allowed=action==="entry"?new Set(["id"]):new Set(["mode","page"]);
  if(keys.length!==new Set(keys).size || keys.some(k=>!allowed.has(k)))
   return fail(400,"invalid_query");
 }else{
  if(request.headers.get("origin")!==url.origin || request.headers.get("sec-fetch-site")==="cross-site")
   return fail(403,"origin_forbidden");
  if(url.search)return fail(400,"invalid_query");
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json")
   return fail(415,"invalid_content_type");
 }
 const token=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(token)||token.length>12010)
  return fail(401,"unauthenticated");
 if(Number(request.headers.get("content-length")||0)>105000)return fail(413,"too_large");
 const base=baseUrl();
 if(!base)return fail(503,"cms_unavailable");
 let body:string|undefined;
 if(method==="POST"){
  body=await request.text();
  if(body.length>105000)return fail(413,"too_large");
 }
 try{
  const response=await fetch(base+"/v1/admin/cms"+(action?"/"+action:"")+
   (method==="GET"?url.search:""),{
    method,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(14000),
    headers:{Authorization:token,Accept:"application/json",
     ...(method==="POST"?{"Content-Type":"application/json"}:{})},
    ...(body===undefined?{}:{body}),
   });
  if(![200,400,401,403,404,405,409,413,503].includes(response.status))
   return fail(503,"cms_unavailable");
  const json=await response.text();
  if(json.length>2500000||!response.headers.get("content-type")?.includes("application/json"))
   return fail(503,"cms_invalid_response");
  return new Response(json,{status:response.status,headers:PRIVATE});
 }catch{return fail(503,"cms_unavailable");}
}
export async function GET(request:Request,ctx:{params:Promise<{path?:string[]}>}){
 return proxy(request,ctx.params,"GET");
}
export async function POST(request:Request,ctx:{params:Promise<{path?:string[]}>}){
 return proxy(request,ctx.params,"POST");
}
