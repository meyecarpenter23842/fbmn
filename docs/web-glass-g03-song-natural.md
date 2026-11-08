# G03 — Song Natural Premium Purple Glass UI (Website-only)

**Mẫu nghiệm thu đầu tiên:** `/san-pham/sku-3ac08ff247847c1e77bfccb0e806ed29` (Song Natural).
**Nguồn chuẩn:** [UI Contract chung](futurebook-ui-contract.md), [Website Glass UI V2](web-component-design-system.md), [G01](web-glass-g01-audit.md), [G02](web-glass-g02-components.md).

## Phạm vi thay đổi

- Route `app/san-pham/[slug]/page.tsx` dùng cờ **duy nhất theo slug mẫu** để bật GlassPageBackdrop, truyền chế độ kính cho SKU/gallery/related cards. Các trang sản phẩm còn lại giữ kiểu hiển thị hiện tại; SEO, đường dẫn, dữ liệu đều dùng như trước.
- `components/catalogue-product-options.tsx` giữ nguyên `useState`, `availableVariantFacets`, `visibleVariants`, `moveVariantFacet`, `photosForSku`, reset bộ lọc, mã SKU và hiển thị giá bán lẻ có điều kiện; dùng `GlassChip` và `GlassPanel` chỉ trên trang mẫu. `GlassButtonLink` giữ nguyên `href="/#contact"` và nhãn `Liên hệ báo giá`.
- `components/published-image-gallery.tsx` giữ ảnh thật, thumbnails, `aria-pressed`, click và `key={selected.sku}`; ảnh bìa nằm trên `GlassMediaFrame` trắng trung tính, không bị kính nhuộm màu.
- `components/catalog-ui.tsx` giữ `ProductCard` và liên kết/ảnh/data như trước; thêm opt-in `glass=false` để related cards hiển thị bằng `GlassCard` khi vào Song Natural.
- `components/catalogue-related-products.tsx` giữ danh sách gợi ý và thứ tự theo hàm recommendations cũ; thêm panel kính khi bật cờ.
- CSS nằm ở `app/glass-product-detail.css`, load sau `glass-foundation.css`. Mọi selector layout chính đều gắn `.fb-glass-song-page` để không thay Admin, Đại Việt hay trang sản phẩm khác.

## Visual target

| Vùng | Trình bày | Bảo vệ |
|---|---|---|
| Background | Gradient lavender layer (R2 decorative cấu hình ở G04) | Không URL giả, không asset SKU giả |
| Gallery | Card glass 24px, inner photo frame trắng 20px, thumbnail active có border tím | Giữ đúng ảnh, ALT, gallery click |
| Product info | GlassPanel mạnh, bóng nhẹ, typography rõ | Giữ tên/mô tả/số lượng SKU/quy cách |
| Facet & SKU | Chip glass/pill; selected tím rõ, touch target >=44px | Giữ logic audience/format/SKU/pressed |
| CTA | Primary gradient tím pill | Vẫn dẫn tới `/#contact`; không thay business |
| Related | GlassPanel + GlassCard hover theo token 200ms | Giữ cùng `ProductCard`, public image/URL |

## Nghiệm thu / release gate

- PR ở repo phụ, CI quality / Next.js build / TypeScript / tests / lint, Codex review sạch rồi squash merge.
- **Chưa deploy production hoặc migration**, không thay Admin. Screenshot UAT thực tế 1440, 1280, 768, 390, 360px trên build được triển khai để Owner duyệt trước khi rollout G04–G05; không gọi mockup hoặc screenshot production cũ là ảnh nghiệm thu G03.
- Trước nghiệm thu: kiểm từng nhóm Học sinh/Sinh viên, A4/A5 và mọi mã SKU có thật, gallery với ảnh thiếu, CTA, related links, no horizontal overflow, focus, reduced-motion, FPS không giật; không tự tạo ảnh / dữ liệu nếu thiếu.
