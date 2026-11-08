# G03 — Song Natural Glass UI: một nguồn style, không chồng CSS

**Địa chỉ UAT:** `/san-pham/sku-3ac08ff247847c1e77bfccb0e806ed29`.
**Giới hạn:** Website Futurebook, không chạm Admin, API, data, giá NET, SKU, ảnh, routing, SEO hay backend.

## Sửa tận gốc sau UAT Owner 08/11/2026

Ảnh UAT đầu tiên bộc lộ card SKU cao 52px, text trong card quá dài và surface quá đục. Nguyên nhân là G03 áp đồng thời lớp `catalogue-variant-option` (CSS cũ) và `fb-glass-chip`, rồi dùng selector tăng độ ưu tiên trong `app/glass-product-detail.css` để đè kích thước, màu, shadow và radius. CI khi đó chưa kiểm tra CSS giao thoa.

**Nguyên tắc sửa:** class kính và class catalogue cũ **không cùng xuất hiện trên một element điều khiển**. Bỏ toàn bộ selector kiểu `.fb-glass-song-page .catalogue-*`, `.catalogue-variant-option.fb-glass-chip` và mọi override `fb-glass-chip` cấp trang; không dùng `!important`.

| Vùng | Nguồn style duy nhất | Nội dung |
|---|---|---|
| Tokens | `app/globals.css` | Tím brand, kính 50%/66%, gradient lavender nhiều lớp, blur, bóng, 36px/44px |
| GlassChip/Button/Card/Panel, states | `app/glass-foundation.css` | Dimension, radius, fill/border/shadow, motion, hover/focus/selected, reduced motion |
| Bố cục trang mẫu | `app/glass-product-detail.css` | Chỉ class riêng `.fb-song-*`: grid gallery/thông tin, thumbnail, typography, fieldset, 4 cột SKU, summary, related grid và responsive |
| Catalogue cũ | `app/catalog.css` | Giữ UI các trang sản phẩm chưa rollout; không style element `.fb-song-*` |
| Business / ảnh / CTA | `components/catalogue-product-options.tsx`, `published-image-gallery.tsx`, `catalog-ui.tsx` | Giữ nguồn dữ liệu và handlers gốc, chuyển class theo `glass` |

**Chip SKU glass:** chỉ hiển thị mã gốc (`0110`, `0114`, `M439`...), không icon, không text quy cách. `GlassChip` giữ `aria-label` gồm mã + quy cách, `aria-pressed` đúng state, 36px desktop/44px mobile. **Không có CSS `.fb-song-sku`** để ghi đè geometry. Grid 4 cột, các quy cách hiện trong summary đang chọn.

**Gallery:** `GlassCard` + frame trắng trung tính; khung ảnh, thumbnail dùng class `.fb-song-*` riêng, không trộn `.catalogue-*`. Đổi SKU vẫn remount gallery, src/alt từ media public R2 đã duyệt.

**Sản phẩm liên quan:** `ProductCard` tiếp tục dùng cùng logic ảnh, liên kết, giá/nhãn công khai. Nhánh glass dùng `GlassCard` + `GlassButtonLink` không mang class `.catalog-product`/ `.catalog-button`; nhánh legacy giữ nguyên.

**Độ trong:** chỉnh **tại token dùng chung**, không override per-page; kính sáng alpha .50 và lớp mạnh alpha .66, gradient sau kính có sắc độ sâu hơn. Không bịa decorative URL R2 (G04 mới kiểm public background config), ảnh bìa không bị lọc màu.

## Chặn tái phát

- `tests/web-glass-song-natural.test.mjs` so sánh **tập class CSS** của file G03 với CSS legacy/G01-G02; nếu trùng tên class, test fail.
- Test kiểm mặt chữ SKU chỉ là `{variant.sku}`, thông số vẫn nằm trong nhãn aria/summary; kích thước chip chỉ khai báo tại G02, không khai báo tại G03.
- Test giữ logic chọn nhóm/khổ/SKU, ảnh, liên hệ `/#contact`, recommendations, điều kiện giá bán lẻ.
- CI lint/typecheck/393+ tests/build, Codex sạch, squash merge repo phụ → local → fast-forward repo chính.
- Screenshot thật desktop/mobile sau Owner cho phép deploy; **không gọi đã nghiệm thu visual khi chưa test trên trình duyệt**.

**Admin giữ nguyên hoàn toàn. Không migration. Không tự deploy production.**
