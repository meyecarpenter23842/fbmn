# ADM-05 / P4 — Quản lý ảnh R2 riêng tư và nhóm mẫu

Phạm vi Issue #41, roadmap 4.0. Tiếp nối P1–P3; không mở thêm workflow duyệt SKU/ảnh.

## Owner UX

- Một SKU đúng mã công ty (0114 khác 114) có 0–20 ảnh. Thiếu ảnh để placeholder, không tự sinh SKU hay hình ảnh.
- Danh sách sản phẩm → Thêm ảnh hoặc ... → Quản lý ảnh R2 → popup: tối đa 5 ảnh một lần, chọn bìa đại diện, sắp xếp, gỡ khỏi SKU, gắn thủ công ảnh từ thư viện.
- Tính năng nhóm SKU cùng family hiện có vẫn dùng family_id, mã công ty của từng quy cách vẫn giữ nguyên.
- Chấp nhận JPEG/PNG/WebP tối đa 5 MiB, 32–8192 px, Worker kiểm tra bytes/định dạng và lưu SHA256; không nhận SVG/PDF/GIF.
- R2 key private/catalogue/UUID.ext, không suy mã từ tên file. Bucket fbmn dùng lại; không tạo bucket hoặc bật public domain/r2.dev.
- media_assets và sku_media liên kết thủ công, dùng trạng thái kỹ thuật nội bộ; không công khai hoặc duyệt ảnh. Gỡ ảnh khỏi SKU giữ lại object R2 để tránh phá ảnh chia sẻ cho SKU khác.
- API riêng Admin: list, library, file, upload, link POST/DELETE, order PATCH. JWT + role + same-origin + limiter. Owner ghi ảnh, editor/admin chỉ xem. Trình duyệt không có R2 key.
- P5 mới xử lý ẩn/hiện theo kênh và website. Không public giá NET, stock, dữ liệu khách hàng.

## Phát hành và kiểm thử

1. CI 4/4 + Codex exact HEAD sạch → squash merge P4.
2. Áp dụng migration staging 20261102_adm05_p4_private_media.up.sql (chỉ GRANT và index, không ghi SKU). Down migration thu hồi grant/index mà không xóa ảnh.
3. Cấu hình binding ADMIN_MEDIA_R2 đến bucket fbmn trên **Admin staging Worker**, giữ Auth/Hyperdrive/rate limiter. Deploy bundle cùng main SHA.
4. Kiểm tra private API: no bearer 401, role khác 403, đọc 613 SKU hiện tại và gallery 200 với Owner. Upload ảnh thật chỉ khi Owner cung cấp/tự chọn, không tự gắn ảnh mẫu vào SKU.
5. Deploy Admin Vercel thủ công rồi kiểm tra alias READY và SHA. Test bìa đại diện, thứ tự, gỡ và gắn thư viện qua popup.
6. Không deploy public API, không gán ảnh theo tên filename hoặc tự xuất bản.

## Acceptance

- [ ] Staging migration và role grants hoạt động
- [ ] R2 binding and Admin Worker deployment verified
- [ ] CI/review và test security/upload/rollback xanh
- [ ] Owner upload ảnh thật và nghiệm thu qua trình duyệt
- [ ] Không ghi đè SKU, không cần ảnh khi lưu sản phẩm, không lộ NET
