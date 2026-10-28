# Mobile QA — tham chiếu mới 28/10/2026

Quy định cũ cấm bottom-tabs đã được **chủ dự án thay thế**. Xem docs/ui-system.md.

Checklist 360px, 390px và 768px:
- [ ] Header chỉ có logo, tìm kiếm, giỏ hàng và hamburger; ESC đóng menu.
- [ ] Hero xếp dọc, chữ và slogan nằm trên, ảnh tập bên dưới, không tràn ngang.
- [ ] Dải danh mục kéo ngang, có ~4 items hiện ra ở điện thoại.
- [ ] Khu sản phẩm nổi bật hiển thị 2 cards mỗi trang và nút carousel accessible.
- [ ] A4/B5 promo có thể vuốt ngang.
- [ ] Bottom navigation **cố định**: Trang chủ, Danh mục, Giỏ hàng, Tài khoản.
- [ ] Bottom nav có safe-area inset, không phủ nội dung hoặc chặn tap.
- [ ] Giỏ hàng/tài khoản chưa mở => disabled, không thao tác giả.
- [ ] Không có price/SKU/contact mockup trong DOM public.
- [ ] Kiểm tra tác vụ keyboard, touch, scroll snap và prefers-reduced-motion.

Current status: CI structure tests thay thế kiểm thử cũ, vẫn cần visual UAT trên thiết bị.
