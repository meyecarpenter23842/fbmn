import { previewXlsxImport,readXlsxSkuRows } from "@/lib/sku-xlsx-adapter.mjs";
import { planSheetSync } from "@/lib/sheet-sync.mjs";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

const MAX_XLSX_BYTES = 8_000_000;
const MAX_MULTIPART_BYTES = MAX_XLSX_BYTES + 65_536;
const ROLES = new Set(["editor", "admin", "owner"]);
const noStore = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const fail = (status: number, code: string) => Response.json(
  { error: { code } }, { status, headers: noStore }
);
function workerBase() {
  const base = process.env.FBMN_ADMIN_API_BASE_URL;
  try {
    if (!base) return null;
    const url = new URL(base);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return url.origin;
  } catch { return null; }
}
async function readWithCap(request: Request): Promise<Uint8Array | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_MULTIPART_BYTES) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return merged;
}

export async function POST(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  // Cross-site upload and CSRF must fail closed. No wildcard or token in URL.
  if (!origin || origin !== requestOrigin || request.headers.get("sec-fetch-site") === "cross-site")
    return fail(403, "origin_forbidden");
  const contentType = request.headers.get("content-type") || "";
  if (!/^multipart\/form-data;\s*boundary=[A-Za-z0-9'()+_,./:=?-]{1,200}(?:;|$)/i.test(contentType))
    return fail(415, "unsupported_media_type");
  const length = Number(request.headers.get("content-length") || "0");
  if (!Number.isFinite(length) || length < 0 || length > MAX_MULTIPART_BYTES)
    return fail(413, "file_too_large");
  const match = /^Bearer ([A-Za-z0-9._~+/-]+=*)$/.exec(request.headers.get("authorization") || "");
  if (!match || match[1].length > 12000) return fail(401, "invalid_bearer");
  const base = workerBase();
  if (!base) return fail(503, "admin_api_not_configured");

  // Admin Worker verifies Neon JWT and CURRENT database grants on every upload.
  // No file bytes are read or parsed before a successful DB-backed role check.
  let response: Response;
  try {
    response = await fetch(base + "/v1/admin/session", {
      method: "GET", headers: { Authorization: "Bearer " + match[1], Accept: "application/json" },
      cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(7000),
    });
  } catch { return fail(503, "admin_api_unavailable"); }
  if (response.status === 401) return fail(401, "unauthenticated");
  if (response.status === 403) return fail(403, "forbidden");
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json"))
    return fail(503, "admin_api_unavailable");
  let role: unknown;
  try { role = (await response.json()).data?.role; }
  catch { return fail(503, "admin_api_unavailable"); }
  if (typeof role !== "string" || !ROLES.has(role)) return fail(403, "insufficient_role");

  let incoming: Uint8Array | null;
  try { incoming = await readWithCap(request); }
  catch { return fail(400, "invalid_multipart"); }
  if (!incoming) return fail(413, "file_too_large");
  let fields: FormData;
  try {
    const safeRequest = new Request(requestOrigin + "/api/catalogue/preview", {
      method: "POST", headers: { "content-type": contentType }, body: new Uint8Array(incoming),
    });
    fields = await safeRequest.formData();
  } catch { return fail(400, "invalid_multipart"); }
  const parts = [...fields.entries()];
  if(parts.length<1||parts.length>3||
     parts.some(([key])=>!["file","mapping","clearFields"].includes(key))||
     parts.filter(([key])=>key==="file").length!==1 ||
     parts.filter(([key])=>key==="mapping").length>1||
     parts.filter(([key])=>key==="clearFields").length>1||
     !(fields.get("file") instanceof File))
    return fail(400,"invalid_upload_fields");
  const file=fields.get("file") as File;
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
  if (!/\.xlsx$/i.test(file.name) || file.size === 0 || file.size > MAX_XLSX_BYTES)
    return fail(400, "invalid_xlsx_file");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) return fail(400, "invalid_xlsx_file");

  try {
    // Verify CURRENT records in the restricted private Neon staging catalogue,
    // never guess that all 613 entries are new. Fail closed if DB is inaccessible.
    const snapshotResponse = await fetch(base + "/v1/admin/catalogue/snapshot", {
      method: "GET", cache: "no-store", redirect: "manual",
      headers: { Authorization: "Bearer " + match[1], Accept:"application/json" },
      signal: AbortSignal.timeout(9000),
    });
    if (!snapshotResponse.ok || !snapshotResponse.headers.get("content-type")?.includes("application/json"))
      return fail(503, "catalogue_snapshot_unavailable");
    const snapshotJson = await snapshotResponse.json();
    const existing = snapshotJson?.data?.items;
    if (!Array.isArray(existing) || existing.length > 20000 ||
        existing.some((record: {sku_cong_ty?:unknown}) => typeof record?.sku_cong_ty !== "string"))
      return fail(503, "catalogue_snapshot_invalid");
    // No NET prices, warehouse quantities, original image filenames or raw file.
    const result = columnMapping
      ? await previewXlsxImport(bytes,existing,{columnMapping})
      : await previewXlsxImport(bytes, existing);
    if(result.source_sheet==="SAN PHAM"){
      const parsed=await readXlsxSkuRows(bytes,columnMapping?{columnMapping}:{});
      const categoryResponse=await fetch(base+"/v1/admin/catalogue/categories",{
        method:"GET",cache:"no-store",redirect:"manual",
        headers:{Authorization:"Bearer "+match[1],Accept:"application/json"},
        signal:AbortSignal.timeout(9000),
      });
      if(!categoryResponse.ok)return fail(503,"categories_unavailable");
      const categories=(await categoryResponse.json())?.data?.items;
      if(!Array.isArray(categories)||categories.length>1000)return fail(503,"categories_unavailable");
      const mappedFields=columnMapping?.filter(key=>key!=="sku"&&key!=="ignore")
        .map(key=>key==="size"?"paper_size":key==="title"?"ten_san_pham":key);
      const effectiveClear=clearFields?.map(key=>key==="size"?"paper_size":key);
      const plan=planSheetSync(parsed,existing,categories,{mappedFields,clearFields:effectiveClear});
      const previewFingerprint=createHash("sha256")
        .update(bytes).update(JSON.stringify(columnMapping??null))
        .update(JSON.stringify(clearFields??null))
        .update(JSON.stringify(plan.operations)).digest("hex");
      return Response.json({
        ...result,totals:plan.totals,items:plan.items,
        previewFingerprint,source_sheet:"SAN PHAM",
        baseline:"actual_neon_staging_snapshot",database_queried:true,
        media_uploaded:false,applied:false,
      },{headers:noStore});
    }
    return Response.json({
      ...result, baseline: "actual_neon_staging_snapshot",
      database_queried: true, media_uploaded: false, applied: false,
    }, { headers: noStore });
  } catch (e: unknown) {
    // Never echo raw spreadsheet content or library exception messages.
    const code = e instanceof Error && /^(missing_master_sheet|too_many_rows|empty_master_sheet|invalid_xlsx_size|duplicate_header|missing_column:[A-Za-zÀ-ỹ0-9 ()\/.-]+)$/.test(e.message)
      ? "invalid_workbook_structure" : "invalid_workbook";
    return fail(422, code);
  }
}
