# 05 — NGHIỆM THU, QA, SECURITY VÀ RELEASE GATES

## 1. Ma trận UI bắt buộc
| Bề mặt | 360/390 | 768 | 1280/1440 | States cần thử |
|---|---|---|---|---|
| Shell/nav/search | ✓ | ✓ | ✓ | keyboard, no-results, error |
| Home/hero/promo | ✓ | ✓ | ✓ | no approved banner, loading |
| Category/filter/sort | ✓ | ✓ | ✓ | long tags, empty, reset, URL |
| Product card/detail | ✓ | ✓ | ✓ | variant invalid, no image/price/stock |
| Cart/checkout | ✓ | ✓ | ✓ | price changed, duplicate submit, error |
| Account/orders | ✓ | ✓ | ✓ | unauthorized, expired, not-found |
| Toast/modal/drawer | ✓ | ✓ | ✓ | focus trap, ESC, motion reduced |

UI acceptance: no viewport overflow ngoài vùng scroll chủ đích, font >=13px control, button 36/44px, input 40px, radius 8–10px, brand đỏ trên Đại Việt, toast nhỏ trên phải. Test JS enabled and keyboard. Screenshots phải từ app thật, không phải prompt image.

## 2. Giá, SKU, kênh
- SKU luôn TEXT, giữ 0 đầu; barcode không là primary key; duplicate barcode không merge sản phẩm.
- Không lấy giá nguồn/báo giá/NET làm sale price mặc định; kiểm bảng giá đúng channel và thời điểm.
- Giá không hợp lệ/chưa duyệt/chưa hiệu lực: không public, không 0 đồng, không “đang giảm” giả.
- Không render NET trong HTML, API JSON, error payload, analytics, screenshot, source maps.
- Price changed giữa PDP/cart/checkout phải được server phát hiện và người dùng xác nhận.
- SKU ẩn/kênh không khớp không thể truy cập bằng URL hoặc tìm kiếm public nếu không được phép.

## 3. Authorization / privacy
- Public chỉ read DTO whitelist; Admin dùng auth + RBAC server-side, không tin channel từ client đơn thuần.
- Negative tests 401,403,404, IDOR, price list khác channel, user khác order, forged request, CSRF/cookie.
- Rate limit search/checkout/contact, anti-spam, idempotency, validate input; không chứa auth token trong public env.
- Không dùng session replay/heatmap nội bộ nhạy cảm, không log tên/địa chỉ/giá NET vào PostHog.
- Payment nếu có: dùng nhà cung cấp được phê duyệt, không tự xử lý dữ liệu thẻ.
- Công khai privacy, chính sách mua bán và quản lý dữ liệu cá nhân trước khi ra mắt.

## 4. SEO / performance / quality budgets mục tiêu
- Mobile Core Web Vitals mục tiêu “Good” (LCP <=2.5s, INP <=200ms, CLS <=0.1) cho các template chính; đây là mục tiêu, không phải số đo đã đạt.
- Lighthouse mobile performance >=85 là mục tiêu nội bộ sau khi có assets và deploy kiểm thử, không hứa tất cả thiết bị/mạng.
- Images responsive, width/height hoặc aspect-ratio ổn định, lazyload dưới fold; JS tải theo nhu cầu.
- Metadata, canonical, sitemap, robots, product schema/offer chỉ với hàng được public hợp lệ; 404 đúng trạng thái.
- Accessibility mục tiêu WCAG 2.2 AA: contrast text >=4.5:1, keyboard/focus, labels, aria error, reduced motion.

## 5. Gate CI / review
DV-00 docs-only: tồn tại nguồn tài liệu, AGENTS root/scoped trỏ READ FIRST, hợp đồng màu không phá Futurebook; test tự động cho routing. Không cần screenshot runtime.
DV-01..08: npm build/typecheck/lint/tests cho app chạm tới; shared code phải chạy smoke/regression của Futurebook+Admin+Đại Việt, Playwright/screenshot khi khả thi.
PR phải có scope lô, mã SHA, CI đúng commit, Codex review sạch, rủi ro, kế hoạch roll back. Có owner UAT riêng; không ghép “merged” với “deployed”.

## 6. Phát hành và rollback
- Không tự auto deploy production chỉ vì PR merge. Vercel project riêng Đại Việt, config root directory riêng; đóng băng các Vercel hiện tại.
- Dry-run backend/migration, backup/rollback plan cho thay schema; giới hạn thay đổi DB/Worker theo lô; không đổi production pricing thử.
- Sau deploy có HTTP 200, assets và SEO, search/PDP real, security smoke (NET không lộ), checkout test bằng đơn thử có sự đồng ý và không ảnh hưởng tồn kho thật.
- Nếu lỗi: rollback deployment độc lập; với migration phải có kế hoạch backward-compatible; thông báo rõ dữ liệu có bị ảnh hưởng không.

## 7. UAT của Owner
Đặc biệt kiểm: sản phẩm đúng mã và ảnh, lựa chọn mẫu khác SKU, giá lẻ Đại Việt, hiển thị điện thoại 360/390, loading/error, cart/checkout, toast top-right, không lộ giá NET, Admin không lẫn Futurebook, không đổi giao diện đã duyệt của Futurebook.
Chỉ sau Owner nghiệm thu và link bằng chứng trong master/issue mới đánh dấu hoàn tất.
