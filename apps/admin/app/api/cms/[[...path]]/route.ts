// Same-origin Admin CMS relay: opaque Owner bearer, bounded JSON and private WebP.
export const runtime="nodejs";
export const dynamic="force-dynamic";

const PRIVATE={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const JSON_HEADERS={...PRIVATE,"Content-Type":"application/json; charset=utf-8"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:JSON_HEADERS});
const GET_ACTIONS=new Set(["","entry","assets","image","capability"]);
const POST_ACTIONS=new Set(["create","update","publish","hide","image-upload"]);
const MAX_IMAGE=5*1024*1024;
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
 if(!(method==="GET"?GET_ACTIONS:POST_ACTIONS).has(action))return fail(404,"not_found");
 const url=new URL(request.url);
 const isImage=method==="GET"&&action==="image";
 const isUpload=method==="POST"&&action==="image-upload";
 if(method==="GET"){
  const keys=[...url.searchParams.keys()];
  const allowed=action==="entry"||action==="assets"?new Set(["id"]):
   isImage?new Set(["id","channel","device"]):action==="capability"?new Set():new Set(["mode","page"]);
  if(keys.length!==new Set(keys).size||keys.some(k=>!allowed.has(k)))
   return fail(400,"invalid_query");
 }else{
  if(request.headers.get("origin")!==url.origin || request.headers.get("sec-fetch-site")==="cross-site")
   return fail(403,"origin_forbidden");
  if(url.search)return fail(400,"invalid_query");
  const mime=request.headers.get("content-type")?.split(";")[0];
  if(mime!==(isUpload?"image/webp":"application/json"))
   return fail(415,"invalid_content_type");
 }
 const token=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(token)||token.length>12010)
  return fail(401,"unauthenticated");
 const limit=isUpload?MAX_IMAGE:105000;
 if(Number(request.headers.get("content-length")||0)>limit)return fail(413,"too_large");
 const base=baseUrl();
 if(!base)return fail(503,"cms_unavailable");
 let body:string|Blob|undefined;
 if(method==="POST"){
  if(isUpload){
   const id=request.headers.get("x-cms-id")||"";
   const ch=request.headers.get("x-cms-channel")||"";
   const device=request.headers.get("x-cms-device")||"";
   const rev=request.headers.get("x-cms-revision")||"";
   if(!/^[a-f0-9-]{36}$/i.test(id)||!["public_web","dealer_app","consumer_app"].includes(ch)||
    !["desktop","mobile"].includes(device)||!/^[1-9][0-9]{0,9}$/.test(rev))
    return fail(400,"invalid_upload");
   const bytes=await request.arrayBuffer();
   if(bytes.byteLength<100||bytes.byteLength>MAX_IMAGE)return fail(413,"too_large");
   body=new Blob([bytes],{type:"image/webp"});
  }else{
   const text=await request.text();
   if(text.length>limit)return fail(413,"too_large");
   body=text;
  }
 }
 try{
  const target=base+"/v1/admin/cms"+(action?"/"+action:"")+(method==="GET"?url.search:"");
  const response=await fetch(target,{
   method,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(20000),
   headers:{Authorization:token,Accept:isImage?"image/webp":"application/json",
    ...(method==="POST"?{"Content-Type":isUpload?"image/webp":"application/json"}:{}),
    ...(isUpload?{
     "X-CMS-ID":request.headers.get("x-cms-id")||"",
     "X-CMS-Channel":request.headers.get("x-cms-channel")||"",
     "X-CMS-Device":request.headers.get("x-cms-device")||"",
     "X-CMS-Revision":request.headers.get("x-cms-revision")||"",
    }:{})},
   ...(body===undefined?{}:{body})
  });
  if(![200,400,401,403,404,405,409,413,415,422,429,503].includes(response.status))
   return fail(503,"cms_unavailable");
  if(isImage&&response.ok){
   if(response.headers.get("content-type")?.split(";")[0]!=="image/webp")
    return fail(503,"invalid_media_response");
   const bytes=await response.arrayBuffer();
   if(bytes.byteLength>MAX_IMAGE)return fail(503,"invalid_media_response");
   return new Response(bytes,{status:200,headers:{...PRIVATE,"Content-Type":"image/webp",
    "Content-Disposition":"inline","Cross-Origin-Resource-Policy":"same-origin"}});
  }
  const raw=await response.text();
  if(raw.length>2500000||!response.headers.get("content-type")?.includes("application/json"))
   return fail(503,"cms_invalid_response");
  // A 404 on the list endpoint indicates the connected Worker is still old.
  // Do not misrepresent it as a genuinely empty CMS table.
  if(action===""&&method==="GET"&&response.status===404)
   return fail(503,"cms_worker_not_deployed");
  return new Response(raw,{status:response.status,headers:JSON_HEADERS});
 }catch{return fail(503,"cms_unavailable");}
}
export async function GET(request:Request,ctx:{params:Promise<{path?:string[]}>}){
 return proxy(request,ctx.params,"GET");
}
export async function POST(request:Request,ctx:{params:Promise<{path?:string[]}>}){
 return proxy(request,ctx.params,"POST");
}
