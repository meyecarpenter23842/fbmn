import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const rootCsv=read("backend/catalogue/import-preview.mjs");
const adminCsv=read("apps/admin/lib/sku-import-preview.mjs");
const rootXlsx=read("backend/catalogue/xlsx-adapter.mjs");
const adminXlsx=read("apps/admin/lib/sku-xlsx-adapter.mjs");
const api=read("apps/admin/app/api/catalogue/preview/route.ts");
const ui=read("apps/admin/app/catalogue-import-preview.tsx");
const page=read("apps/admin/app/page.tsx");
const style=read("apps/admin/app/import-preview.css");
const adminPackage=JSON.parse(read("apps/admin/package.json"));

test("Admin bundle matches canonical read-only XLSX/CSV parsers, including source warnings", () => {
  assert.equal(adminCsv.replace(/^\/\/ Staging Admin bundle.*\n\/\/ Keep.*\n/,""),rootCsv);
  assert.equal(adminXlsx.replace(/^\/\/ Staging Admin bundle.*\n\/\/ Keep.*\n/,"").replace(
    'from "./sku-import-preview.mjs"', 'from "./import-preview.mjs"'),rootXlsx);
  assert.equal(adminPackage.dependencies.exceljs, "4.4.0");
  assert.equal(adminPackage.dependencies.jszip, "3.10.1");
  assert.equal(JSON.parse(read("package.json")).dependencies.jszip, "3.10.1");
});

test("Import endpoint allows only authenticated, DB-backed Admin preview, limits uploads and never writes", () => {
  assert.match(api,/export async function POST\(request: Request\)/);
  assert.match(api,/origin !== requestOrigin/);
  assert.match(api,/MAX_MULTIPART_BYTES/);
  assert.match(api,/readWithCap\(request\)/);
  assert.match(api,/const ROLES = new Set\(\["editor", "admin", "owner"\]\)/);
  assert.match(api,/new URL\(base\)/);
  assert.match(api,/\/v1\/admin\/session/);
  assert.match(api,/Authorization: "Bearer " \+ match\[1\]/);
  assert.match(api,/if \(response\.status === 403\) return fail\(403/);
  assert.match(api,/await previewXlsxImport\(bytes, existing\)/);
  assert.match(api,/database_queried: true, media_uploaded: false, applied: false/);
  assert.match(api,/private, no-store/);
  assert.doesNotMatch(api,/\b(INSERT|UPDATE|DELETE|CREATE TABLE|r2\.put|upsert|localStorage|console\.log)\b/i);
});

test("Import preview is reachable inside existing login-gated Admin without altering login", () => {
  assert.match(page,/section==="import-products" && <CatalogueImportPreview\/>/);
  assert.match(page,/<CatalogueManager onImport=\{\(\)=>navigate\("import-products"\)\}/);
  assert.match(page,/authState==="authorised" && <>/);
  assert.match(ui,/fetch\("\/api\/auth\/token"/);
  assert.match(ui,/fetch\("\/api\/catalogue\/preview"/);
  assert.match(ui,/Filter|filter|Lọc theo/);
  for (const text of ["Ngoại lệ cần duyệt","Thiếu ảnh","Chỉ XNT","Chỉ bảng giá","Lỗi / xung đột","Trang trước","Trang sau","Xuất báo cáo CSV"])
    assert.ok(ui.includes(text),text);
  assert.match(ui,/database_queried!==true \|\| data\.applied!==false/);
  assert.match(ui,/snapshot thật của Neon/);
  assert.match(ui,/Prevent spreadsheet formula injection/);
  assert.doesNotMatch(ui,/localStorage|sessionStorage/);
  assert.match(style,/@media\(max-width:480px\)/);
});

test("Existing migration, Net pricing and public API remain outside import preview", () => {
  const publicAPI=read("backend/public-api/handler.mjs");
  assert.doesNotMatch(api,/\bfbmn_catalog_private\b|\bsource_price_vnd\b|\bprice_evidence\b/);
  assert.doesNotMatch(ui,/\bnet_price\b|\bsource_price_vnd\b|\bprice_evidence\b/);
  assert.doesNotMatch(publicAPI,/\/v1\/admin\/catalogue\/preview/);
});
