import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const manager=read("apps/admin/app/catalogue-manager.tsx");
const importer=read("apps/admin/app/catalogue-import-preview.tsx");

test("Everyday product management has one search and one actionable review toggle, not five status choices",()=>{
  assert.match(manager,/Tìm mã công ty \/ tên \/ nhóm/);
  assert.match(manager,/Chỉ xem mã cần kiểm tra/);
  assert.match(manager,/status==="needs_review"\?"all":"needs_review"/);
  assert.doesNotMatch(manager,/<option value="all">Tất cả<\/option>/);
  assert.doesNotMatch(manager,/<option value="approved">Đã duyệt<\/option>/);
  assert.match(manager,/<th>Lưu ý<\/th>/);
  assert.match(manager,/catalogue-simple-kpis/);
});

test("Advanced administration is collapsed by default without removing internal controls",()=>{
  assert.match(manager,/<details className="catalogue-import-advanced">/);
  assert.match(manager,/<details className="catalogue-editor-advanced">/);
  assert.match(manager,/editing&&<ProductModal/);
  assert.match(manager,/showGroup&&<ProductModal/);
  assert.match(manager,/onClick=\{\(\)=>setShowImport\(true\)\}/);
  assert.match(manager,/showImport&&<ProductModal/);
  assert.match(manager,/value="withdrawn"/);
  assert.match(manager,/review_status:editStatus/);
  assert.match(manager,/sku_cong_ty:editing.sku_cong_ty/);
  assert.match(manager,/Không có chức năng xuất bản/);
});

test("Reconciliation file import chooses one original workbook with no manual tab selection",()=>{
  assert.match(importer,/Mẫu thông dụng: 1 sheet SAN PHAM/);
  assert.match(importer,/tự tìm sheet phù hợp/);
  assert.match(importer,/File đối chiếu 8 sheet cũ/);
  assert.match(importer,/Tải mẫu Excel 1 sheet/);
  assert.match(importer,/database_queried!==true \|\| data.applied!==false/);
});
