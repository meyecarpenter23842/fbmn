import {randomBytes} from "node:crypto";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
const BEARER=/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;
function workerOrigin(){
 try{
  const value=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return value.protocol==="https:"&&value.pathname==="/"&&!value.username&&!value.password&&!value.search&&!value.hash?value.origin:null;
 }catch{return null;}
}
function neonAuthUrl(){
 try{
  const value=new URL(process.env.NEON_AUTH_BASE_URL||"");
  return value.protocol==="https:"&&!value.username&&!value.password&&!value.search&&!value.hash?value:null;
 }catch{return null;}
}
async function relay(request:Request,path:string,method:string,body?:unknown){
 const base=workerOrigin();
 if(!base)return fail(503,"users_unavailable");
 const match=BEARER.exec(request.headers.get("authorization")||"");
 if(!match)return fail(401,"unauthenticated");
 try{
  const response=await fetch(base+path,{method,redirect:"manual",cache:"no-store",
    headers:{Authorization:"Bearer "+match[1],Accept:"application/json",...(body===undefined?{}:{"Content-Type":"application/json"})},
    ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(9000)});
  const text=await response.text();
  if(text.length>100000||!response.headers.get("content-type")?.includes("application/json"))return fail(503,"users_unavailable");
  const status=response.status;
  if(![200,400,401,403,404,405,409,413,415,429,503].includes(status))return fail(503,"users_unavailable");
  return new Response(text,{status,headers});
 }catch{return fail(503,"users_unavailable");}
}
async function readBody(request:Request){
 try{
  if(!request.headers.get("content-type")?.startsWith("application/json"))return null;
  const text=await request.text();
  if(text.length>12000)return null;
  return JSON.parse(text) as Record<string,unknown>;
 }catch{return null;}
}
function sameOrigin(request:Request){
 const origin=request.headers.get("origin");
 return origin===new URL(request.url).origin;
}
export async function GET(request:Request){
 return relay(request,"/v1/admin/users","GET");
}
export async function POST(request:Request){
 if(!sameOrigin(request))return fail(403,"origin_forbidden");
 const body=await readBody(request);
 if(!body)return fail(400,"invalid_grant");
 // Validate actor's grant BEFORE creating even an unapproved Neon Auth identity.
 const preflight=await relay(request,"/v1/admin/users/preflight","POST",body);
 if(preflight.status!==200)return preflight;
 const auth=neonAuthUrl();
 if(!auth)return fail(503,"auth_unavailable");
 const email=String(body.email||"").trim().toLowerCase();
 const name=String(body.name||"").trim();
 // Never send the temporary credential to the browser or persist it.
 const password=randomBytes(48).toString("base64url");
 try{
  const created=await fetch(auth.toString().replace(/\/$/,"")+"/sign-up/email",{
    method:"POST",redirect:"manual",cache:"no-store",
    headers:{"Content-Type":"application/json","Accept":"application/json",Origin:new URL(request.url).origin},
    body:JSON.stringify({email,name,password}),signal:AbortSignal.timeout(9000)});
  if(!created.ok){
    const info=await created.json().catch(()=>null) as {code?:unknown}|null;
    // Existing Auth users can be granted access without changing their password.
    const duplicate=created.status===409 ||
      (created.status===422&&typeof info?.code==="string"&&info.code.includes("USER_ALREADY_EXISTS"));
    if(!duplicate)return fail(503,"auth_user_create_failed");
  }
 }catch{return fail(503,"auth_unavailable");}
 // The DB function independently rejects role=owner, edits to Owner or self,
 // stale revisions, invalid capabilities and callers without staff permission.
 const saved=await relay(request,"/v1/admin/users","POST",body);
 return saved;
}
export async function PATCH(request:Request){
 if(!sameOrigin(request))return fail(403,"origin_forbidden");
 const body=await readBody(request);
 if(!body)return fail(400,"invalid_grant");
 return relay(request,"/v1/admin/users","PATCH",body);
}
