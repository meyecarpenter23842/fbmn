import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("Owner Apply verifies strict multipart byte cap before parsing any form data",()=>{
  const api=read("apps/admin/app/api/catalogue/apply/route.ts");
  assert.match(api,/boundedMultipartBytes\(request\)/);
  assert.match(api,/const reader=request\.body\?\.getReader\(\)/);
  assert.match(api,/size>8100000/);
  assert.match(api,/reader\.cancel\(\)/);
  assert.match(api,/new Request\(request\.url/);
  assert.doesNotMatch(api,/fields=await request\.formData\(\)/);
  assert.match(api,/confirm!=="NHAP_BAN_NHAP"/);
  assert.match(api,/snapshot_changed_or_contains_existing_skus/);
  assert.match(api,/preview\.totals\.error!==0/);
  assert.ok(api.includes("/v1/admin/catalogue/apply"));
});
test("Private Worker uses exact original company SKU key and draft-only publishing scope",()=>{
  const source=read("backend/admin-api/catalogue-service.mjs");
  assert.match(source,/typeof x==="string" && x\.length>0/);
  assert.match(source,/sku_cong_ty\.toUpperCase\(\)/);
  assert.match(source,/fbmn_catalog\.skus/);
  assert.match(source,/draft_import/);
  assert.match(source,/published:0/);
  assert.match(source,/BTRIM\(ten_goc_xnt\)/);
  // P5 publication is now allowed only in the separate Owner-only visibility route.\n  assert.doesNotMatch(source,/fbmn_catalog_private|INSERT INTO fbmn_public/);\n  assert.match(source,/actor.role!=="owner"\)return fail\("owner_required",403\)/);
});

test("JSON catalog relay bounds chunked body before forwarding Worker request",()=>{
  const relay=read("apps/admin/app/api/catalogue/[action]/route.ts");
  assert.match(relay,/boundedJsonText\(request\)/);
  assert.match(relay,/length>650000/);
  assert.match(relay,/reader\.cancel\(\)/);
  assert.doesNotMatch(relay,/body:await request\.text\(\)/);
  const service=read("backend/admin-api/catalogue-service.mjs");
  assert.ok(service.includes("s.ten_goc_bang_gia"));
});
