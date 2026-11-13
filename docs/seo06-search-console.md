# SEO06 — Google Search Console trong CEO Futurebook Miền Nam

Ngày: 14/11/2026 | Phạm vi: CEO Gateway + Flutter; không sửa Website, Admin, Worker, Neon.

## Dữ liệu
Trong CEO → Thống kê → SEO sẽ có hai thẻ **riêng biệt**:
- SEO06 Google Search Console: Google Search dạng Web (organic) — lượt nhấp, lượt hiển thị, CTR, vị trí trung bình, diễn biến ngày, 10 từ khóa và 10 trang URL công khai.
- SEO05 PostHog: phiên Website nguồn Organic, lượt xem sản phẩm/CTA/yêu cầu. Không cộng số nhấp GSC vào phiên PostHog; Google Ads không tính trong GSC.

Chỉ dùng dữ liệu thật Google. Chưa có quyền => **Chưa kết nối**; API trả rỗng => **Chưa có dữ liệu**; sai quyền / API lỗi => **Lỗi GSC** riêng, không làm hỏng PH01/PH02.

## Kết nối Google (Owner tự thực hiện)
1. Xác minh property Search Console là https://www.fbmn.vn/ (URL-prefix) hoặc sc-domain:fbmn.vn. SEO06 chỉ lấy trang canonical https://www.fbmn.vn, không lấy các app Admin/CEO.
2. Trong Google Cloud bật Google Search Console API, tạo service account dùng để đọc dữ liệu, cấp email của service account quyền đọc property trong Search Console → Settings → Users and permissions (ít nhất Restricted access).
3. Vercel → project fbmn-ceo → Environment Variables → Production, tạo hai biến:
   * FBMN_CEO_GSC_SITE_URL = https://www.fbmn.vn/ (hoặc sc-domain:fbmn.vn, khớp property đã cấp)
   * FBMN_CEO_GSC_SERVICE_ACCOUNT_JSON = toàn bộ JSON credential của service account dưới dạng encrypted server-only
   Không gửi JSON/private key trong chat, không đưa GitHub, không đặt biến NEXT_PUBLIC_*. Chỉ Owner hoặc người quản trị Vercel thiết lập trực tiếp.
4. Khi Owner duyệt deploy CEO mới với env production đã cấu hình: mở CEO → Thống kê → SEO → Tải lại, đối chiếu dữ liệu với GSC Performance, loại tìm kiếm Web.

## Nghiệp vụ
- API Google Search Analytics dùng ngày theo America/Los_Angeles (Pacific Time), chọn 7/30/90 ngày *kết thúc trước ngày hiện tại 3 ngày* để tránh số liệu chưa chốt. Thể hiện rõ start/end bên cạnh KPI; ngày không có dữ liệu không tự làm giả.
- Google trả CTR dạng số thập phân 0..1 (CEO nhân 100 thành %), position là vị trí trung bình (số nhỏ hơn thường tốt hơn).
- Truy vấn GSC có thể bị ẩn / rút gọn vì quyền riêng tư; top từ khóa/trang không được coi là tổng đầy đủ. Không phát minh từ khóa hoặc số liệu khi không có dữ liệu.

## Kiến trúc bảo mật
- GET /api/ceo/search-console?period=7d|30d|90d[&fresh=1] riêng biệt, Owner-only (requireOwner), cache private,no-store. Không chấp nhận property, email, token hoặc Google SQL từ trình duyệt.
- Service account ký JWT RS256 ở Gateway; chỉ scope https://www.googleapis.com/auth/webmasters.readonly; token từ https://oauth2.googleapis.com/token. Gọi Google REST Search Analytics theo property allowlist. Không theo redirect, giới hạn timeout / kích thước JSON.
- Bốn truy vấn cố định: tổng (1), ngày (tối đa 95), từ khóa (60 rồi sàng lọc 10), trang (50 rồi sàng lọc 10); luôn lọc theo canonical public page prefix.
- Lọc từ khóa/email/URL/số điện thoại và các path khác domain, admin, querystring; không trả credential/access token, referrer, IP hay dữ liệu form.
- Flutter gọi GSC lazily chỉ khi mở tab SEO, cache theo period, không kéo GSC cho các tab khác. GSC thất bại không làm mất thống kê PostHog.

## Nghiệm thu trước release
- Node test: khoảng ngày PT, property whitelist, JWT readonly, 4 query đúng, dữ liệu 0 vs chưa có, loại raw PII, denied/timeout.
- Flutter test: parse dữ liệu thật, CTR/position, responsive 360/390/1280, chỉ gọi khi tab SEO đang mở, chuyển tab giữ cache, đổi kỳ và refresh.
- CI tổng / Flutter / Gateway / Codex review sạch → squash merge repo phụ → so tree và đồng bộ repo chính bằng fast-forward. Deploy CEO chỉ khi Owner cho phép; không chạy migration.
- **Trạng thái nguồn:** Tại 14/11/2026 chưa có Search Console property nào được kết nối trong Windsor.ai. Không thể nghiệm thu số liệu Google thật cho tới khi Owner cấp quyền và môi trường production nhận credentials.
