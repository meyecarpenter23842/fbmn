import {readXlsxSkuRows} from "@/lib/sku-xlsx-adapter.mjs";
import {planSheetSync} from "@/lib/sheet-sync.mjs";
import {createHash} from "node:crypto";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=30;
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:{"Cache-Control":"private, no-store"}});
function baseUrl(){
  try{const u=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
    if(u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/")return u.origin;
  }catch{}return null;
}
async function readBounded(request:Request){
  const reader=request.body?.getReader();
  if(!reader)return null;
  const parts:Uint8Array[]=[];
  let total=0;
  for(let part=await reader.read();!part.done;part=await reader.read()){
    total+=part.value.byteLength;
    if(total>8_100_000){await reader.cancel();return null;}
    parts.push(part.value);
  }
  const bytes=new Uint8Array(total);let at=0;
  for(const part of parts){bytes.set(part,at);at+=part.length;}
  return bytes;
}
export async function POST(request:Request){
  const origin=new URL(request.url).origin;
  if(request.headers.get("origin")!==origin||request.headers.get("sec-fetch-site")==="cross-site")
    return fail(403,"origin_forbidden");
  const auth=request.headers.get("authorization")||"";
  if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(auth)||auth.length>12010)return fail(401,"invalid_bearer");
  if(!request.headers.get("content-type")?.startsWith("multipart/form-data"))
    return fail(415,"unsupported_media_type");
  const base=baseUrl();if(!base)return fail(503,"admin_api_unavailable");
  try{
    // Owner authorization before parsing private XLSX contents.
    const role=await fetch(base+"/v1/admin/session",{headers:{Authorization:auth,Accept:"application/json"},
      redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(7000)});
    if(role.status===401)return fail(401,"unauthenticated");
    if(role.status===403)return fail(403,"forbidden");
    if(!role.ok || (await role.json())?.data?.role!=="owner")return fail(403,"owner_required");
  }catch{return fail(503,"admin_api_unavailable");}
  if(Number(request.headers.get("content-length")||0)>8_100_000)return fail(413,"file_too_large");
  let fields:FormData;
  try{
    const bytes=await readBounded(request);if(!bytes)return fail(413,"file_too_large");
    const req=new Request(origin+"/api/catalogue/sync",{method:"POST",
      headers:{"content-type":request.headers.get("content-type")||""},body:new Uint8Array(bytes)});
    fields=await req.formData();
  }catch{return fail(400,"invalid_multipart");}
  const keys=[...fields.keys()].sort().join(",");
  if(!["confirm,expectedCreate,expectedUpdate,file,fingerprint",
       "confirm,expectedCreate,expectedUpdate,file,fingerprint,mapping",
       "clearFields,confirm,expectedCreate,expectedUpdate,file,fingerprint,mapping"].includes(keys))
    return fail(400,"invalid_form");
  let columnMapping:string[]|undefined;
  if(fields.has("mapping")){
    const raw=fields.get("mapping");
    if(typeof raw!=="string"||raw.length>600)return fail(400,"invalid_column_mapping");
    try{
      const decoded:unknown=JSON.parse(raw);
      if(!Array.isArray(decoded)||decoded.length>40||decoded.some(x=>typeof x!=="string"))
        return fail(400,"invalid_column_mapping");
      columnMapping=decoded;
    }catch{return fail(400,"invalid_column_mapping");}
  }
  let clearFields:string[]|undefined;
  if(fields.has("clearFields")){
    const raw=fields.get("clearFields");
    if(typeof raw!=="string"||raw.length>500)return fail(400,"invalid_clear_fields");
    try{
      const decoded:unknown=JSON.parse(raw);
      const allowed=new Set(["barcode","size","pages","ruling","category_label",
        "gsm","cover_type","unit","packaging","units_per_pack"]);
      if(!Array.isArray(decoded)||decoded.length>10||
         decoded.some(key=>typeof key!=="string"||!allowed.has(key))||
         new Set(decoded).size!==decoded.length)
        return fail(400,"invalid_clear_fields");
      clearFields=decoded;
    }catch{return fail(400,"invalid_clear_fields");}
  }
  if(clearFields?.length&&(!columnMapping||clearFields.some(key=>!columnMapping.includes(key))))
    return fail(400,"invalid_clear_fields");
  const file=fields.get("file"),confirm=fields.get("confirm"),fingerprint=fields.get("fingerprint");
  const expectedCreate=Number(fields.get("expectedCreate")),expectedUpdate=Number(fields.get("expectedUpdate"));
  if(!(file instanceof File)||file.size===0||file.size>8_000_000||!/\.xlsx$/i.test(file.name)||
     confirm!=="SYNC_SAN_PHAM"||typeof fingerprint!=="string"||!/^[0-9a-f]{64}$/.test(fingerprint)||
     !Number.isSafeInteger(expectedCreate)||expectedCreate<0||
     !Number.isSafeInteger(expectedUpdate)||expectedUpdate<0)
    return fail(400,"invalid_confirmation");
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(bytes[0]!==0x50||bytes[1]!==0x4b)return fail(422,"invalid_workbook");
  let existing:unknown[];
  try{
    const r=await fetch(base+"/v1/admin/catalogue/snapshot",{
      method:"GET",headers:{Authorization:auth,Accept:"application/json"},
      redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(10000)});
    if(!r.ok)return fail(r.status===403?403:503,"catalogue_snapshot_unavailable");
    existing=(await r.json())?.data?.items;
    if(!Array.isArray(existing)||existing.length>20000 ||
       existing.some(row=>!row||typeof row!=="object"||!("sku_cong_ty" in row)||typeof row.sku_cong_ty!=="string"))
      return fail(503,"catalogue_snapshot_invalid");
  }catch{return fail(503,"catalogue_snapshot_unavailable");}
  try{
    const parsed=await readXlsxSkuRows(bytes,columnMapping?{columnMapping}:{});
    if(parsed.source_sheet!=="SAN PHAM")return fail(400,"one_sheet_only");
    const categoryResponse=await fetch(base+"/v1/admin/catalogue/categories",{
      method:"GET",cache:"no-store",redirect:"manual",
      headers:{Authorization:auth,Accept:"application/json"},
      signal:AbortSignal.timeout(9000),
    });
    if(!categoryResponse.ok)return fail(503,"categories_unavailable");
    const categories=(await categoryResponse.json())?.data?.items;
    if(!Array.isArray(categories)||categories.length>1000)return fail(503,"categories_unavailable");
    const mappedFields=columnMapping?.filter(key=>key!=="sku"&&key!=="ignore")
      .map(key=>key==="size"?"paper_size":key==="title"?"ten_san_pham":key);
    const effectiveClear=clearFields?.map(key=>key==="size"?"paper_size":key);
    const plan=planSheetSync(parsed,existing,categories,{mappedFields,clearFields:effectiveClear});
    const digest=createHash("sha256").update(bytes)
      .update(JSON.stringify(columnMapping??null))
      .update(JSON.stringify(clearFields??null))
      .update(JSON.stringify(plan.operations)).digest("hex");
    if(digest!==fingerprint||plan.totals.conflict||plan.totals.error||
       plan.totals.create!==expectedCreate||plan.totals.update!==expectedUpdate||
       plan.operations.length<1||plan.operations.length>1000)
      return fail(409,"snapshot_changed_repreview_required");
    // Worker revalidates exact updates, locks revisions, and commits the whole batch or none.
    const r=await fetch(base+"/v1/admin/catalogue/sync",{
      method:"POST",headers:{Authorization:auth,"Content-Type":"application/json",Accept:"application/json"},
      body:JSON.stringify({confirm:"SYNC_SAN_PHAM",expectedCreate,expectedUpdate,operations:plan.operations}),
      redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(20000)});
    if(![201,400,401,403,409,503].includes(r.status))return fail(503,"catalogue_sync_unavailable");
    const raw=await r.text();
    if(raw.length>5000||!r.headers.get("content-type")?.includes("application/json"))
      return fail(503,"catalogue_sync_unavailable");
    return new Response(raw,{status:r.status,headers:{"Content-Type":"application/json",
      "Cache-Control":"private, no-store"}});
  }catch{return fail(422,"invalid_workbook");}
}
