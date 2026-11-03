# 00 — MASTER PLAN NHÀ SÁCH ĐẠI VIỆT
Version 1.0 · 03/11/2026 · BẮT BUỘC ĐỌC TRƯỚC KHI LÀM

## 1. Tuyên bố sản phẩm
Xây một website thương mại điện tử responsive, hướng bán lẻ sách, tập vở, giấy, văn phòng phẩm và quà tặng dưới thương hiệu Nhà sách Đại Việt. Thẩm mỹ Modern + Playful: chuyên nghiệp, dễ đọc, có sắc đỏ thương hiệu, nội dung sinh động nhưng không rối. Ưu tiên mobile, tìm kiếm nhanh, chọn đúng biến thể và mua hàng dễ. PWA là mục tiêu giai đoạn sau, không tự triển khai native app.

Benchmark ý tưởng: tính năng tìm và khám phá hàng hóa của Fahasa, cấu trúc dễ hiểu của Phương Nam và trải nghiệm chọn biến thể/combo của các sàn; KHÔNG sao chép layout, ảnh, copy hoặc mã nguồn của các đối thủ.

## 2. Quyết định kiến trúc đã chốt
- MỘT repo: github.com/alibaba240185/fbmn. Website Futurebook tiếp tục ở app/**; Admin chung tại apps/admin/**; Đại Việt tương lai tại apps/dai-viet/**.
- MỘT Admin, không xây thêm Admin Đại Việt; mở rộng bằng kênh/tenant hiển thị “Đại Việt”, vai trò và quyền kênh trong Admin hiện có.
- HAI website có nhận diện và cách bán riêng: Futurebook giữ tím đã duyệt; Đại Việt đỏ; UI Core chia sẻ hành vi và kích thước, không chia sẻ cứng màu.
- TRIỂN KHAI RIÊNG: Vercel project và domain/biến môi trường riêng từng frontend; thay đổi Đại Việt không deploy lại Futurebook/Admin.
- NGUỒN DỮ LIỆU có thể dùng chung SKU và thư viện media, nhưng giá/kênh/hiển thị và các quyền đọc phải tách nghiêm ngặt.
- GIỮ NGUYÊN mọi nghiệp vụ Futurebook đã được duyệt; không refactor hệ cũ chỉ vì thêm app mới.

## 3. Nhóm người dùng và hành trình trọng tâm
1. Phụ huynh / học sinh / sinh viên: tìm sách, tập, bút → lọc theo cấp học, giấy, dòng kẻ → chọn mẫu và số lượng → đặt hàng.
2. Người làm văn phòng: tìm sổ, refill, bút và phụ kiện → so sánh quy cách → đặt nhiều sản phẩm.
3. Người mua quà: khám phá theo chủ đề/mức giá → xem combo, giấy gói, thiệp → mua.
4. Trường học / doanh nghiệp: xem catalog công khai → gửi yêu cầu số lượng lớn (không tự áp giá đại lý/NET).
5. Nhân viên Admin: cập nhật dữ liệu sản phẩm → gán kênh Đại Việt → đặt giá bán lẻ → kiểm tồn kho → xử lý đơn → kiểm tra nhật ký.

## 4. Khác biệt thương mại cần hiện thực
- Gộp các mẫu bìa cùng quy cách thành một nhóm hiển thị; biến thể chọn rõ SKU, ảnh, dòng kẻ, số trang, tình trạng và giá đúng dòng.
- Tìm bằng tên, mã SKU, danh mục, thương hiệu; ISBN nếu sách có và dữ liệu được duyệt.
- “Mua theo nhu cầu”: đi học, làm việc, sáng tạo, quà tặng; không tạo danh mục ma hay công bố lời quảng cáo chưa xác minh.
- Giỏ hàng ít bước, sửa số lượng ngay, chi tiết tiền và phí minh bạch.
- Thiết kế nhẹ, thân thiện thiết bị 360px; tối ưu truy cập chậm.

## 5. Phạm vi MVP và ngoài phạm vi
MVP BẮT BUỘC:
- Homepage, header, search, category tree, category listing/filter/sort, product detail/variant, cart, checkout phù hợp phương thức đã được Owner phê duyệt, order confirmation, trạng thái đơn và trang chính sách/liên hệ có nguồn.
- Kênh Đại Việt trong Admin chung: cấu hình publish, bảng giá bán lẻ, media, danh mục hiển thị, đơn hàng và kiểm quyền.
- Error/empty/loading states, SEO, accessibility, logs vận hành không rò dữ liệu.

CHƯA MẶC ĐỊNH LÀM:
- Ví điểm/tích điểm, voucher phức tạp, app iOS/Android native, loyalty đa tầng, kết nối trực tiếp Shopee/Facebook, tự động đồng bộ tồn kho/đơn đa sàn, chatbot AI, thanh toán trực tuyến, in hóa đơn điện tử, recommendation AI. Mỗi hạng mục cần API/pháp lý/nghiệm thu riêng.

## 6. Roadmap theo lô và điều kiện nghiệm thu
| Lô | Tên | Phụ thuộc | Đầu ra | Gate |
|---|---|---|---|---|
| DV-00 | Governance & design spec | Không | Tài liệu hiện tại, rule routing, CI giữ tài liệu | Đọc plan trong PR, không ảnh hưởng app cũ |
| DV-01 | Foundation + nhận diện | DV-00 + logo/đỏ xác thực | Next app độc lập, theme token, primitives, layout shell, trang trống đúng chuẩn | Responsive 360/390/768/1280/1440; CI |
| DV-02 | Trang chủ & khám phá | DV-01 + cấu trúc danh mục/asset duyệt | Header/nav, hero CMS, ô tìm, category quick links, merchandising modules | Không dữ liệu giả; keyboard và mobile |
| DV-03 | Catalog, search, listing | DV-02 + API read-model duyệt | Danh mục, breadcrumb, lọc, sắp xếp, pagination/URL state | Thử query/zero results, URL có thể chia sẻ |
| DV-04 | Sản phẩm & biến thể | DV-03 + SKU/model mapping | Gallery, chọn variant/SKU, giá/stock của Đại Việt, related items | Không lộ NET, không trộn SKU, no double-price |
| DV-05 | Cart/checkout/orders | DV-04 + quyết định fulfillment, pháp lý, payment | Cart, checkout, đặt hàng chống trùng, xác nhận, theo dõi đơn | E2E, stock/pricing revalidation, security |
| DV-06 | Admin channel integration | DV-01..05 theo từng API | Kênh Đại Việt, publish, giá bán lẻ, đơn/khách/permission/audit trong Admin chung | Owner UAT và kiểm tra ngược kênh Futurebook |
| DV-07 | SEO/performance/analytics | DV-02..06 | Metadata, sitemaps, CWV, PostHog website riêng nếu được duyệt | Không gửi thông tin nhạy cảm; kiểm production-like |
| DV-08 | Launch & hậu kiểm | Các lô MVP được ký | Domain/SSL, rollback, monitoring, hỗ trợ, checklist ra mắt | Owner quyết định production deploy, smoke + nghiệm thu |

DV-06 có thể song hành với DV-03/04/05 theo hợp đồng API; không chờ tới cuối để mới kiểm quyền/giá. Nếu thiếu dữ liệu/hạ tầng, thực hiện UI states thật, không bật nút giao dịch giả.

## 7. Các cổng quyết định / phụ thuộc
G1 nhận diện: logo chính thức, màu đỏ chuẩn, ảnh banner/asset, câu slogan, dữ liệu liên hệ và chính sách có xác minh.
G2 catalog: danh mục sách/VPP, mapping SKU/nhóm mẫu, quy tắc ẩn/hiện, nguồn ảnh, trạng thái publish.
G3 giá: bảng giá bán lẻ riêng, VAT, thời điểm áp dụng, quyền thay giá, chính sách khuyến mãi — không tự suy từ bảng báo giá.
G4 đơn/kho: nguồn tồn kho, quy tắc giữ hàng, đơn vị bán, phí vận chuyển, khu vực phục vụ, phương thức thanh toán, chính sách hoàn hủy.
G5 pháp lý: điều khoản, đổi trả, bảo mật, quyền riêng tư, trách nhiệm xử lý đơn.
G6 hạ tầng: hostname, DNS, Vercel project riêng, secrets, Worker endpoints, log/replay cho phép.

Không chặn việc viết tài liệu hoặc dựng UI shell bởi G1..G6; PHẢI chặn hiển thị giá/checkout/claim công khai cho đến khi dữ liệu được xác minh.

## 8. Định nghĩa hoàn thành theo lô
Mỗi lô có issue/phạm vi không trùng, branch, PR, before/after khi có UI, CI xanh, review sạch, quyền/giá/negative cases, QA responsive, cập nhật master + decision log, merge theo gate. Chỉ gọi “đã production” sau bằng chứng triển khai và Owner UAT. Docs-only DV-00 không có screenshot runtime và không được gọi là website đã dựng.

## 9. Các nguyên tắc cấm
Không lập Admin riêng; không đưa Đại Việt vào app/** bằng cách thay website Futurebook; không đổi màu tím của Futurebook thành đỏ; không copy CSS/tokens theme sang nhau; không auto import giá NET thành giá khách thấy; không đoán giá/khuyến mãi/logo/địa chỉ; không triển khai tự động.
