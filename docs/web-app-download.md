# Website — popup tải ứng dụng do Admin quản lý

Owner 14/11/2026: nút/auto-popup Tải ứng dụng trên Website là chức năng riêng, không phải CMS Banner & Popup quảng bá.

## Luồng thật

- Admin Website Futurebook → Popup tải ứng dụng (Owner): bật/tắt tự hiện, nút menu/footer, lần đầu (500–15.000 ms), cooldown (30–1.440 phút), tiêu đề, mô tả, link iOS và CH Play.
- GET/POST cùng origin /api/website/app-download: xác thực Owner token; Worker /v1/admin/website/app-download kiểm tra role, revision (409 xung đột), host allowlist, transaction và audit. Không ghi SKU/NET/CMS.
- Migration 20261114_web_app_download_config.up.sql tạo bảng singleton + audit và public view security_barrier, grant chỉ role Admin và public read-only.
- Public Worker /v1/public/app-download dùng fixed SQL từ view; không public actor/audit. Website /api/app-download proxy no-store, validate payload. React provider fetch khi mở/đổi trang/tab quay lại: không cần redeploy Website khi Owner đổi cài đặt.
- Chưa có link chính thức: cửa hàng vô hiệu và ghi Sắp có, không bịa link. Mặc định 1,4 giây / 120 phút và nút vẫn bật như UX cũ; Catalogue/Policy không tự hiện, Policy không popup.
- Nếu public config thất bại: auto popup và nút fail closed. Admin hiển thị lỗi Worker/DB, không báo lưu giả.

## Thứ tự phát hành (Owner phải duyệt riêng)

1. Merge và đồng bộ hai repo sau CI + Codex sạch.
2. Owner duyệt migration Neon, snapshot và quyền role; không tự migration.
3. Owner duyệt deploy Admin Worker + Public Worker sau dry run.
4. Owner duyệt deploy Website + Admin production.
5. UAT: Owner vào Admin Website Futurebook → Popup tải ứng dụng → Tải lại/Lưu → kiểm revision; Website www.fbmn.vn có/không popup, thời gian và cooldown, nút menu/footer, URL thật App Store/CH Play, Policy/Catalogue, mobile/desktop, keyboard/Escape.
6. Rollback cấu hình qua Admin; rollback code bằng deployment cũ sau khi xét schema.

## Liên hệ

Owner xác nhận 84 90 154 77 45, tel:+84901547745. Footer hiển thị Email, Điện thoại, Địa chỉ cùng hàng với giá trị theo từng dòng. Trang Liên hệ/Giới thiệu dùng một cấu hình liên hệ chính thức.
