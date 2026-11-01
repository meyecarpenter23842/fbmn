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
  assert.match(manager,/<details className="catalogue-editor catalogue-variant-details">/);
  assert.match(manager,/onClick=\{onImport\}/);
  assert.match(manager,/value="withdrawn"/);
  assert.match(manager,/review_status:editStatus/);
  assert.match(manager,/sku_cong_ty:editing.sku_cong_ty/);
  assert.match(manager,/Không có chức năng xuất bản/);
});

test("Reconciliation file import chooses one original workbook with no manual tab selection",()=>{
  assert.match(importer,/Chỉ chọn <b>một file đối chiếu<\/b>/);
  assert.match(importer,/không phải chọn hay xóa sheet/);
  assert.match(importer,/Futurebook_Doi_Chieu_XNT_BangGia_Anh_28102026.xlsx/);
  assert.match(importer,/file MASTER ảnh là nguồn dữ liệu khác/);
  assert.match(importer,/database_queried!==true \|\| data.applied!==false/);
});
