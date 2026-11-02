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

## P4 bổ sung — quét ảnh R2 theo SKU và tối ưu ảnh (02/11/2026)

- Owner bấm **Quét ảnh đã tải thủ công lên R2** trong popup quản lý ảnh. Worker chỉ quét
  tiền tố riêng tư `private/catalogue/` (tối đa 1.000 object một lần), loại bỏ object
  đã đăng ký trong `media_assets`. Không quét tự động hoặc publish.
- Quy tắc tên ảnh gốc có thể ghép: `L536.png`, `L536.webp`, `L536-01.png`,
  `L536-02.jpg`. So sánh **chính xác** với SKU đang có trong DB; giữ `0114`
  khác `114`, `C592` khác `C5921`. Nếu `L536-01` đồng thời là SKU thật
  và mẫu `01` của `L536`, **không gán** vì mơ hồ. Mã không có trong DB cũng
  không gán. Chỉ Owner chọn (tối đa 10 object/lần), xác nhận và mới ghi DB.
- Import từ R2 **không copy, xóa hay ghi đè** object nguồn. Mỗi object nhập dùng
  `r2_key` gốc, kiểm bytes/kích thước, SHA256, kháng trùng theo SKU và transaction
  revision/row locking. Thiếu ảnh tiếp tục dùng placeholder.
- Mỗi ảnh upload **qua Admin** hoặc gắn từ R2 trong luồng Owner được tạo bản
  WebP riêng, cạnh dài <=1600 px (website) và thumbnail <=320 px, chất lượng 82%.
  Ảnh gốc giữ nguyên. Trình duyệt xử lý WebP, Worker kiểm bytes/format/dimensions
  và lưu sidecar `private/catalogue/renditions/<asset-id>/(web|thumb).webp`.
  Nếu trình duyệt không xuất WebP, ảnh gốc vẫn hoạt động, có nút **Tối ưu WebP**
  để làm lại; tránh giả báo thành công. Gallery đọc thumbnail, fallback về gốc.
- Ảnh upload mới qua Admin dùng đường dẫn theo SKU, ví dụ
  `private/catalogue/by-sku/L536/<asset-uuid>/L536.png` và ảnh kế tiếp
  `.../<asset-uuid>/L536-02.png`. UUID là thư mục phiên bản để không ghi đè.
  Ảnh cũ dạng `private/catalogue/<uuid>.png` **không tự đổi tên**, vẫn dùng
  `sku_media` để tìm đúng mã. Ảnh upload thủ công `L536.webp` được nhận ở bước quét.
- Admin/API cần được deploy **thủ công** theo quy trình owner sau khi CI + Codex
  sạch; môi trường staging được dùng để nghiệm thu bằng ảnh thật trước P5.
