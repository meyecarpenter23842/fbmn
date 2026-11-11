# DL12C — CEO Web Push, badge khách mới và deep link

**Chỉ Futurebook CEO.** DL12B PostHog đang lỗi và không nằm trong scope.
**Trạng thái: mã nguồn đang review; chưa chạy migration/secret/deploy production.**

## Luồng hoạt động

- Flutter nút chuông Bật/Tắt với permission chỉ sau thao tác người dùng; service worker phạm vi /ceo/.
- Vercel Next.js đăng ký subscription bằng JWT Neon Owner, same-origin và kiểm tra Origin; endpoint trình duyệt được giới hạn để chống SSRF.
- Neon lưu endpoint + khóa mã hóa trên bảng riêng, không lưu customer PII trong subscription hay push events.
- Cloudflare Admin Worker có Cron mỗi 5 phút, gọi API dispatch Vercel bằng secret riêng; Vercel dùng VAPID aes128gcm phát Web Push.
- Event: lần đầu có hội thoại mới, yêu cầu liên hệ hoặc yêu cầu gia công. Không spam mỗi tin nhắn trong cùng hội thoại.
- Payload chỉ chứa loại event, UUID/session ID và số yêu cầu trạng thái new. Không có tên, SĐT, email, nội dung chat.
- Badge hiển thị trạng thái yêu cầu new; không gán nhãn chưa đọc vì chưa có read receipts. Badge tab hiển thị số new trong trang đầu.
- Notification click mở /ceo/index.html?tab=contact|outsourcing|chat&id=... sau khi Owner đăng nhập; tìm đúng phiếu (tối đa 5 trang), nếu không còn thì báo không tìm thấy.
- Khi logout thu hồi subscription trên thiết bị, dù API ngắt quãng vẫn unsubscribe tại browser.

## Phụ thuộc và bước phát hành cần Owner phê duyệt riêng

1. Backup + migration Neon staging, đọc backend/neon/migrations/20261111_dl12c_ceo_push.up.sql. Cần cấp role tối thiểu fbmn_ceo_push_login trước khi chạy. Chỉ migrate production sau khi Owner đồng ý.
2. Tạo một cặp VAPID key lâu dài (npx web-push generate-vapid-keys). Trong Vercel fbmn-ceo: FBMN_CEO_PUSH_DATABASE_URL (dedicated Neon login), FBMN_CEO_VAPID_PUBLIC_KEY, FBMN_CEO_VAPID_PRIVATE_KEY và CRON_SECRET (chuỗi ngẫu nhiên ít nhất 32 ký tự). Không đưa secret vào Git/chat.
3. Cloudflare Admin Worker secret FBMN_CEO_PUSH_DISPATCH_SECRET trùng CRON_SECRET. Deploy Worker sau migration + review; Cron 5 phút trong backend/admin-api/wrangler.jsonc. Không cần Vercel Cron hay GitHub Actions quota.
4. Sau CI xanh, Codex review sạch, merge repo phụ và đồng bộ repo chính, mới deploy riêng CEO / Worker theo phê duyệt.

## Device/UAT

- Chrome/Edge/Firefox/Safari hỗ trợ tùy phiên bản. iPhone/iPad iOS 16.4+ cần thêm CEO vào Màn hình chính và mở từ icon mới nhận Web Push.
- Test Owner login, cấp quyền/từ chối quyền, bật/tắt, logout, Chrome Android/iPhone PWA, push khi app đóng, chạm thông báo mở đúng chi tiết.
- Chỉ dùng dữ liệu test hợp lệ ở staging; không tự tạo yêu cầu giả trên production.
- Nếu chưa có Neon push database, VAPID key, Cron secret hoặc Worker deploy: **không báo Web Push production đã hoạt động**, dù UI/CI xanh.

## Bảo mật

JWT Owner không lưu persistent storage, không chấp nhận push URL ngoài /ceo/, không log endpoint hay keys.
Cron chỉ nhận Bearer CRON_SECRET; role database push chỉ đọc IDs/time/status từ inbox và không được truy cập PII.

DL12B không bị thay đổi.
- Gửi thành công được ghi theo từng event và endpoint để retry không spam thiết bị đã nhận. Cron xóa event IDs sau 90 ngày và subscription không còn hoạt động sau 180 ngày. Quyền Owner DB được kiểm lại trước mỗi lần phát.
