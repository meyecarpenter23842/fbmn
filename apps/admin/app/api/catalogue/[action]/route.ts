export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ALLOWED = new Set(["snapshot","skus","families","categories","group","visibility","membership"]);
const HEADERS = {"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:HEADERS});
function baseUrl(){
  try{
    const url=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
    if(url.protocol==="https:"&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==="/")
      return url.origin;
  }catch{}
  return null;
}
async function boundedJsonText(request:Request):Promise<string|null> {
  const reader=request.body?.getReader();
  if(!reader)return null;
  const parts:Uint8Array[]=[];
  let length=0;
  for(let chunk=await reader.read();!chunk.done;chunk=await reader.read()){
    length+=chunk.value.byteLength;
    if(length>650000){await reader.cancel();return null;}
    parts.push(chunk.value);
  }
  const bytes=new Uint8Array(length);
  let offset=0;
  for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
async function relay(request:Request,params:Promise<{action:string}>,method:string){
  const {action}=await params;
  if(!ALLOWED.has(action))return fail(404,"not_found");
  if(method==="GET" && ["group","membership"].includes(action))return fail(405,"method_not_allowed");
  if(method!=="GET"){
    if(request.headers.get("origin")!==new URL(request.url).origin ||
      request.headers.get("sec-fetch-site")==="cross-site")return fail(403,"origin_forbidden");
    if(method==="PATCH"&&!["skus","categories","families"].includes(action))return fail(405,"method_not_allowed");
    if(!["skus","families","categories","group","visibility","membership"].includes(action))return fail(405,"method_not_allowed");
    if(request.headers.get("content-type")?.split(";")[0]!=="application/json")
      return fail(415,"invalid_content_type");
    const length=Number(request.headers.get("content-length")||0);
    if(length>650000)return fail(413,"body_too_large");
  }
  const bearer=request.headers.get("authorization")||"";
  if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(bearer)||bearer.length>12010)
    return fail(401,"invalid_bearer");
  const base=baseUrl();
  if(!base)return fail(503,"admin_api_not_configured");
  try{
    const payload=method==="GET"?undefined:await boundedJsonText(request);
    if(method!=="GET"&&payload===null)return fail(413,"body_too_large");
    const response=await fetch(base+"/v1/admin/catalogue/"+action,{
      method,redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(10000),
      headers:{Authorization:bearer,Accept:"application/json",
        ...(method==="GET"?{}:{"Content-Type":"application/json"})},
      ...(method==="GET"?{}:{body:payload}),
    });
    if(![200,201,400,401,403,404,405,409,429,503].includes(response.status))
      return fail(503,"catalogue_api_unavailable");
    const raw=await response.text();
    // SKU list includes optional 600+6000 character descriptions. Keep the
    // private response bounded while supporting the complete 613-SKU catalogue.
    if(raw.length>16000000||!response.headers.get("content-type")?.includes("application/json"))
      return fail(503,"invalid_catalogue_response");
    return new Response(raw,{status:response.status,headers:{...HEADERS,"Content-Type":"application/json"}});
  }catch{return fail(503,"catalogue_api_unavailable");}
}
type Context={params:Promise<{action:string}>};
export async function GET(req:Request,{params}:Context){return relay(req,params,"GET");}
export async function POST(req:Request,{params}:Context){return relay(req,params,"POST");}
export async function PATCH(req:Request,{params}:Context){return relay(req,params,"PATCH");}
