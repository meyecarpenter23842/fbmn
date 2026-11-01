# ADM-05 P2 — Danh mục và quy cách Futurebook (01/11/2026)

Refs: issue #41, ADM-02 #19, `docs/roadmap.md` §4.0. P1 PR #75 đã merge.

## Scope
- Cây danh mục tối đa **2 cấp**, tự tạo bằng popup (Owner) và gắn SKU vào một danh mục. Danh mục chỉ dùng để tổ chức/lọc; **không tạo SKU**.
- Form thêm/sửa popup: mã công ty (chỉ tạo, không sửa), tên, danh mục, barcode, khổ. Trường phụ trong mục mở rộng: trang, dòng kẻ, GSM, loại bìa, đơn vị, đóng gói, số đơn vị/quy đổi.
- `product_spec` JSONB hiện hữu lưu quy cách; PATCH merge từng thuộc tính thay vì ghi đè toàn bộ JSON. Kiểm tra revision chống cập nhật lỗi thời.
- Không nhập giá NET, XNT; không tự suy ra quy đổi/loại bìa/GSM khi chưa có nguồn. Thiếu thông tin được để trống. Barcode được phép trùng.
- Family vẫn là nhóm hiển thị thủ công, khác danh mục và khác SKU. Một SKU không phân tách theo mẫu bìa.
- P3 Excel cập nhật/export, P4 ảnh R2, P5 phát hành ra web **chưa làm**.

## Release / rollback
Không có thay đổi database nào tự chạy lúc merge. **Trước khi triển khai Worker/Admin P2**, trên Neon Admin staging riêng:
1. Backup/snapshot có thể rollback; kiểm tra schema `fbmn_catalog`, role `fbmn_admin_http_staging` còn đúng.
2. Chạy `backend/neon/migrations/20261101_adm05_p2_categories.up.sql` ở staging; xác nhận có bảng `categories`, cột `skus.category_id`, role chỉ có SELECT/INSERT bảng categories.
3. Chỉ sau đó mới deploy thủ công Worker Admin staging và giao diện `fbmn-admin`. Đăng nhập Owner và thử tạo cha/con, thêm/sửa 0114 giả lập **trong môi trường tách biệt** nếu cần; không tạo SKU kiểm thử trong catalogue chung.
4. Kiểm tra 401, 403, revision 409 và rằng `/v1/public/*` không có NET/giá nội bộ, không có hành động publish. Không đưa P2 lên production nếu chưa xác nhận truy vấn E2E staging.

Rollback UI/Worker về commit cũ **trước**, rồi migration `.down.sql` (sẽ xóa taxonomy labels/associations vừa tạo; chỉ áp dụng khi đã có bản sao lưu và thống nhất mất dữ liệu danh mục). Không đổi dữ liệu SKU, giá, ảnh hay trạng thái công khai từ việc merge PR.
