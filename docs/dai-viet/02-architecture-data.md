# 02 — KIẾN TRÚC, DỮ LIỆU VÀ RANH GIỚI KÊNH

## 1. Monorepo an toàn, không tái cấu trúc phá hệ hiện tại
Hiện trạng tham chiếu ngày 03/11/2026: repo fbmn; website Futurebook root app/**; apps/admin/** có app Next độc lập; backend/API và docs hiện hữu. apps/dai-viet/** mới chỉ là đường dẫn dự kiến chứa app và tài liệu scoped. Không di chuyển app/**, thay route đang chạy, hay tạo thêm Admin.

Sơ đồ mục tiêu:
- app/**: Futurebook public website (Vercel project hiện có).
- apps/admin/**: Futurebook Admin chung, có menu/role/kênh Đại Việt trong cùng phiên đăng nhập (không đăng nhập Admin riêng).
- apps/dai-viet/**: Next.js web app bán lẻ Đại Việt (Vercel project riêng, độc lập build).
- backend/** / Cloudflare Workers / Neon / R2: giữ nguyên nền tảng đã có, mở API theo contract và quyền; không ghi trực tiếp Neon từ client.
- packages/ui/** (chỉ bổ sung khi thực sự cần): shared brand-neutral primitives; hai website chọn theme riêng, tránh CSS import chéo. Chưa bắt buộc tạo ngay DV-00.

Không cần chuyển repo sang pnpm/Turborepo trong lô tài liệu; mỗi app có thể build với Next riêng và root directory riêng nếu deployment config cho phép. Chỉ thay workspace/package manager bằng ADR/PR riêng sau kiểm tra toàn bộ CI.

## 2. Phân quyền và dữ liệu nội bộ
- Public Đại Việt chỉ thấy SKU đã publish cho channel=dai-viet, media duyệt và giá bán lẻ đang hiệu lực thuộc kênh.
- Admin phải kiểm tra quyền server-side cho thao tác giá, publish, kho, đơn và nội dung; UI ẩn nút không thay được RBAC.
- NET, giá đại lý, danh sách khách hàng nội bộ, margin, lịch sử điều chỉnh, file nhập/xuất phải bị loại khỏi API public, HTML SSR, logs, analytics, browser storage và browser network payload.
- Không trộn các bảng giá nguồn/báo giá/NET/giá lẻ. Giá hiển thị lấy từ price_list được Owner áp dụng cho kênh Đại Việt và thời điểm/điều kiện hợp lệ; nếu chưa có thì “Liên hệ”/ẩn giá theo chính sách duyệt, không hiển thị 0 đồng.
- Chỉ Owner/người được cấp quyền có thể thay cấu hình price list/channels và publish. Các quyền phải có audit, chống leo thang qua API.
- Futurebook website và Đại Việt không nhìn nhầm inventory, price/channel: test cross-channel cho cùng SKU và SKU chỉ có một kênh.

## 3. Model logic dự kiến (không khẳng định schema DB đã có)
| Entity logic | Khóa / quan hệ | Ghi chú |
|---|---|---|
| product | product_id | Tên, brand, mô tả, nhóm hiển thị; không trộn nhóm với SKU |
| sku_variant | sku_code TEXT, product_id | Giữ 0 đầu; trang/gsm/kẻ/mẫu/khổ và units |
| category | category_code do người dùng đặt | Cây cha/con, không tự cấp mã |
| category_channel | category_code + channel | Thứ tự/menu riêng Đại Việt |
| product_channel | sku_code + channel | publish, vị trí nổi bật, thời điểm, image override |
| price_list | price_list_code + allowed channels | Bảng giá riêng, VAT/hiệu lực/nguồn, audit |
| price_entry | price_list + SKU + period/revision | Không suy giá NET thành public |
| product_media | media_id + SKU/variant | R2 approved, thứ tự album và alt |
| inventory_balance | location + SKU | Chính sách kho chung/riêng CHƯA CHỐT |
| customer / order / order_item | IDs riêng, channel, snapshot | Chỉ tạo sau thiết kế quyền và retention |
| audit_log | actor/action/revision/timestamp | Không chứa password, token hay dữ liệu nhạy cảm dư |

Model trên là đặc tả logic, không phải migration có thể chạy ngay. Trước khi code: audit migration/schema thật, API contract và trạng thái Admin tại main. Không được tự đổi 4 kind giá legacy hay quy trình 3 tab đã được Owner chốt.

## 4. Quy tắc biến thể và gom sản phẩm
- Nhóm hiển thị được tạo theo nhóm mẫu + quy cách hợp lý; một product page có nhiều biến thể, mỗi biến thể trỏ chính xác một SKU.
- Tùy chọn có thể có: size, số trang, gsm, dòng kẻ, mẫu bìa, màu. Chỉ hiện thuộc tính có dữ liệu được duyệt.
- Mọi thay đổi biến thể phải cập nhật URL/share state phù hợp, gallery, giá, tồn kho, nút mua và chi tiết SKU cùng nhau.
- Barcode có thể giống nhau giữa nhiều dòng trong PDF, tuyệt đối không dùng barcode làm khóa SKU duy nhất; SKU công ty là chuỗi giữ 0 đầu.
- SKU thiếu ảnh được phép có fallback approved, SKU thiếu giá/tồn kho không được tự biến thành sản phẩm bán.
- Listing nhóm biến thể có price-range chỉ khi API biết đủ giá công khai hợp lệ; không lấy min từ NET.

## 5. Hợp đồng API đọc/ghi mong đợi
- Public read-only: category tree by channel, search suggestions/results, product list by filters, product detail/variants, approved media, sale price/public stock, public content.
- Commerce: cart tính sơ bộ ở client nhưng đặt hàng PHẢI revalidate server giá/stock/VAT/phí, idempotency key, transaction/audit; xác thực người mua và lưu dữ liệu tối thiểu.
- Admin: owner channel visibility/price-list mapping, publish workflow, order operation, inventory/reservation và audit; không tạo API Admin public.
- Pagination, rate limiting, validation whitelist query, sanitization, authorization, CORS allowlist, cache invalidation và provenance rõ.
- SSR không gọi API trả cả dữ liệu NET rồi lọc ở component; API phải whitelist trường public ngay từ server.
- Cùng một SKU trả dữ liệu khác nhau theo channel, không chỉ đổi CSS.

## 6. Đơn hàng, kho và thanh toán — cần quyết định trước khi code giao dịch
- Giai đoạn đầu có thể cho đặt yêu cầu/đặt hàng thanh toán khi nhận nếu được Owner chốt; không tự giả định đã COD hoặc chuyển khoản.
- Đặt hàng gồm mã đơn duy nhất, trạng thái đơn, snapshot tên/SKU/giá/VAT/tổng/địa chỉ/giao nhận, hủy/hoàn theo quyền, audit.
- Đơn giá/ưu đãi không do browser quyết; API tính lại và trả lỗi giải thích khi giá/stock đổi.
- Kho chung/riêng Futurebook và Đại Việt phải được chốt trước khi xử lý trừ tồn. Không tự dùng chỉ số “còn hàng” khi chưa có nguồn tồn thật.
- Giao hàng, phí, phương thức thanh toán, hóa đơn và điều khoản pháp lý phải lấy nguồn do Owner duyệt.

## 7. Media, SEO và analytics
- R2 giữ ảnh chính thức đã duyệt; không dùng ảnh PDF screenshot làm asset production. Có alt, kích thước, quyền sử dụng, variant gallery.
- SEO: canonical domain riêng Đại Việt; metadata, structured data Product/Offer chỉ khi có dữ liệu, sitemap theo published URLs, robots phù hợp; không duplicate SEO giữa 2 website.
- Analytics website: dự kiến project PostHog riêng nếu quyền/gói hỗ trợ và Owner duyệt; chỉ đo pageview/search/cart/checkout ở mức cần thiết, loại trừ PII và giá nội bộ. Admin telemetry hiện tại không được bật posthog-js/session replay tự phát.
- Quan trắc: lỗi runtime và giao dịch, không log secret, địa chỉ đầy đủ hay chi tiết thanh toán.

## 8. Boundary tests thiết yếu
1. Admin đổi giá/ẩn SKU Đại Việt không đổi giá/hiển thị kênh Futurebook nếu không được chỉ định.
2. SKU chỉ có tại Futurebook không hiện Đại Việt; SKU chỉ Đại Việt không rò các kênh khác.
3. Client API bất kỳ không lấy NET và giá đại lý.
4. Dùng SKU có số 0 đầu, mã chữ/số, barcode trùng; không merge nhầm.
5. Read-only public không thể gọi API admin bằng cookie giả/thiếu quyền.
6. Deploy Đại Việt không tự thay Vercel Futurebook/Admin/Worker.
7. Giỏ hàng/checkout API ngăn đơn trùng, giá giả và race stock.
