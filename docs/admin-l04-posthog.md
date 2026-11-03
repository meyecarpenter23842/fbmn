# Lô 04 — PostHog an toàn cho Futurebook Admin

Theo Issue #104, chỉ đo **số lượt truy cập khu vực Admin** **lỗi JavaScript và thao tác thất bại (toast error) theo khu vực**. Dữ liệu không dùng cho marketing hoặc phân tích cá nhân.

## Luồng và quyền
- `AdminTelemetry` chỉ mount sau khi API xác nhận `authorised`; logout/đăng nhập không gửi analytics.
- Client chỉ gửi `{event, section}` với enum cố định vào same-origin `POST /api/telemetry`.
- Server kiểm origin, độ dài, schema đúng 2 khóa, token Neon và quyền Admin thực tế trên restricted Worker `/v1/admin/session`. Sau đó mới gọi PostHog HTTP capture.
- Cùng một `distinct_id` **chung** cho toàn Admin, không ghi nhân viên, tài khoản hoặc phiên; `$ip: null`, không xác định địa lý và không tạo person profile.
- Không cài posthog-js; do đó không autocapture, không session replay, không heatmaps, không nhập nội dung form, không localStorage/cookies, không event của auth/login.
- Cấm dữ liệu tùy ý: SKU, số tiền, bảng giá, file Excel, VAT, mã khách, email, điện thoại, địa chỉ, token, cookie, password, URL, referrer, stack hoặc thông báo lỗi.

## Kích hoạt có kiểm soát
Dùng riêng Vercel project **fbmn-admin**, không thêm vào website công khai:
- `NEXT_PUBLIC_FBMN_ADMIN_TELEMETRY=1` (chỉ bật client gửi sự kiện).
- `FBMN_ADMIN_POSTHOG_ENABLED=1` (bật server forwarding).
- `FBMN_ADMIN_POSTHOG_PROJECT_KEY` (project API key, chỉ server).
- `FBMN_ADMIN_POSTHOG_HOST`: `https://us.i.posthog.com` hoặc `https://eu.i.posthog.com` đúng region dự án.

Nếu chưa đủ cấu hình, backend trả 204 và **không gửi đi**. Không in key trong CI/log/repo. Việc cấu hình env cần redeploy Admin bằng workflow comment do Owner kiểm soát. Không có migration DB hay Worker change.

## Kiểm thử và nghiệm thu
- `npm test`: kiểm schema whitelist, từ chối mọi trường nhạy cảm, payload không định danh và kiểm điều kiện bật/tắt.
- Kiểm thủ công: anonymous/401/403 không có event; Owner truy cập tab và phát sinh lỗi JavaScript có kiểm soát trong môi trường test chỉ thấy 3 event + `section`; DNT bật không gửi; PostHog không có session replay.
- Hồi quy giao diện: ở 1440/1280/390/360px, các menu, SKU, danh mục/nhóm mẫu, R2, Excel, Giá & bảng giá 3 tab, chọn bảng giá xuyên suốt, drawer, nhiều kênh, toast góc phải trên. Không thực hiện ghi giá giả.
- UAT bằng phiên Owner thật vẫn **pending** cho đến khi Owner test; CI green không thay thế UI UAT.
