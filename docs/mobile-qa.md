# Mobile QA — tham chiếu mới 28/10/2026

Bản web responsive **không có bottom navigation** theo xác nhận từ ảnh staging iPhone ngày 28/10/2026 (ghi đè chi tiết dock trên ảnh composite). Xem docs/ui-system.md.

Checklist 360px, 390px và 768px:
- [ ] Header chỉ có logo, tìm kiếm, giỏ hàng và hamburger; ESC đóng menu.
- [ ] Hero xếp dọc, chữ và slogan nằm trên, ảnh tập bên dưới, không tràn ngang.
- [ ] Dải danh mục kéo ngang, có ~4 items hiện ra ở điện thoại.
- [ ] Khu sản phẩm nổi bật hiển thị 2 cards mỗi trang và nút carousel accessible.
- [ ] A4/B5 promo có thể vuốt ngang.
- [ ] Không có bottom navigation/dock fixed; footer cuộn tự nhiên, không có padding đáy thừa.
- [ ] Ảnh thumbnail category card hiển thị placeholder CSS đủ rõ, không trống do scale.
- [ ] Giỏ hàng/tài khoản ở header chưa mở => disabled, không thao tác giả.
- [ ] Không có price/SKU/contact mockup trong DOM public.
- [ ] Kiểm tra tác vụ keyboard, touch, scroll snap và prefers-reduced-motion.

Current status: CI structure tests thay thế kiểm thử cũ, vẫn cần visual UAT trên thiết bị.
