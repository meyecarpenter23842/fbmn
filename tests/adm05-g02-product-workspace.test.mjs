import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {safeProductSpec} from "../backend/admin-api/catalogue-service.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const manager=read("apps/admin/app/catalogue-manager.tsx");
const workspace=read("apps/admin/app/catalogue-product-workspace.tsx");
const media=read("apps/admin/app/catalogue-media-manager.tsx");
const styles=read("apps/admin/app/admin-refinement.css");
const workspaceCss=read("apps/admin/app/catalogue-workspace.css");
const backend=read("backend/admin-api/catalogue-service.mjs");
const publicRead=read("backend/public-api/read-model.mjs");

test("G02: descriptions are persisted through validated existing revisioned product_spec",()=>{
  const text="Mô tả có dấu tiếng Việt.";
  assert.deepEqual(safeProductSpec({short_description:text,long_description:text}),
    {short_description:text,long_description:text});
  assert.equal(safeProductSpec({short_description:"",long_description:null}).short_description,null);
  assert.throws(()=>safeProductSpec({short_description:"a".repeat(601)}),/invalid_product_spec/);
  assert.throws(()=>safeProductSpec({long_description:"b".repeat(6001)}),/invalid_product_spec/);
  assert.throws(()=>safeProductSpec({long_description:"bad\u0001"}),/invalid_product_spec/);
  assert.throws(()=>safeProductSpec({source_price_vnd:"5"}),/invalid_product_spec/);
  assert.match(manager,/short_description:spec.short_description.trim\(\)\|\|null/);
  assert.match(manager,/long_description:spec.long_description.trim\(\)\|\|null/);
  assert.match(backend,/product_spec=product_spec \|\| \$11::jsonb/);
  assert.match(backend,/revision=revision\+1,updated_at=now\(\)/);
  assert.match(backend,/draft_update/);
  assert.match(publicRead,/const gsm=strictGsm\(spec.gsm\)/);
  assert.doesNotMatch(publicRead,/values\.short_description|values\.long_description/);
});

test("G02: authenticated real cover links, no synthetic image and immutable company SKU",()=>{
  assert.match(backend,/photo.cover_asset_id,photo.cover_sha256/);
  assert.match(backend,/JOIN fbmn_catalog.media_assets a ON a.id=m.asset_id/);
  assert.match(backend,/CASE WHEN m.media_role='cover' THEN 0 ELSE 1 END/);
  assert.match(media,/export function PrivateImage/);
  assert.match(media,/headers:\{Authorization:"Bearer "\+key\}/);
  assert.match(manager,/row.cover_asset_id&&row.cover_sha256\?<PrivateImage/);
  assert.match(workspace,/selectedSku\?"Bản nháp nội bộ":"Chưa lưu"/);
  assert.match(workspace,/readOnly=\{!!selectedSku\|\|!editingAllowed\}/);
  assert.match(workspace,/Không tìm thấy mã phù hợp/);
  assert.match(workspace,/onNew/);
  assert.match(workspace,/onSelect/);
  assert.match(workspace,/CatalogueMediaManager key=\{selectedSku\}/);
  assert.match(manager,/sku_cong_ty:editing.sku_cong_ty/);
  assert.doesNotMatch(manager,/Number\(sku\)|parseInt\(sku/);
});

test("G02: one unified editor with saved-only photo upload and unsaved change guard",()=>{
  assert.match(manager,/\(create\|\|editing\)&&<ProductModal/);
  assert.match(manager,/startEditor=\(row:SKU\|null\)/);
  assert.match(manager,/if\(row&&editing\?\.sku_cong_ty===row\.sku_cong_ty\)return/);
  assert.match(manager,/closeEditor=\(\)=>/);
  assert.match(manager,/Thông tin chưa lưu sẽ bị bỏ qua/);
  assert.match(manager,/Đóng và bỏ những thay đổi chưa lưu/);
  assert.match(manager,/const latest=await api<\{items:SKU\[\]\}>\("skus"\)/);
  assert.match(manager,/onMediaChanged=\{\(\)=>void refresh\(\)\}/);
  assert.match(workspace,/selectedSku\?\s*<CatalogueMediaManager/);
  assert.match(workspace,/Lưu sản phẩm trước, sau đó thêm ảnh ngay tại đây/);
});

test("G02: responsive wide canvas and top-right profile",()=>{
  assert.match(styles,/\.workspace-main\s*\{\s*width:100%;\s*max-width:none;/);
  assert.match(styles,/\.top-actions\{margin-left:auto;justify-content:flex-end;/);
  assert.match(workspaceCss,/grid-template-columns:minmax\(190px,225px\)/);
  assert.match(workspaceCss,/@media\(max-width:640px\)/);
  assert.match(read("apps/admin/app/layout.tsx"),/import "\.\/catalogue-workspace.css"/);
});

test("G02: 613 long-description SKUs stay below bounded private relay response limit",()=>{
  const proxy=read("apps/admin/app/api/catalogue/[action]/route.ts");
  const catalogue={data:{items:Array.from({length:613},(_,i)=>({
    sku_cong_ty:String(i).padStart(4,"0"),
    ten_san_pham:"Sản phẩm "+i,
    product_spec:{short_description:"a".repeat(600),long_description:"b".repeat(6000)}
  }))}};
  const size=JSON.stringify(catalogue).length;
  assert.ok(size>2800000,"fixture must exceed old response cap");
  assert.ok(size<16000000,"fixture must fit updated bounded response cap");
  assert.match(proxy,/raw\.length>16000000/);
  assert.match(proxy,/invalid_catalogue_response/);
});
