# DL7C — Cuốn Catalogue nằm trực tiếp trên nền R2

Phạm vi riêng tab /catalogue. Không sửa danh sách SKU, giá NET, Admin DL7B, menu, Trang chủ hay các tab khác.

## Dữ liệu thật

1. Admin DL7B tải ảnh WebP trang, bìa và hai ảnh nền vào bucket riêng fbmn-catalogue.
2. Neon tạo hai view bảo mật ở schema fbmn_public: v_catalogue_ready_books và v_catalogue_ready_assets; chỉ bộ READY và có ít nhất một trang mới hiện. Khi Admin ẩn bộ, cả manifest và ảnh đều không còn được phép tải.
3. Existing Public Worker dùng role đọc fbmn_p5_public_login, chỉ cho phép SQL trong danh sách kiểm soát. Endpoint GET /v1/public/catalogue-books trả danh sách; GET cùng ?id={uuid} trả manifest; GET /v1/public/catalogue-image?asset={uuid} kiểm tra READY lại mỗi request rồi đọc đúng object private trong R2.
4. Website dùng same-origin relay /api/catalogue-books và /api/catalogue-books/image. Không lộ key R2, không public bucket, không chia sẻ link chứa secret, không cache dữ liệu đã rút duyệt.
5. Giao diện sách trên nền trang (không iframe/PDF viewer), desktop mở hai trang, mobile mở một trang. Bìa xuất hiện ở trang bên phải trên desktop. Có nút/phím/màn hình cảm ứng, lật 3D, thumbnail, zoom dialog, fullscreen, chia sẻ deep-link book/page. Reduced-motion tắt animation.
6. Khi không có bộ READY (hiện tại DL7B chưa có ảnh thật), hiện thông báo đang cập nhật, không tự tạo mockup hoặc ảnh sản phẩm giả. Hotspot nhảy tới SKU chỉ thực hiện sau khi có mapping SKU đã duyệt.

## Release gates

- Source: PR repo phụ, CI và Codex review sạch, squash merge; sau đó đồng bộ main với repo chính theo quy trình.
- Migration: backend/neon/migrations/20261109_dl7c_catalogue_public.up.sql, rehearsal trước production; chỉ chạy khi Owner phê duyệt phát hành DL7C. Down chỉ xóa public views, không xóa DL7B metadata/ảnh.
- Public Worker: bổ sung binding CATALOGUE_MEDIA_R2 vào existing Worker. Giữ nguyên PUBLIC_MEDIA_R2 và các binding cũ. PUBLIC_DL7C_ENABLED mặc định false cho tới khi Owner bật khi release.
- Vercel Website deploy sau Worker; riêng DL7C không yêu cầu deploy Admin. Không kích hoạt GitHub Actions repo chính gây tốn quota.
- Nghiệm thu browser thật tại 1440/1280/768/390/360, bàn phím, swipe, zoom, fullscreen Escape, loading/empty/error, withdrawn asset 404, WebP MIME, không lộ NET; dùng ảnh được Owner upload từ DL7B. Mốc DL8 vẫn dành cho regression tổng thể.
