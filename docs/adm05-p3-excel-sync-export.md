# ADM-05 P3 — Excel 1 sheet: cập nhật, xem trước và xuất danh mục (01/11/2026)

Refs: #41, #19, roadmap §4.0. Tiếp nối P1 #75 và P2 #76.

## Hành vi
1. Admin tải **Xuất Excel** hoặc **CSV** từ chính catalogue staging hiện tại; file XLSX có 1 sheet `SAN PHAM`, cột mã công ty/barcode ở TEXT. Không có NET, tồn kho, ảnh riêng hay dữ liệu khách hàng.
2. Điều chỉnh file XLSX bên ngoài; mã công ty không tự sinh/đổi. Để trống tên/quy cách/barcode của **SKU đã có** nghĩa là **giữ nguyên**, không tự xóa. Muốn xóa thuộc tính cần sửa thủ công sau (P3 không hỗ trợ xóa bằng blank).
3. Upload 1 sheet → phân tích read-only so với snapshot Neon → mới / sửa / không đổi / lỗi / xung đột. Trường sửa có giá trị **cũ → mới** và revision thực.
4. **Một lần bấm** xác nhận lưu cho sheet 1. Server kiểm lại nội dung file, fingerprint + snapshot mới. Worker chỉ Owner mới dùng được `/v1/admin/catalogue/sync`; áp tất cả create/update trong transaction và kiểm `expected_revision`. Xung đột rollback toàn bộ, không ghi đè.
5. Một số dữ liệu nguồn có tên gốc nhưng `ten_san_pham=null`: export dùng tên gốc, re-import cùng tên được nhận diện **unchanged**, tránh tạo cập nhật giả.
6. File đối chiếu lịch sử 8 sheet vẫn được parser nhận để xem trước và nhập **SKU mới** qua luồng cũ; tuyệt đối không sử dụng 8 sheet để sửa hàng loạt. Không có hàng đợi rà soát nghiệp vụ trong app.

## Phạm vi an toàn
- Chỉ nhập `sku_cong_ty`, tên, barcode, khổ, số trang, dòng kẻ. Không nhập/ghi NET, giá bán lẻ, tồn kho, R2 hay publication. Không sửa SKU theo bìa/mẫu/bao gói.
- SKU là STRING; `0114` khác `114`; số trong Excel (hoặc công thức) làm SKU bị từ chối, barcode numeric/formula cũng bị từ chối để tránh mất số 0 đầu.
- Ảnh thiếu và thông số trống vẫn được lưu; chỉ thực hiện khi Owner xác nhận.
- `product_spec` được merge theo key, các thuộc tính GSM/đóng gói đã có từ P2 không mất khi chỉ sửa số trang hoặc dòng kẻ.
- Giới hạn 8MB XLSX, tối đa 1000 SKU thay đổi/lần; file quá lớn hoặc xung đột phải chia đợt/nhập lại. Những dòng không đổi không tốn truy vấn ghi.

## Phát hành
Không deploy tự động khi merge P3. Cần bản backend Worker và Admin frontend **cùng commit** sau CI 4/4 và Codex sạch. Không cần migration mới. Kiểm thử Owner trên staging, anon 401, editor 403, revision 409, upload/export đối chiếu số lượng, đảm bảo không thay đổi channel_publication. Có rollback Worker về version trước và Vercel Admin về deployment trước. P4 R2 và P5 xuất bản public để riêng.
