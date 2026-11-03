# 04 — CHI TIẾT THIẾT KẾ TỪNG MÀN HÌNH
Đây là product specification (không phải giao diện đã build). Mọi nội dung/giá/banner cụ thể cần nguồn và duyệt.

## 0. Information architecture / route map đề xuất
/ (trang chủ)
/danh-muc/[slug] (danh mục; child route tùy tree)
/tim-kiem?q=... (kết quả)
/san-pham/[slug] (chi tiết)
/gio-hang
/thanh-toan (giao dịch khi backend được duyệt)
/don-hang/[id] (chỉ chủ đơn/được xác thực)
/tai-khoan (nếu có user login)
/khuyen-mai (chỉ nếu campaign thật)
/lien-he, /chinh-sach-giao-hang, /doi-tra, /bao-mat, /dieu-khoan, 404/500

Mỗi URL phải có SEO/canonical, loading, error, empty và xử lý phân quyền tương ứng.

## 1. Website shell
Desktop: (1) thanh thông tin nhỏ nếu có dữ liệu thật, (2) header logo Đại Việt bên trái, search nổi bật ở giữa, hotline/hỗ trợ (nếu duyệt), tài khoản, giỏ hàng bên phải; (3) navigation tối đa khoảng 6 nhóm, “Danh mục sản phẩm” mở mega menu có keyboard; (4) main; (5) footer nhiều cột với thông tin đã xác minh.
Mobile: header cao gọn 56–64px (đề xuất), logo, tìm kiếm/cart/hamburger; search có màn riêng hoặc expand; menu drawer keyboard accessible; mini-cart không che nút; KHÔNG tự thêm bottom dock khi chưa chốt.
Loading search/mega menu; dữ liệu không có thì ẩn mục thay vì text giả.

## 2. Homepage / landing bán lẻ
Thứ tự ưu tiên:
A. Hero 1 banner chính (đề xuất desktop 2:1, mobile ảnh riêng), headline ngắn, 1 CTA đỏ; 2 promo tiles tối đa khi được duyệt.
B. “Mua nhanh theo danh mục”: sách, tập vở, bút viết, sổ/giấy, dụng cụ học tập, quà tặng; icon/ảnh phù hợp.
C. “Mua theo nhu cầu”: đi học, văn phòng, sáng tạo, quà tặng; CMS quản lý thứ tự.
D. Sản phẩm nổi bật/bán chạy — chỉ khi có logic dữ liệu thực; card nhất quán.
E. Combo và ưu đãi — chỉ khi chính sách thật, ngày hiệu lực, stock.
F. Thương hiệu nổi bật, bài viết hữu ích (tùy dữ liệu), lợi ích/đổi trả có xác minh, footer.
Không quá 1 nhóm carousel tự động; ưu tiên user control, pause motion; không đặt popup khuyến mãi cưỡng bức.

## 3. Category listing
Breadcrumb và H1, mô tả 1–2 dòng; sidebar desktop: danh mục con/thương hiệu/giá/quy cách/khổ/số trang/dòng kẻ khi dữ liệu có; sort phổ biến/mới/giá tăng giảm; count chỉ khi API trả.
Thẻ desktop: 4 cột nếu rộng, 3 nếu sidebar; mobile 2 cột và filter button mở drawer. Filters có URL query sync, reset, back/forward, pagination hoặc load-more phù hợp SEO.
Trạng thái: no results gợi ý xóa lọc, loading skeleton, API error retry, invalid filter value fallback an toàn, không hiển thị sản phẩm thuộc kênh khác.

## 4. Search / suggestions
Nhập từ khóa tối thiểu 1–2 ký tự tùy UX test, debounce phù hợp, tìm tên/từ khóa/SKU/ISBN nếu có; suggestions nhóm sản phẩm và danh mục, giới hạn số mục và link xem tất cả.
Keyboard arrows/Enter/Esc, đọc bằng screen reader, clear query, no-results không fake. Không lưu truy vấn cá nhân tùy tiện; tránh in query chứa PII vào analytics.

## 5. Product detail (PDP) — màn quan trọng
Desktop: gallery bên trái (ảnh chính + thumbnails, zoom phù hợp); bên phải tên, thương hiệu, SKU đã chọn, trạng thái hàng, giá bán lẻ Đại Việt đúng kênh, thông số ngắn, variant selector, số lượng, CTA mua/thêm giỏ.
Mobile: gallery full-width dạng swipe, title+giá+variant+quantity; sticky purchase CTA chỉ nếu không che nội dung/keyboard; phần mô tả, thông số, chính sách là accordion hoặc section.
Thứ tự variant đề xuất size → pages → ruling → cover/màu, nhưng thực tế theo product data; disable tổ hợp không có SKU. Click vào biến thể thay đúng SKU, URL, ảnh, giá, tồn kho; thiếu giá/stock thì CTA phù hợp và giải thích, không cho thêm hàng không hợp lệ.
Bên dưới: mô tả thực, specs, giao nhận, đổi trả, gợi ý hàng cùng nhóm; không giả review/rating đã bán.
Price: định dạng VND, giá giảm/gạch chỉ nếu có giá niêm yết và khuyến mãi được phê duyệt, hiển thị chi tiết thuế/phí theo nghiệp vụ.
Mini popup chọn mẫu có thể dùng ở listing nhưng phải đồng nhất PDP.

## 6. Cart
Mỗi line keyed theo SKU/variant (không chỉ product_id), ảnh, tên, option, unit, unit_price, số lượng, line total, trạng thái không còn bán. Thay quantity/delete có toast success, xác nhận khi phù hợp. Đơn giá/tạm tính được server revalidate trước checkout.
Empty-cart có đường về catalog; errors mạng giữ hàng trong cart, lỗi đồng bộ giá hiển thị rõ. Không leak tài khoản khi chia sẻ thiết bị.

## 7. Checkout
Phân bước gọn: người mua + địa chỉ/phương thức nhận + lựa chọn giao hàng/thanh toán (chỉ khi đã ký) + kiểm tra tổng + đặt hàng. Nhập liệu label rõ, lỗi trường inline, nút đặt có chống double-click, loading. Totals phải thể hiện giá hàng, ưu đãi (nếu có), phí, thuế và số tiền cuối.
Server xác thực SKU/publish/price/stock/kho/shipping; trả thay đổi rõ ràng và yêu cầu xác nhận lại. Order confirmation hiển thị mã đơn thật; không coi navigation thành tạo đơn thành công.
Điều khoản, dữ liệu cá nhân và consent tuân thủ chính sách đã duyệt; không tự gửi email/SMS quảng cáo.

## 8. Account / order
MVP ưu tiên xem trạng thái đơn bằng cơ chế bảo mật phù hợp; không bắt người dùng tạo tài khoản nếu luồng guest được duyệt. Nếu có login: bảo vệ thông tin cá nhân, chỉ chủ đơn xem, session expiry, chống enumerate mã đơn.
Lịch sử đơn, địa chỉ, thông tin liên hệ có quyền sửa/xóa theo chính sách; các thao tác phải có toast và confirmation cần thiết.

## 9. Trang thông tin
Contact hiển thị địa chỉ/hotline/email/social có xác minh và form anti-spam. About, delivery, returns, privacy, terms có bản duyệt nội dung. Trạng thái rỗng và 404 trình bày nhẹ nhàng, hướng về danh mục, không viết chính sách pháp lý hư cấu.

## 10. Mobile QA cụ thể
360/390 portrait, 768 tablet, 1280/1440 desktop. Test bàn phím mở, search overlay, menu drawer, filter drawer, page scrolling, safe-area, long Vietnamese SKU/product name, giá dài, badge, toast, hình thiếu, hình lỗi, quantity buttons, sticky CTA, network slow, cookies/privacy.
