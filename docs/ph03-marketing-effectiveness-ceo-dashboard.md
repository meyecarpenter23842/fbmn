# PH03 — Hiệu quả Marketing + CEO Dashboard nâng cao

**Ngày:** 14/11/2026 · **Phạm vi:** CEO Gateway Owner-only, Flutter CEO, tests/docs. Không đổi Website, Admin, Worker, OAuth, Neon, quyền hoặc dữ liệu gốc.

## Đo lường, không trộn nguồn

- **PostHog / PH02:** Đếm phiên Website bắt đầu trong kỳ (anonymous `fbmn-web-session-*`), nguồn **first-touch**; chỉ ghi nhận lead khi có `web_contact_submit_success` hoặc `web_outsourcing_submit_success`. Một phiên thành công tính tối đa một lần ở từng kênh, không phải người mua, hợp đồng hay doanh thu.
- **PH03:** Hai query cố định bổ sung `marketingPreviousSources` và `marketingDaily`, dùng cùng quy tắc PH02. Kỳ trước đúng 7/30/90 ngày liền kề, phân theo thời điểm `web_session_start`, không lẫn phiên bắt đầu kỳ hiện tại. Truy vấn lịch sử giữ sự kiện tiếp nối cho phiên trước tại ranh giới; bảng kết quả không chứa session ID, PII hay URL truy vấn.
- **GSC / SEO07:** GSC Web Search final, property đã cấp OAuth; clicks/impressions/CTR/average position, thay đổi kỳ trước và top từ khóa. GSC kết thúc trễ 3 ngày theo **America/Los_Angeles**; PostHog là kỳ trượt theo thời gian hiện tại (UTC). Hai tập dữ liệu được đặt cạnh nhau **chứ không JOIN, cộng, chia chéo hoặc suy ra click → phiên/lead**.
- Google Ads, Google Organic, Google chưa phân loại, Facebook, Zalo, Direct, Referral, Other tách riêng. Chỉ chiến dịch `fbmn-*` an toàn hiện có. Không giả chi phí, lợi nhuận, Ads ROAS hay doanh thu.
- Chỉ tính tăng giảm % nếu kỳ trước có mẫu số lớn hơn 0; nếu 0 thì hiển thị **—**. Phần thiếu hàng top GSC không coi là 0.

## CEO Dashboard

- **Giữ 5 tab và sticky rail SEO07**: Tổng quan / Chuyển đổi / Marketing / Sản phẩm / SEO. Filter 7/30/90 ngày và refresh dùng chung, không đổi navigation.
- **Tổng quan:** 8 KPI Website và xu hướng PostHog dạng đường cho phiên/phiên gửi yêu cầu, chỉ vẽ ngày có bản ghi; so sánh tổng phiên và lead với kỳ trước; top nguồn gốc.
- **Chuyển đổi:** Giữ Funnel PH01 có thứ tự sản phẩm → CTA → HTTP 201 và tỷ lệ từng bước, không dùng chỉ số PH02 thay thế.
- **Marketing:** Thẻ PH03 GSC độc lập, hai kỳ PostHog, tỷ lệ lead theo từng kênh, biểu đồ chọn kênh/ngày tương tác. Thẻ PH02 campaign giữ nguyên.
- **Sản phẩm/SEO:** Không mất top sản phẩm, danh mục, top trang và SEO07 keyword/page movements.
- **Bảo vệ:** API `/api/ceo/statistics` và `/api/ceo/search-console` đều Owner-only, headers private/no-store, các câu query cố định, không đưa token/PII xuống Flutter. GSC outage không dừng PostHog.
- **UI:** Tím Futurebook, tab cố định chỉ khi cuộn, không tràn ngang. Bộ lọc ngày thấp, line chart có chú giải, ngày đã chạm và empty state.

## Kiểm thử / nghiệm thu

1. Gateway Node: cohort 7/30/90 ngày đúng ranh giới, schema aggregates 12 query, không PII, số lead không vượt phiên, day/channel duy nhất, zero denominator/unknown channel.
2. Flutter: parse kênh kỳ trước, delta, thiếu mẫu, hai API riêng; UAT 360/390/1280/1440, biểu đồ tương tác, tab lazy-load, sticky, refresh/error/loading.
3. CI + Flutter build/analyze/test + Gateway build/typecheck/test + Codex review trước squash merge repo phụ. Chỉ sync Git tree sau xanh và review sạch.
4. Phát hành CEO theo Owner phê duyệt. **Số liệu thật vẫn phải UAT:** đối chiếu PostHog channel/cohort + GSC property trong CEO; không xác nhận số thật từ unit test.
