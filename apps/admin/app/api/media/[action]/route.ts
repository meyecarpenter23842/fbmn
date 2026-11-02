export const runtime="nodejs";
export const dynamic="force-dynamic";
const ALLOWED=new Set(["list","library","file","upload","link","order","scan","adopt","variant"]);
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:HEADERS});
function baseUrl(){
  try{
    const url=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
    if(url.protocol==="https:"&&!url.username&&!url.password&&!url.search&&
      !url.hash&&url.pathname==="/")return url.origin;
  }catch{}
  return null;
}
type Context={params:Promise<{action:string}>};
async function relay(req:Request,{params}:Context,method:string){
  const {action}=await params;
  if(!ALLOWED.has(action))return fail(404,"not_found");
  const read=new Set(["list","library","file","scan"]);
  if(method==="GET"&&!read.has(action))return fail(405,"method_not_allowed");
  if(method==="POST"&&!["upload","link","adopt","variant"].includes(action))return fail(405,"method_not_allowed");
  if(method==="PATCH"&&action!=="order")return fail(405,"method_not_allowed");
  if(method==="DELETE"&&action!=="link")return fail(405,"method_not_allowed");
  if(method!=="GET"&&(req.headers.get("origin")!==new URL(req.url).origin||
    req.headers.get("sec-fetch-site")==="cross-site"))return fail(403,"origin_forbidden");
  const bearer=req.headers.get("authorization")||"";
  if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(bearer)||bearer.length>12010)
    return fail(401,"invalid_bearer");
  const base=baseUrl();
  if(!base)return fail(503,"admin_api_not_configured");
  const target=new URL(base+"/v1/admin/catalogue/media/"+action);
  const original=new URL(req.url);
  if(original.search&&!(action==="list"||action==="file"))return fail(400,"invalid_query");
  if(action==="list"){
    const sku=original.searchParams.get("sku")||"";
    if(original.searchParams.size!==1||!sku||sku.length>80)return fail(400,"invalid_sku");
    target.searchParams.set("sku",sku);
  }
  if(action==="file"){
    const asset=original.searchParams.get("id")||"";
    if(original.searchParams.getAll("id").length!==1||!/^[a-f0-9-]{36}$/i.test(asset))return fail(400,"invalid_asset_id");
    target.searchParams.set("id",asset);
    const variant=original.searchParams.get("variant");
    if((variant&&!["thumb","web"].includes(variant))||
      original.searchParams.size!==(variant?2:1))
      return fail(400,"invalid_variant");
    if(variant)target.searchParams.set("variant",variant);
  }
  const upload=action==="upload",derivative=action==="variant";
  const mime=req.headers.get("content-type")?.split(";")[0]||"";
  if(method!=="GET"&&(!((upload||derivative)?(derivative?mime==="image/webp":["image/png","image/jpeg","image/webp"].includes(mime)):
    mime==="application/json")))return fail(415,"invalid_content_type");
  const limit=upload||derivative?5*1024*1024:8000;
  const size=Number(req.headers.get("content-length")||0);
  if(size>limit)return fail(413,"body_too_large");
  let body:Blob|undefined;
  if(method!=="GET"){
    const bytes=await req.arrayBuffer();
    if(!bytes.byteLength||bytes.byteLength>limit)return fail(413,"body_too_large");
    body=new Blob([bytes],{type:mime});
  }
  if(derivative){
    const assetId=req.headers.get("x-fbmn-asset-id")||"";
    const variant=req.headers.get("x-fbmn-variant")||"";
    if(!/^[0-9a-f-]{36}$/i.test(assetId)||!["web","thumb"].includes(variant))
      return fail(400,"invalid_variant_headers");
  }
  if(upload){
    const sku=req.headers.get("x-fbmn-sku")||"";
    const name=req.headers.get("x-fbmn-file-name")||"";
    if(!sku||sku.length>80||!name||name.length>700)return fail(400,"invalid_upload_headers");
  }
  try{
    const forwarded=await fetch(target.toString(),{
      method,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(20000),
      headers:{Authorization:bearer,Accept:action==="file"?"image/*":"application/json",
        ...(method==="GET"?{}:{"Content-Type":mime}),
        ...(upload?{"X-FBMN-Sku":req.headers.get("x-fbmn-sku")||"",
          "X-FBMN-File-Name":req.headers.get("x-fbmn-file-name")||""}:{}),
        ...(derivative?{"X-FBMN-Asset-ID":req.headers.get("x-fbmn-asset-id")||"",
          "X-FBMN-Variant":req.headers.get("x-fbmn-variant")||""}:{})},
      ...(body?{body}:{})
    });
    if(![200,201,400,401,403,404,405,409,413,415,422,429,503].includes(forwarded.status))
      return fail(503,"media_api_unavailable");
    const type=forwarded.headers.get("content-type")||"";
    if(action==="file"&&forwarded.ok&&["image/png","image/jpeg","image/webp"].includes(type)){
      const blob=await forwarded.arrayBuffer();
      if(blob.byteLength>5*1024*1024)return fail(503,"invalid_media_response");
      return new Response(blob,{status:200,headers:{...HEADERS,"Content-Type":type,
        "Content-Disposition":"inline","Cross-Origin-Resource-Policy":"same-origin"}});
    }
    const text=await forwarded.text();
    if(text.length>200000||!type.includes("application/json"))
      return fail(503,"invalid_media_response");
    return new Response(text,{status:forwarded.status,
      headers:{...HEADERS,"Content-Type":"application/json"}});
  }catch{return fail(503,"media_api_unavailable");}
}
export async function GET(req:Request,c:Context){return relay(req,c,"GET");}
export async function POST(req:Request,c:Context){return relay(req,c,"POST");}
export async function PATCH(req:Request,c:Context){return relay(req,c,"PATCH");}
export async function DELETE(req:Request,c:Context){return relay(req,c,"DELETE");}
