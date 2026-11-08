# Futurebook Miền Nam — G01 UI Foundation audit & implementation

**Phạm vi:** Website Futurebook (Next.js app root), không thay Admin, backend, SKU, dữ liệu, API, routing hoặc SEO.
**Quy tắc gốc:** [Website Glass UI V2](web-component-design-system.md), [UI Contract](futurebook-ui-contract.md), [roadmap duy nhất](roadmap.md).

## 1. Audit trước thay đổi

- Root website dùng `app/layout.tsx` import nhiều stylesheet toàn cục; `app/globals.css` chứa brand/control/motion tokens hiện có, cùng fallback hiển thị cũ.
- `app/rebaseline.css` điều khiển trang chủ/header được duyệt (selectors `.ref-*`); `app/catalog.css` điều khiển trang catalogue, filters, detail (selectors `.catalog-*`).
- Các vùng sản phẩm sử dụng `components/catalogue-product-options.tsx`, `components/catalogue-related-products.tsx`, `components/catalog-ui-detail.tsx`; header dùng `components/site-header.tsx`.
- Card và layout cũ có màu trắng đặc, radius/shadow riêng; chạm trực tiếp các class cũ lúc này có thể ảnh hưởng toàn bộ website chưa nghiệm thu. **G01 không sửa selectors hiện hành**.
- Tình trạng API nền decorative R2 **chưa xác minh hỗ trợ**; G01 không tạo endpoint, bảng DB hoặc hardcode URL. G04 chịu trách nhiệm kiểm public config.
- Repo có Next.js 16/React 19, CSS thuần; chưa có lý do thêm UI framework.

## 2. Quyết định kỹ thuật G01

| Nguồn | Vai trò |
|---|---|
| `app/globals.css` | **Nguồn token duy nhất** Website: màu kính, opacity, border, blur, radius, shadow, gradient fallback, motion card; giữ nguyên tokens màu thương hiệu, nút 36/44px, input 40px, chữ 13px |
| `app/glass-foundation.css` | Lớp visual **opt-in** `.fb-glass-*`; chỉ đọc token ở globals, không ghi đè `.ref-*`, `.catalog-*`, layout hay component đang chạy |
| `app/layout.tsx` | Import một lần foundation sau CSS legacy để các component G02 trở đi dùng; không đổi provider, metadata, SEO hoặc markup |
| `tests/web-glass-foundation.test.mjs` | Kiểm import, token duy nhất, no-blur fallback, blur mobile, card hover, reduced-motion, không áp Admin |

**Phong cách:** nền gradient lavender fallback, glass card/panel 24/20px, kính trắng semi-transparent, viền sáng, bóng mềm. Motion hover card 200ms, translateY(-3px) chỉ khi thiết bị có hover; trên mobile hạn chế blur 12px. Nút giữ 190ms, menu 200ms theo contract có sẵn.

**Bảo vệ tính dễ đọc:** hỗ trợ `backdrop-filter` mới dùng lớp kính mờ; không hỗ trợ thì nền trắng ~94% + border tím nhạt; nội dung dày có class strong ~82% khi hỗ trợ. G02/G03 phải kiểm độ tương phản qua screenshot trên **ảnh nền thật** và tăng overlay/opacity nếu cần.

## 3. Ranh giới hoàn thành

- **G01 hoàn thành về code foundation** khi CI, Codex và PR thành công. Chưa có UI card/component thật chuyển sang V2 nên chưa thể nói toàn Website đã thay đổi giao diện.
- **G02:** xây primitives React dùng class/tokens G01, đồng thời giữ hành động của Button, Card, Chip, Header.
- **G03:** trang Song Natural sử dụng primitives để đánh giá ảnh, SKU, CTA, responsive thật.
- **G04:** tích hợp ảnh nền decorative qua URL cấu hình public/R2 đã xác minh; fallback nếu thiếu.
- **G05:** rollout đến các trang Website khác, không đụng Admin.
- **G06:** full UAT viewport 1440/1280/768/390/360, a11y, focus, screenshot thật, Web Vitals.

## 4. QA / release gate

CI dùng `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` theo workflow hiện tại; Codex review sạch trước squash merge. PR G01 không deploy; không migration. Chưa có screenshot visual thay đổi vì tất cả selectors G01 là opt-in và chưa có component runtime sử dụng. Không được báo nghiệm thu visual trước G03/G06.
