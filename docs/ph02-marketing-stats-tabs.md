# CEO-STAT-TABS + PH02 — Phân tích Marketing Futurebook Miền Nam
Ngày: 13/11/2026 | Owner scope: CEO Flutter + Owner-only Gateway; không thay Website/Worker/Admin/Neon.

## Bố cục CEO
Trong menu **Thống kê** có 5 tab con nằm ngay dưới bộ lọc kỳ:
1. **Tổng quan**: 8 KPI tổng và biểu đồ phiên theo ngày; giữ bảng nguồn truy cập gốc.
2. **Chuyển đổi**: PH01 Funnel theo thứ tự sản phẩm → CTA → form 201 trong phiên.
3. **Marketing**: PH02 hiệu quả kênh và các mã chiến dịch UTM hợp lệ.
4. **Sản phẩm**: bảng sản phẩm/danh mục đã ghép tên công khai.
5. **SEO**: thông tin Google Organic/Ads SEO05, bảng trang phổ biến; không tự khẳng định Search Console đã kết nối.

**Bộ lọc 7/30/90 ngày, Tải lại, UTC và trạng thái loading/empty/error** là chung. Đổi tab chỉ thay giao diện, **không gọi lại PostHog**. Mobile 360/390 có thanh tab cuộn ngang độc lập, không tràn ngang nội dung; responsive desktop.

## PH02 — Quy tắc kinh doanh đã duyệt
- Chỉ tính phiên có sự kiện `web_session_start` trong kỳ. Một `distinct_id` Website (`fbmn-web-session-UUID`) là một phiên tối đa 30 phút không hoạt động; không phải một người/khách hàng hay hợp đồng.
- Gắn nguồn **first-touch** theo `traffic_source` và `traffic_channel` trên `web_session_start`. Nhóm kết quả cố định: `google_organic`, `google_paid`, `google_unclassified`, `facebook`, `zalo`, `direct`, `referral`, `other`.
- **Tổng phiên**: các phiên bắt đầu trong kỳ. **Phiên xem SP**: có `web_product_view`; **phiên bấm CTA**: có `web_lead_cta_click`; **phiên tạo yêu cầu**: có `web_contact_submit_success` hoặc `web_outsourcing_submit_success`. Một phiên có hai loại form thành công vẫn chỉ tính một phiên có lead.
- **Tỷ lệ tạo yêu cầu mỗi kênh** = phiên tạo yêu cầu / tổng phiên bắt đầu từ kênh đó. Mẫu số 0 hiển thị `—`, không bịa 0%. Đây **không** phải PH01 ordered funnel hoặc số đơn hàng / doanh thu.
- **Chiến dịch UTM**: chỉ xuất `utm_campaign` dạng `fbmn-[a-z0-9-]{1,48}`, loại bỏ từ truy vấn SQL các chuỗi có 9 chữ số liên tiếp trở lên (có thể giống số điện thoại), và kiểm tra phòng vệ lần nữa ở Gateway; cho phép mã ngày 8 chữ số như `fbmn-20261113`. Tối đa 10 cặp campaign/kênh. Tách Google Ads khỏi Organic. Chỉ hiển thị các campaign có phiên thật; không suy đoán chi phí quảng cáo, ROI, CPC hoặc ROAS khi chưa có tài khoản Ads/cost thực.
- Số liệu lịch sử trước khi Website chạy SEO05 có thể thiếu kênh/CTA; không hồi tố và không gán Google chưa phân loại thành Organic.
- Chỉ chạy hai truy vấn HogQL **cố định** `marketingSources`/`marketingCampaigns`, không nhận SQL từ client; kỳ chỉ 7/30/90 ngày, tối đa 3 truy vấn đồng thời. Trả aggregate không có session ID, IP, email/SĐT, gclid, referrer, raw UTM query hoặc form/chat. Gateway Owner-only, khóa API ở server.

## Gate nghiệm thu
1. Node/Gateway tests: query fixed, đúng schema, chặn channel lạ, campaign không hợp lệ, số âm, trùng kênh, lead > sessions; khi mất dữ liệu báo lỗi chứ không giả zero.
2. Flutter unit: parse PH02, conversion rate chính xác và zero-denominator. Widget test: 360/390/1280 không tràn ngang; chuyển tab hiển thị đúng nội dung, không làm mới API; đổi kỳ giữ tab đang chọn và gọi API đúng một lần.
3. PR CI + Flutter/Gateway xanh; Codex review sạch; squash merge repo phụ, đồng bộ repo chính bằng fast-forward sau khi kiểm tra tree và CI.
4. Không tự deploy production trước khi Owner cho phép riêng. Khi phát hành, Owner vào CEO → Thống kê → Marketing, so với PostHog, thử kênh Direct/Google và một chiến dịch UTM thật, không ghi PII.
