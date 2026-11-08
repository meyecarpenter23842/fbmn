# G05 — Website Premium Purple Glass rollout (08/11/2026)

**Nguồn tham chiếu:** Hai ảnh UI mẫu do Owner cung cấp trong chat, kích thước 1122×1402 và 1086×1448. Đây là **tham chiếu phong cách**, không phải ảnh sản phẩm, số liệu, hotline hoặc chính sách để đưa lên Website.

**Phạm vi:** Website Futurebook hiện hữu, dùng chung repo. **Không thay Admin, Worker, DB, CMS, quyền, SKU, giá, nội dung kinh doanh, URL hoặc SEO.** Mọi route giữ navigation và thứ tự section cũ.

## Bảng triển khai

| Khu vực | File style owner | Thay đổi |
|---|---|---|
| Một decorative backdrop cho toàn Website | `app/layout.tsx`, `app/glass-foundation.css` | `GlassPageBackdrop` bao quanh trang dùng `publicDecorativeBackground.website`, đọc chính `/api/decorative-background`. Không tải lặp nền trong Song Natural; gradient G04 fallback |
| Tokens kính, màu nền xanh lá nhẹ, type display | `app/globals.css` | Chỉ khai báo ở đây, fallback opaque khi không hỗ trợ blur |
| Header, navigation và homepage | `app/rebaseline.css`, `app/page.tsx` | Chất kính sáng, border trắng mảnh, nav active tím, hero kính; card demo dùng `GlassCard`, CTA đỏ cũ giữ nguyên |
| Nhóm sản phẩm | `app/category-navigation.css` | Sáu tile glass giữ nguyên liên kết, mobile cuộn ngang |
| Danh mục, lọc, tìm kiếm, rỗng | `app/catalog.css`, `components/catalog-ui.tsx` | Glass filter và pagination; listing dùng `ProductCard glass`, ảnh lấy dữ liệu công khai thực |
| Toàn bộ chi tiết sản phẩm | `app/san-pham/[slug]/page.tsx` | Dùng cùng G03 glass gallery/chip/SKU/CTA cho mọi sản phẩm; vẫn giữ logic chọn, ảnh và meta |
| Trang giới thiệu, tin tức, khuyến mãi, đại lý, liên hệ | `app/content.css` | Kính cho panel/card/form; **giữ biểu mẫu chưa kích hoạt ở trạng thái disabled** |
| Footer | `app/site-footer.css` | Tím gradient mềm giống cảm hứng mẫu, dùng nguyên logo/thông tin đã có, không bịa lời hứa |
| Regression | `tests/web-glass-g05-rollout.test.mjs` và cập nhật test cũ | Bảo toàn backdrop một lần, branding, business, responsive, state và CSS owner |

## Ranh giới chất lượng

- UI mới giữ control desktop 36px, mobile 44px, field 40px, nhấn tím, CTA đỏ ở homepage theo quyết định cũ.
- Header vẫn có search, tài khoản/giỏ **chưa mở**, menu desktop và hamburger mobile. Không thêm bottom dock.
- Homepage artwork vẫn có nhãn `MẪU GIAO DIỆN`; **không lấy ảnh mockup từ screenshot làm ảnh SKU**; nội dung chưa xác minh không được coi là dữ liệu bán hàng.
- CSS skin từng vùng chỉnh ngay trong stylesheet owner hiện hữu, dùng tokens từ globals. Primitive/chip/CTA chỉ thuộc glass foundation; không nhân bản màu/control trong CSS Song.
- Background thực dùng đúng endpoint G04R đã được Owner phê duyệt, không thêm URL mới, Worker route hay R2 binding. Ảnh khoảng 2.14 MB nên G06 cần đánh giá tải/ảnh mobile trước khi nghiệm thu.
- GIẢM chuyển động khi `prefers-reduced-motion`, không animate backdrop-filter, gallery/SKU logic giữ nguyên.

## Kiểm thử/phát hành

- G05 code gate: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; CI và Codex review sạch → squash merge trên repo phát triển.
- **Chưa nghiệm thu pixel trên thiết bị:** G06 kiểm tại 1440/1280/768/390/360px trên bản đã deploy được phép, cả ảnh thật, hover/focus/touch, album/SKU/CTA, navigation/menu/search, empty/disabled và fallback 404.
- **Không tự deploy production trong G05**; Owner duyệt sau khi đồng bộ 2 repo, sau đó mới test visual trực tiếp.
