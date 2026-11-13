# SEO05 — Giám sát SEO, PostHog và chuyển đổi B2B (13/11/2026)

**Nguồn công việc:** Owner Futurebook Miền Nam; SEO01–SEO04 đã triển khai. Giữ nguyên dữ liệu gốc, SKU/giá NET, giao diện Website/CEO, chính sách Privacy và bảo vệ Owner-only. Không bật Google Ads hay Google Search Console OAuth ngầm.

## 1. Hai nguồn dữ liệu KHÔNG đồng nhất

| Nguồn | Chỉ số | Nơi xem | Giới hạn |
| --- | --- | --- | --- |
| Google Search Console | Impressions, clicks, CTR, average position, query/page/device, indexed/not indexed, sitemap | Search Console property `fbmn.vn` | Tài khoản Google chưa kết nối tới CEO Gateway; không tự bịa số hay yêu cầu gửi lại sitemap |
| PostHog Website | Sessions (30 phút), product/category/catalogue, CTA, liên hệ/gia công thành công | CEO → Thống kê Website → SEO · Google tự nhiên | Personless, 7/30/90 ngày UTC; phân kênh chỉ có sau khi SEO05 Website production chạy và phát sinh traffic thật |

**Không lấy PostHog `traffic_source=google` làm Organic**: nguồn đó gồm cả quảng cáo. SEO05 thêm `traffic_channel=google_organic/google_paid/google_unclassified` dựa trên referrer tìm kiếm, UTM medium hoặc chỉ dấu click Google Ads, **chỉ gửi enum**, không gửi gclid/gbraid/wbraid, UTM không đúng whitelist, referrer URL, query tìm kiếm, email/SĐT/form/chat, IP hay user agent.

- Google Organic: referrer Google khi không có UTM nguồn khác, hoặc `utm_source=google&utm_medium=organic`.
- Google Paid: `gclid`/`gbraid`/`wbraid` (chỉ nhận biết sự hiện diện, không lưu giá trị) hoặc `utm_source=google&utm_medium=cpc|paid|paid_search` hoặc `utm_source=googleads`.
- Google Unclassified: `utm_source=google` nhưng thiếu phương tiện đáng tin cậy. Không cộng vào Organic.
- First-touch trong phiên tối đa 30 phút; dữ liệu trước SEO05 **không hồi tố** và không nhất thiết khớp Search Console.
- DNT/Global Privacy Control vẫn được tôn trọng; không autocapture/identify/session replay.

## 2. Đo hành trình, tránh đếm trùng

**Funnel theo phiên PostHog (không phải số người duy nhất):**
1. `web_session_start` với `traffic_channel=google_organic`.
2. `web_product_view` cùng channel, đếm `uniqIf(distinct_id)`.
3. `web_lead_cta_click`: ý định bấm nút báo giá, liên hệ đại lý hoặc catalogue. **Chưa phải lead**.
4. `web_contact_submit_success` hoặc `web_outsourcing_submit_success`: chỉ khi endpoint xác nhận HTTP 201 thành công. Đếm duy nhất một lần theo phiên, dù gửi cả hai biểu mẫu.
5. Tỷ lệ phiên có yêu cầu = `organicLeadSessions / organicSessions × 100%`. Nếu mẫu số 0, hiện "Chưa có phiên Organic", **không hiển thị 0% giả**. Biên thời gian có thể cắt phiên.

`web_page_view.page_key` chỉ gồm URL canonical **đã allowlist** (/`, /san-pham, /catalogue, /dai-ly, /lien-he, /gia-cong, trang sản phẩm/danh mục dạng slug). Không ghi URL search/query/hash. **Top trang Organic hiện là số lượt xem trang, không phải số phiên landing page**, không phải thứ hạng SERP.

CEO Gateway Owner-only: 7 truy vấn read-only giới hạn 7/30/90 ngày; ≤3 truy vấn song song; API key PostHog ở Vercel server, không ra Flutter; trả chỉ số tổng hợp, top 10 trang. Không đổi Neon, Worker, policy. CEO UI tái sử dụng thẻ/lưới hiện tại, responsive, có ghi rõ nguồn Google Search Console chưa kết nối.

## 3. Kiểm tra Search Console theo chu kỳ

Trong property domain `fbmn.vn`: dùng **Hiệu suất → Kết quả tìm kiếm** đọc các bộ lọc Trang/Truy vấn/Thiết bị, so 7/28 ngày và cùng ngày trong khoảng thời gian phù hợp; ghi click/impression/CTR/vị trí cho 10–20 trang sản phẩm và trang B2B đã xuất bản. Trong **Lập chỉ mục → Trang** theo dõi indexed, not indexed và lý do (discovered/crawled currently not indexed, duplicate, noindex, redirect, 404/5xx). Kiểm tra sitemap `https://www.fbmn.vn/sitemap.xml` đã được xử lý thành công ngày 13/11/2026 với 617 URL khám phá; số URL được khám phá **không phải 617 URL đã index**. Chỉ gửi yêu cầu index một URL cụ thể khi đã sửa lỗi và Live Test indexable; không gửi lại sitemap hàng ngày.

**Baseline GSC:** chưa có phép đọc API thực tế qua OAuth ở app CEO/Worker; khi cần tự động hợp nhất, Owner phải kết nối nguồn Google Search Console bằng quyền rõ ràng và cấp quyền đọc phù hợp. Không mở rộng server secret hoặc dữ liệu riêng khi chưa được phê duyệt.

## 4. Nghiệm thu sau khi Owner duyệt deploy

- Website deploy commit SEO05: kiểm tra trang chủ, Song Natural, /dai-ly, /catalogue, /lien-he; không lỗi JS, không thay CTA/href; pageview chỉ có page_key hợp lệ.
- Analytics: nghiệm thu bằng các lượt truy cập **thực tế**, PostHog nhận `traffic_channel` enum + CTA location, không chứa PII hay query. Không tạo dữ liệu giả trên production.
- CEO Gateway + Flutter CEO **deploy cùng phiên bản** (cần Owner duyệt cả hai Vercel Website/CEO; không liên quan `fbmn-admin`), kiểm tra quyền Owner và 7/30/90 ngày, trả lỗi khi mất PostHog.
- Dữ liệu lịch sử vẫn hiển thị thống kê cũ; SEO Overview chỉ có số liệu khi traffic từ Website sau SEO05.
- PostHog trang sản phẩm và contact success đã có event; kiểm tra `web_lead_cta_click`, `page_key`, `traffic_channel` sau khi sản xuất có tương tác thật.
- Search Console hiệu suất/Indexing vẫn ở Google cho đến khi nguồn được kết nối riêng. Không tự tuyên bố CTR tăng, Organic leads tăng, thay đổi rankings hoặc đã index 617 trang.

## 5. Tiếp theo

Khi có tối thiểu một kỳ 7/28 ngày đủ số liệu từ Search Console và PostHog, chọn 10–20 landing theo **click/impression/CTR** và số phiên Organic có liên hệ thực; mới lên phương án tối ưu content và **ADS01**. Cấm gọi SEO là doanh thu hoặc giá trị hợp đồng khi không có dữ liệu bán hàng xác nhận.
