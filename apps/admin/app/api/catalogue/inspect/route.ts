import {inspectXlsxColumns} from "@/lib/sku-xlsx-adapter.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=20;
const PRIVATE={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:PRIVATE});
function baseUrl(){
  try{
    const u=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
    if(u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/")
      return u.origin;
  }catch{}
  return null;
}
async function readCap(request:Request){
  const reader=request.body?.getReader();
  if(!reader)return null;
  const chunks:Uint8Array[]=[];let total=0;
  for(let part=await reader.read();!part.done;part=await reader.read()){
    total+=part.value.byteLength;
    if(total>8_100_000){await reader.cancel().catch(()=>{});return null;}
    chunks.push(part.value);
  }
  const bytes=new Uint8Array(total);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return bytes;
}
export async function POST(request:Request){
  const origin=new URL(request.url).origin;
  if(request.headers.get("origin")!==origin||request.headers.get("sec-fetch-site")==="cross-site")
    return fail(403,"origin_forbidden");
  const type=request.headers.get("content-type")||"";
  if(!/^multipart\/form-data;\s*boundary=[A-Za-z0-9'()+_,./:=?-]{1,200}(?:;|$)/i.test(type))
    return fail(415,"unsupported_media_type");
  const auth=request.headers.get("authorization")||"";
  if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(auth)||auth.length>12010)return fail(401,"invalid_bearer");
  if(Number(request.headers.get("content-length")||0)>8_100_000)return fail(413,"file_too_large");
  const base=baseUrl();if(!base)return fail(503,"admin_api_unavailable");
  try{
    // Check live DB-backed role BEFORE reading workbook contents; never log raw samples.
    const session=await fetch(base+"/v1/admin/session",{
      headers:{Authorization:auth,Accept:"application/json"},cache:"no-store",
      redirect:"manual",signal:AbortSignal.timeout(7000)});
    if(session.status===401)return fail(401,"unauthenticated");
    if(session.status===403)return fail(403,"forbidden");
    if(!session.ok)return fail(503,"admin_api_unavailable");
    const role=(await session.json())?.data?.role;
    if(!["owner","admin","editor"].includes(role))return fail(403,"forbidden");
  }catch{return fail(503,"admin_api_unavailable");}
  let form:FormData;
  try{
    const incoming=await readCap(request);
    if(!incoming)return fail(413,"file_too_large");
    const req=new Request(origin+"/api/catalogue/inspect",{
      method:"POST",headers:{"content-type":type},body:new Uint8Array(incoming)});
    form=await req.formData();
  }catch{return fail(400,"invalid_multipart");}
  const parts=[...form.entries()];
  if(parts.length!==1||parts[0][0]!=="file"||!(parts[0][1] instanceof File))
    return fail(400,"single_xlsx_file_required");
  const file=parts[0][1] as File;
  if(!/\.xlsx$/i.test(file.name)||file.size===0||file.size>8_000_000)
    return fail(400,"invalid_xlsx_file");
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(bytes[0]!==0x50||bytes[1]!==0x4b)return fail(422,"invalid_xlsx_file");
  try{
    const info=await inspectXlsxColumns(bytes);
    return Response.json({data:info,applied:false},{headers:PRIVATE});
  }catch(error:unknown){
    // Only expose allowlisted, actionable validation codes. Never echo workbook
    // values, proprietary sheet contents, library stacks or filenames.
    const safeCodes=new Set([
      "multiple_worksheets","legacy_reconciliation_sheet","missing_company_sku_column","missing_editable_columns",
      "too_many_columns","too_many_rows","invalid_xlsx_size",
      "invalid_xlsx_workbook","xlsx_too_many_parts","xlsx_xml_too_large",
      "invalid_column_heading"
    ]);
    const reason=error instanceof Error?error.message:"";
    return fail(422,safeCodes.has(reason)?reason:"xlsx_decode_failed");
  }
}
