// DL7B same-origin Owner relay. Images remain private; no cookies forwarded to Worker.
export const runtime="nodejs";
export const dynamic="force-dynamic";
const PRIVATE={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const JSON_HEADERS={...PRIVATE,"Content-Type":"application/json; charset=utf-8"};
const fail=(s:number,c:string)=>Response.json({error:{code:c}},{status:s,headers:JSON_HEADERS});
const GET_ACTIONS=new Set(["","image"]);
const POST_ACTIONS=new Set(["create","save","ready","hide","upload","reorder","remove"]);
const MAX=5*1024*1024;
function base(){
 try{const u=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return u.protocol==="https:"&&u.pathname==="/"&&!u.username&&!u.password&&!u.search&&!u.hash?u.origin:null;
 }catch{return null;}
}
async function proxy(request:Request,params:Promise<{path?:string[]}>,method:"GET"|"POST"){
 const {path=[]}=await params;
 if(path.length>1)return fail(404,"not_found");
 const action=path[0]||"";
 if(!(method==="GET"?GET_ACTIONS:POST_ACTIONS).has(action))return fail(404,"not_found");
 const u=new URL(request.url),binary=method==="GET"&&action==="image",upload=action==="upload";
 const query=[...u.searchParams.keys()];
 if(method==="GET"){
  const allowed=action==="image"?"asset":"id";
  if(query.length>1||query.some(x=>x!==allowed))return fail(400,"invalid_query");
  if(action==="image"&&query.length!==1)return fail(400,"invalid_query");
 }else{
  if(u.search)return fail(400,"invalid_query");
  if(request.headers.get("origin")!==u.origin||request.headers.get("sec-fetch-site")==="cross-site")
   return fail(403,"origin_forbidden");
  if(request.headers.get("content-type")?.split(";")[0]!== (upload?"image/webp":"application/json"))
   return fail(415,"invalid_content_type");
  if(upload){
   const id=request.headers.get("x-catalogue-book-id")||"",rev=request.headers.get("x-catalogue-revision")||"",
    kind=request.headers.get("x-catalogue-kind")||"";
   if(!/^[a-f0-9-]{36}$/i.test(id)||!/^[1-9][0-9]{0,9}$/.test(rev)||
    !["page","cover","background_desktop","background_mobile"].includes(kind))
    return fail(400,"invalid_upload");
  }
 }
 const authorization=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(authorization)||authorization.length>12010)
  return fail(401,"unauthenticated");
 const limit=upload?MAX:20000;
 if(Number(request.headers.get("content-length")||0)>limit)return fail(413,"too_large");
 const url=base();
 if(!url)return fail(503,"catalogue_unavailable");
 let body:string|Blob|undefined;
 if(method==="POST"){
  if(upload){
   const bytes=await request.arrayBuffer();
   if(bytes.byteLength>MAX||bytes.byteLength<100)return fail(413,"too_large");
   body=new Blob([bytes],{type:"image/webp"});
  }else{
   const raw=await request.text();
   if(raw.length>limit)return fail(413,"too_large");
   body=raw;
  }
 }
 try{
  const response=await fetch(url+"/v1/admin/website/catalogue"+(action?"/"+action:"")+(method==="GET"?u.search:""),{
   method,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(25000),
   headers:{Authorization:authorization,Accept:binary?"image/webp":"application/json",
    ...(method==="POST"?{"Content-Type":upload?"image/webp":"application/json"}:{}),
    ...(upload?{"X-Catalogue-Book-Id":request.headers.get("x-catalogue-book-id")||"",
      "X-Catalogue-Revision":request.headers.get("x-catalogue-revision")||"",
      "X-Catalogue-Kind":request.headers.get("x-catalogue-kind")||""}:{})},
   ...(body===undefined?{}:{body})
  });
  if(![200,400,401,403,404,405,409,413,415,422,429,503].includes(response.status))
   return fail(503,"catalogue_unavailable");
  if(binary&&response.ok){
   if(response.headers.get("content-type")?.split(";")[0]!=="image/webp")
    return fail(503,"invalid_media");
   const bytes=await response.arrayBuffer();
   if(bytes.byteLength>MAX)return fail(503,"invalid_media");
   return new Response(bytes,{status:200,headers:{...PRIVATE,
    "Content-Type":"image/webp","Content-Disposition":"inline",
    "Cross-Origin-Resource-Policy":"same-origin"}});
  }
  const raw=await response.text();
  if(raw.length>300000||!response.headers.get("content-type")?.includes("application/json"))
   return fail(503,"catalogue_unavailable");
  if(response.status===404&&action===""&&method==="GET")
   return fail(503,"catalogue_worker_not_deployed");
  return new Response(raw,{status:response.status,headers:JSON_HEADERS});
 }catch{return fail(503,"catalogue_unavailable");}
}
export async function GET(request:Request,ctx:{params:Promise<{path?:string[]}>}){
 return proxy(request,ctx.params,"GET");
}
export async function POST(request:Request,ctx:{params:Promise<{path?:string[]}>}){
 return proxy(request,ctx.params,"POST");
}
