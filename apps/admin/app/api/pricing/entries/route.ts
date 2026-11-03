export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Content-Type":"application/json; charset=utf-8",
  "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:HEADERS});
function baseUrl(){
 try{
  const value=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return value.protocol==="https:"&&!value.username&&!value.password&&!value.search&&!value.hash&&
    value.pathname==="/"?value.origin:null;
 }catch{return null;}
}
async function relay(request:Request,method:"GET"|"POST"|"PATCH"){
 const url=new URL(request.url);
 const query=url.searchParams;
 if(method==="GET"){
  if(query.getAll("sku").length!==1||[...query.keys()].some(key=>key!=="sku")||
    !query.get("sku")||query.get("sku")!.length>80)return fail(400,"invalid_sku");
 }else{
  if(url.search!=="")return fail(400,"invalid_query");
  if(request.headers.get("origin")!==url.origin||request.headers.get("sec-fetch-site")==="cross-site")
    return fail(403,"origin_forbidden");
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json")
    return fail(415,"invalid_content_type");
  if(Number(request.headers.get("content-length")||0)>4096)return fail(413,"body_too_large");
 }
 const authorization=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(authorization)||authorization.length>12010)
   return fail(401,"invalid_bearer");
 const base=baseUrl();
 if(!base)return fail(503,"pricing_api_not_configured");
 let body:string|undefined;
 if(method!=="GET"){
  body=await request.text();
  if(body.length>4096)return fail(413,"body_too_large");
 }
 try{
  const response=await fetch(base+"/v1/admin/pricing/entries"+(method==="GET"?"?"+query.toString():""),{
   method,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(9000),
   headers:{Authorization:authorization,Accept:"application/json",
    ...(method==="GET"?{}:{"Content-Type":"application/json"})},
   ...(method==="GET"?{}:{body})
  });
  if(![200,201,400,401,403,404,405,409,429,503].includes(response.status))
    return fail(503,"pricebook_unavailable");
  const raw=await response.text();
  if(raw.length>150000||!response.headers.get("content-type")?.includes("application/json"))
    return fail(503,"invalid_pricebook_response");
  return new Response(raw,{status:response.status,headers:HEADERS});
 }catch{return fail(503,"pricebook_unavailable");}
}
export async function GET(request:Request){return relay(request,"GET");}
export async function POST(request:Request){return relay(request,"POST");}
export async function PATCH(request:Request){return relay(request,"PATCH");}
