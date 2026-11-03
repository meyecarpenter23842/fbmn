import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("price Excel UI needs only code and price; names are resolved privately",()=>{
 const ui=read("apps/admin/app/catalogue-pricebook-bulk.tsx");
 assert.match(ui,/File chỉ cần 2 cột: Mã công ty và Giá mới/);
 assert.match(ui,/r\.ten_san_pham/);
 assert.match(ui,/One bounded private preview request/);
 assert.match(ui,/setSource\(file\.name\.slice\(0,300\)\)/);
 assert.match(ui,/<details className="fb-price-bulk-advanced">/);
 assert.match(ui,/const needsReview=count\("sku_cong_ty"\)!==1\|\|count\("amount_vnd"\)!==1/);
 assert.match(ui,/!mappingVerified/);
 assert.match(ui,/Chỉnh cột/);
 assert.match(ui,/Dùng 2 cột đã chọn/);
 assert.match(ui,/!mapping\.includes\("sku_cong_ty"\)\|\|!mapping\.includes\("amount_vnd"\)/);
 assert.match(ui,/TEST_ONLY/);
 assert.match(ui,/const sheetTest=sourceIndex>=0/);
 assert.match(ui,/setPreviewOnlyFile\(sheetTest/);
 assert.match(ui,/if\(previewOnlyFile\|\|/);
 assert.match(ui,/preview\.invalid>0/);
 assert.match(ui,/preview_fingerprint:preview\.preview_fingerprint/);
 assert.match(ui,/confirm:"XAC_NHAN_GIA_NHAP"/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage|console\.log/);
});

test("XLSX export and template only have code and amount, with code formatted as text",()=>{
 const ex=read("apps/admin/app/api/pricing/export/route.ts");
 assert.match(ex,/sheet\.addRow\(\["Mã công ty","Giá mới \(VND\)"\]\)/);
 assert.match(ex,/sheet\.getColumn\(1\)\.numFmt="@"/);
 assert.match(ex,/if\(!template\)for\(const item of items\)/);
 assert.doesNotMatch(ex,/"Tên sản phẩm","Giá mới/);
 assert.match(ex,/Owner|owner_required/);
 assert.match(ex,/const remoteQuery=new URLSearchParams\(\{kind\}\)/);
 assert.match(ex,/remoteQuery\.toString\(\)/);
 assert.doesNotMatch(ex,/\/v1\/admin\/pricing\/bulk"\+url\.search/);
});
