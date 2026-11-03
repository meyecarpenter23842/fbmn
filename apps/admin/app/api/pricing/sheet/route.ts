import {readPriceCsv,readPriceXlsx} from "./price-sheet-parser";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=20;
const PRIVATE={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(s:number,code:string)=>Response.json({error:{code}},{status:s,headers:PRIVATE});
const MAX_FILE=8_000_000,MAX_WIRE=8_065_536;
function baseUrl(){
 try{const u=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/"?u.origin:null;
 }catch{return null;}
}
async function readCapped(request:Request){
 const reader=request.body?.getReader();if(!reader)return null;
 const chunks:Uint8Array[]=[];let total=0;
 for(let chunk=await reader.read();!chunk.done;chunk=await reader.read()){
  total+=chunk.value.byteLength;
  if(total>MAX_WIRE){await reader.cancel().catch(()=>{});return null;}
  chunks.push(chunk.value);
 }
 const merged=new Uint8Array(total);let offset=0;
 for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.length;}
 return merged;
}
export async function POST(request:Request){
 const url=new URL(request.url);
 if(request.headers.get("origin")!==url.origin||request.headers.get("sec-fetch-site")==="cross-site")
  return fail(403,"origin_forbidden");
 const contentType=request.headers.get("content-type")||"";
 if(!/^multipart\/form-data;\s*boundary=/i.test(contentType))return fail(415,"unsupported_media_type");
 if(Number(request.headers.get("content-length")||0)>MAX_WIRE)return fail(413,"file_too_large");
 const auth=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(auth)||auth.length>12010)
  return fail(401,"invalid_bearer");
 const base=baseUrl();if(!base)return fail(503,"admin_api_unavailable");
 try{
  const check=await fetch(base+"/v1/admin/session",{
   headers:{Authorization:auth,Accept:"application/json"},
   cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(7000)});
  if(check.status===401)return fail(401,"unauthenticated");
  if(check.status===403)return fail(403,"forbidden");
  if(!check.ok||!check.headers.get("content-type")?.includes("application/json"))
   return fail(503,"admin_api_unavailable");
  if((await check.json())?.data?.role!=="owner")return fail(403,"owner_required");
 }catch{return fail(503,"admin_api_unavailable");}
 try{
  const incoming=await readCapped(request);if(!incoming)return fail(413,"file_too_large");
  const rebuilt=new Request(url.origin+"/api/pricing/sheet",{
   method:"POST",headers:{"content-type":contentType},body:new Uint8Array(incoming)});
  const form=await rebuilt.formData(),parts=[...form.entries()];
  if(parts.length!==1||parts[0][0]!=="file"||!(parts[0][1] instanceof File))
   return fail(400,"single_file_required");
  const file=parts[0][1] as File;
  if(!/\.(xlsx|csv)$/i.test(file.name)||file.size===0||file.size>MAX_FILE)
   return fail(400,"invalid_file");
  const bytes=new Uint8Array(await file.arrayBuffer());
  const data=/\.xlsx$/i.test(file.name)?
   bytes[0]===0x50&&bytes[1]===0x4b?await readPriceXlsx(bytes):null:
   readPriceCsv(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
  if(!data)return fail(422,"invalid_xlsx");
  return Response.json({data},{headers:PRIVATE});
 }catch(cause){
  const code=cause instanceof Error?cause.message:"";
  const visible=new Set(["multiple_price_sheets","missing_price_sheet","missing_columns",
    "too_many_rows","too_many_columns","xlsx_too_large","formula_not_allowed",
    "unsupported_cell","invalid_xlsx","invalid_csv","cell_too_long"]);
  return fail(422,visible.has(code)?code:"invalid_price_sheet");
}
}
