import { previewXlsxImport } from "@/lib/sku-xlsx-adapter.mjs";

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
  if (parts.length !== 1 || parts[0][0] !== "file" || !(parts[0][1] instanceof File))
    return fail(400, "single_xlsx_file_required");
  const file = parts[0][1] as File;
  if (!/\.xlsx$/i.test(file.name) || file.size === 0 || file.size > MAX_XLSX_BYTES)
    return fail(400, "invalid_xlsx_file");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) return fail(400, "invalid_xlsx_file");

  try {
    // No existing-db snapshot yet: create is a WHAT-IF classification only.
    // No NET prices, warehouse quantities, image filenames or raw file are returned.
    const result = await previewXlsxImport(bytes, []);
    return Response.json({
      ...result, baseline: "empty_snapshot_hypothetical",
      database_queried: false, media_uploaded: false, applied: false,
    }, { headers: noStore });
  } catch (e: unknown) {
    // Never echo raw spreadsheet content or library exception messages.
    const code = e instanceof Error && /^(missing_master_sheet|too_many_rows|empty_master_sheet|invalid_xlsx_size|duplicate_header|missing_column:[A-Za-zÀ-ỹ0-9 ()\/.-]+)$/.test(e.message)
      ? "invalid_workbook_structure" : "invalid_workbook";
    return fail(422, code);
  }
}
