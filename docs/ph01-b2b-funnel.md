# PH01 — CEO Funnel chuyển đổi khách B2B

**Ngày:** 13/11/2026 · **Phạm vi:** CEO Gateway, Flutter CEO, PostHog aggregate; không sửa Website, Admin, Worker hoặc Neon.

## Mục tiêu và định nghĩa

| Giai đoạn | Sự kiện từ Website | Điều kiện tính |
| --- | --- | --- |
| 1. Xem sản phẩm | `web_product_view` | Phiên có xem trang sản phẩm được server xác nhận công khai |
| 2. Bấm CTA | `web_lead_cta_click` | Phải xảy ra sau bước 1 trong cùng phiên |
| 3. Gửi thành công | `web_contact_submit_success` hoặc `web_outsourcing_submit_success` | Phải xảy ra sau bước 2 trong cùng phiên; chỉ phát khi backend trả 201 và ok=true |

- **Đơn vị tính:** phiên Website, **không phải khách hàng/người duy nhất**. Website `distinct_id = fbmn-web-session-<UUID>`, thay sau 30 phút không hoạt động; mỗi phiên chỉ đếm một lần dù bấm CTA nhiều lần hoặc gửi nhiều form.
- **Cửa sổ:** 24 giờ từ bước đầu trong cùng phiên bằng `windowFunnel(86400)`. Có thể có sự kiện không liên quan nằm giữa các bước. Số lượng trong kỳ lấy từ các sự kiện xảy ra trong 7/30/90 ngày gần nhất, múi giờ query PostHog/UTC; phiên ở mép kỳ có thể bị cắt.
- **Tỷ lệ:** (bước 2 / bước 1), (bước 3 / bước 2), (bước 3 / bước 1). Nếu mẫu số không có phiên, hiển thị **—**, không bịa 0%. `countIf` tính phiên trong mỗi bước, không cộng số lần click.
- **Rời bước:** `bước 1 - bước 2`, `bước 2 - bước 3`: chưa chuyển bước trong cửa sổ/kỳ quan sát, **không** mặc định là khách từ chối/mất cơ hội bán hàng.
- **Không ghi PII:** API chỉ trả 3 số nguyên, không trả session ID, referrer, IP, email, SĐT, nội dung biểu mẫu, SKU riêng hay giá NET; Gateway vẫn yêu cầu Owner và API key chỉ ở server.

## Bản hiện tại và phụ thuộc triển khai

- Website đã có contract `web_lead_cta_click` trong SEO05: nút sản phẩm primary/mobile và liên hệ từ đại lý/catalogue. Form chỉ emit success khi response status 201 và `ok=true`; PH01 **không** cần sửa form.
- **Kiểm tra ngày 13/11:** Vercel Website production vẫn là commit `7c42f909...` (trước SEO05), CEO đang chạy `9f8e587...`. PostHog schema hiện chưa ghi nhận `web_lead_cta_click` hay `web_outsourcing_submit_success`. Tập dữ liệu thời điểm kiểm tra có 14 phiên xem sản phẩm trong 7 ngày và 0 phiên qua CTA / hoàn tất cả funnel. Những con số này chỉ là *baseline quan sát tại thời điểm kiểm tra*, không lưu cố định trong UI hoặc báo cáo.
- Trước khi nghiệm thu funnel cuối: cần **Owner duyệt phát hành Website** có SEO05 và **CEO** có PH01, rồi thử thao tác thật, kiểm tra event trong PostHog (tôn trọng DNT/GPC), đối chiếu đúng vị trí CTA và trường hợp không submit.

## Nghiệm thu kỹ thuật

1. `queriesFor` chỉ nhận 7d/30d/90d; PostHog 8 truy vấn fixed read-only, tối đa 3 đồng thời, không truy vấn raw session IDs về Flutter.
2. `windowFunnel(86400)(toDateTime(timestamp),...)` có thứ tự 3 bước; `startsWith(distinct_id, 'fbmn-web-session-')` tránh PDF proxy và nguồn ngoài.
3. `formatStatistics` kiểm tra đúng một hàng / ba số, không âm, `step1 >= step2 >= step3`. Lỗi dữ liệu trả trạng thái lỗi, không tự tính/giả số.
4. Flutter mobile phải không tràn ngang tại 360px; cả 0 phiên, 0 CTA, có lead và lỗi PostHog được biểu diễn rõ.
5. Giữ nguyên số liệu SEO05, trang/sản phẩm/danh mục, session analytics, quyền Owner, PII contract.
6. Chỉ merge khi PR CI/Flutter/Gateway và Codex review sạch, đồng bộ chính fast-forward; chỉ deploy khi Owner cho phép.
