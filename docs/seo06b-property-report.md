# SEO06B — Google Search Console toàn property & CEO Statistics UI

Ngày: 14/11/2026. Phạm vi: CEO Gateway + Flutter. Không đổi OAuth, Neon, Website, Admin, Worker hoặc PostHog.

## Nguồn dữ liệu
- Chỉ lấy Search Analytics Google Search Console từ property FBMN đã cấp quyền (allowlist sc-domain:fbmn.vn hoặc https://www.fbmn.vn/).
- Cả bốn truy vấn overview/date/query/page sử dụng type=web, dataState=final, 7/30/90 ngày theo PT lùi 3 ngày, KHÔNG áp page dimensionFilterGroups.
- Tổng lượt nhấp, hiển thị, CTR và vị trí lấy trực tiếp từ hàng overview Google, KHÔNG cộng từ 10 từ khóa/trang (Google có thể ẩn truy vấn hiếm).
- Nếu Google không trả overview rows, giữ metrics=null và giải thích kỳ trống, không tự tạo số 0.
- Top từ khóa kiểm PII như hiện tại. Top trang chỉ cho fbmn.vn và www.fbmn.vn, public path allowlist, không query/hash hay Admin/CEO/host khác. Ghi rõ apex hoặc HTTP khi khác canonical www HTTPS.

## CEO UI
- Bỏ tiêu đề Thống kê Website và subtitle/hướng dẫn dài trong toolbar. Gộp lọc 7/30/90 ngày thành một segment, không check icon; refresh riêng.
- Năm tab con dạng thanh điều hướng, active lavender + underline tím, không dùng ChoiceChip. Dùng chung token 36px desktop, 44px mobile, font 13px, motion 190ms. Tab rail cuộn ngang riêng trên mobile 360/390.
- GSC KPI clicks/impressions/CTR/position, top từ khóa và trang mở mặc định; ghi đúng tên property và kỳ. Empty state khuyến nghị 30/90 ngày thay vì bắt kết nối lại.
- Không đổi ý nghĩa dữ liệu PH01/PH02 hoặc PostHog.

## Gate nghiệm thu
- Node tests: 4 truy vấn không filter URL, property allowlist, page scrub, PII, empty và error.
- Flutter tests: responsive 360/390/1280/1440, tab/period, GSC ready/empty, không horizontal overflow.
- CI + CEO Gateway/Flutter + Codex review sạch trước squash merge dev, đồng bộ repo chính fast-forward rồi deploy Vercel CEO theo Owner.
- UAT: đối chiếu Search Console Performance > Search results cùng property/kỳ. Nếu Google thật không có impression, vẫn hiển thị trạng thái trống, tuyệt đối không bịa số.
