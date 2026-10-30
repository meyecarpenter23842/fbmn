import {readXlsxSkuRows,previewXlsxImport} from "@/lib/sku-xlsx-adapter.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=30;
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,
  headers:{"Cache-Control":"private, no-store"}});
function baseUrl(){
  try{const u=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
    if(u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/")
      return u.origin;}catch{}
  return null;
}
async function boundedMultipartBytes(request: Request): Promise<Uint8Array|null> {
  const reader=request.body?.getReader();
  if(!reader)return null;
  const parts:Uint8Array[]=[];
  let size=0;
  for (let next=await reader.read();!next.done;next=await reader.read()) {
    size+=next.value.byteLength;
    if(size>8100000){await reader.cancel();return null;}
    parts.push(next.value);
  }
  const data=new Uint8Array(size);
  let offset=0;
  for(const part of parts){data.set(part,offset);offset+=part.byteLength;}
  return data;
}
export async function POST(request:Request){
  const origin=new URL(request.url).origin;
  if(request.headers.get("origin")!==origin ||
    request.headers.get("sec-fetch-site")==="cross-site")return fail(403,"origin_forbidden");
  const auth=request.headers.get("authorization")||"";
  if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(auth)||auth.length>12010)
    return fail(401,"invalid_bearer");
  if(!request.headers.get("content-type")?.startsWith("multipart/form-data"))
    return fail(415,"invalid_content_type");
  if(Number(request.headers.get("content-length")||0)>8_100_000)
    return fail(413,"file_too_large");
  const base=baseUrl();
  if(!base)return fail(503,"admin_api_unavailable");
  let fields:FormData;
  try{
    const bounded=await boundedMultipartBytes(request);
    if(!bounded)return fail(413,"file_too_large");
    const safe=new Request(request.url,{method:"POST",headers:{"content-type":request.headers.get("content-type")||""},body:new Uint8Array(bounded)});
    fields=await safe.formData();
  }catch{return fail(400,"invalid_form_data");}
  if([...fields.keys()].length!==3 || !fields.has("file") || !fields.has("confirm") || !fields.has("expectedCreate"))return fail(400,"invalid_form_data");
  const file=fields.get("file");
  const confirm=fields.get("confirm");
  const expected=Number(fields.get("expectedCreate"));
  if(!(file instanceof File)||!/\.xlsx$/i.test(file.name)||file.size===0||file.size>8_000_000 ||
    confirm!=="NHAP_BAN_NHAP"||!Number.isSafeInteger(expected)||expected<1||expected>1000)
    return fail(400,"owner_confirmation_required");
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(bytes[0]!==0x50||bytes[1]!==0x4b)return fail(422,"invalid_workbook");
  let existing:unknown[];
  try{
    const r=await fetch(base+"/v1/admin/catalogue/snapshot",{headers:{Authorization:auth,
      Accept:"application/json"},method:"GET",cache:"no-store",redirect:"manual",
      signal:AbortSignal.timeout(10000)});
    if(!r.ok)return fail(r.status===403?403:503,"catalogue_snapshot_unavailable");
    const data=await r.json();
    existing=data?.data?.items;
    if(!Array.isArray(existing)||existing.length>20000 || existing.some(row=>!row||typeof row!=="object"||!("sku_cong_ty" in row)||typeof row.sku_cong_ty!=="string"))return fail(503,"catalogue_snapshot_invalid");
  }catch{return fail(503,"catalogue_snapshot_unavailable");}
  try{
    const preview=await previewXlsxImport(bytes,existing as object[]);
    if(preview.totals.create!==expected || preview.totals.error!==0 ||
       preview.totals.conflict!==0 || preview.totals.update!==0 ||
       preview.totals.unchanged!==0) return fail(409,"snapshot_changed_or_contains_existing_skus");
    const parsed=await readXlsxSkuRows(bytes);
    const rows=parsed.rows.map((source:Record<string,unknown>,index:number)=>({
      sku_cong_ty:source.sku_cong_ty,
      ten_goc_xnt:source.ten_goc_xnt,
      ten_san_pham:source.ten_san_pham,
      barcode:source.barcode,
      paper_size:source.paper_size,
      pages:parsed.evidence[index].specifications.pages,
      ruling:parsed.evidence[index].specifications.ruling,
      warnings:parsed.evidence[index].warnings,
    }));
    // SQL Worker performs an atomic, duplicate-safe import and requires Owner role.
    const r=await fetch(base+"/v1/admin/catalogue/apply",{
      method:"POST",redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(20000),
      headers:{Authorization:auth,"Content-Type":"application/json",Accept:"application/json"},
      body:JSON.stringify({confirm:"NHAP_BAN_NHAP",expectedCreate:rows.length,rows}),
    });
    if(![201,400,401,403,409,503].includes(r.status))return fail(503,"catalogue_apply_unavailable");
    const body=await r.text();
    if(body.length>4096||!r.headers.get("content-type")?.includes("application/json"))
      return fail(503,"catalogue_apply_unavailable");
    return new Response(body,{status:r.status,headers:{"Content-Type":"application/json",
      "Cache-Control":"private, no-store"}});
  }catch{return fail(422,"invalid_workbook");}
}
