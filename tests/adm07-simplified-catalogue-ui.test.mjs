import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const manager=read("apps/admin/app/catalogue-manager.tsx");
const importer=read("apps/admin/app/catalogue-import-preview.tsx");

test("Product management lists all SKUs with search, not business review filters",()=>{
  assert.match(manager,/Tìm mã công ty \/ tên \/ nhóm/);
  assert.match(manager,/catalogue-overview/);
  assert.match(manager,/<th>Ảnh<\/th>/);
  assert.match(manager,/<th>Hiển thị<\/th>/);
  assert.match(manager,/catalogue-image-placeholder/);
  assert.doesNotMatch(manager,/Chỉ xem mã cần kiểm tra|Cần rà soát|Cần kiểm tra|catalogue-editor-advanced|setEditStatus|setStatus/);
  assert.match(manager,/\[items,query,categories,categoryFilter\]/);
});

test("All routine operations keep real popup forms with a compact row actions menu",()=>{
  assert.match(manager,/\(create\|\|editing\)&&<ProductModal/);
  assert.match(manager,/<CatalogueProductWorkspace/);
  assert.match(manager,/showGroup&&<ProductModal/);
  assert.match(manager,/showImport&&<ProductModal/);
  assert.match(manager,/catalogue-actions-trigger/);
  assert.match(manager,/catalogue-actions-popover/);
  assert.match(manager,/createPortal\(/);
  assert.match(manager,/Sửa sản phẩm/);
  assert.match(manager,/Nhóm cùng dòng/);
  assert.match(manager,/sku_cong_ty:editing.sku_cong_ty/);
  assert.match(manager,/review_status:editing.review_status/);
  assert.doesNotMatch(manager,/review_status:editStatus/);
  assert.match(manager,/importBusy/);
});

test("Import accepts canonical 1-sheet or legacy format and shows technical outcomes only",()=>{
  assert.match(importer,/Mẫu thông dụng: 1 sheet SAN PHAM/);
  assert.match(importer,/tự tìm sheet phù hợp/);
  assert.match(importer,/File đối chiếu 8 sheet cũ/);
  assert.match(importer,/Tải mẫu Excel 1 sheet/);
  assert.match(importer,/database_queried!==true \|\| data.applied!==false/);
  assert.match(importer,/import-kpis-simple/);
  assert.match(importer,/Lỗi \/ xung đột/);
  assert.doesNotMatch(importer,/Ngoại lệ cần duyệt|Cần kiểm tra ngoại lệ|Ảnh ứng viên chưa duyệt|Xem cảnh báo/);
});
