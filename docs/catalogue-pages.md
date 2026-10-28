# WEB PR 06 — Trang danh mục, tìm kiếm và chi tiết sản phẩm

Scope: GitHub Issue #8. Thực hiện sau WEB PR04/05; không migration, không gọi Neon, không sửa `order`, không deploy Vercel tự động.

## Routes

| URL | Chức năng | Khi chưa có SKU đã duyệt |
|---|---|---|
| `/san-pham` | Tìm kiếm, lọc nhóm, khổ giấy, GSM, sắp xếp, phân trang (12/trang) | Thông báo "Catalogue đang được cập nhật" |
| `/danh-muc/[slug]` | Chi tiết nhóm và danh sách SKU được xác minh | "Danh mục chưa được công khai" |
| `/san-pham/[slug]` | Ảnh, tên, SKU, quy cách, giá retail được phép công khai và CTA liên hệ | "Sản phẩm chưa được công khai" |

Không phát sinh truy vấn private API từ trình duyệt. Dữ liệu public chỉ đi qua `getPublicCatalog` từ `lib/catalog/adapter.ts`, gọi `toPublicCatalog` (closed-by-default) từ PR04; khi PR08 triển khai Workers thay **adapter duy nhất**, không viết lại trang.

## Deep link

Query-string: `q` (dấu tiếng Việt không bắt buộc, tối đa 80 ký tự), `nhom` (4 ProductGroup), `kho`, `gsm`, `sap-xep` (name/name_desc/sku), `trang`. GET form => lưu link và chia sẻ trang lọc; bộ lọc được normalize, giới hạn giá trị và không thực hiện SQL/raw query. Slug category được duyệt có thể khai báo trong PR04 Category, fallback category.id; validator chặn slug trùng.

## Hiển thị media

Ảnh lấy từ `PublicProduct.media` đã lọc bởi PR04 approval và source verification. PR06 chỉ có thể dựng URL khi key có dạng `products/{SKU}/{name}-vN.webp` (cũng cho PNG/JPG/AVIF) và có vetted `NEXT_PUBLIC_MEDIA_BASE_URL` HTTPS, không phải r2.dev. Không có URL hoặc tải lỗi: hiển thị placeholder **"Ảnh chính thức đang cập nhật"** chứ không dùng ảnh SKU giả.

**Lưu ý bảo mật:** kiểm tra URL ở client/server không thay thế kiểm tra quyền tại nguồn. PR08 Workers media endpoint phải chặn truy cập keys chưa xuất bản và giá NET/hợp đồng. Quy trình Admin quản trị ảnh category riêng với ảnh sản phẩm vẫn phải thực hiện theo #7/#19. PR06 không làm upload trực tiếp.

## Không sử dụng dữ liệu giả

- `lib/catalog/data.ts` hiện 0 category/0 SKU xác minh. Trang công khai giữ đúng dữ liệu trống.
- `lib/ui-preview.ts` chỉ tạo minh họa cho trang chủ cũ, KHÔNG được import vào trang catalogue mới.
- Chỉ retail price có approved source và còn hiệu lực được công khai. NET/dealer/contract không ở Public DTO.
- Chưa có đơn hàng hoặc Auth được nghiệm thu, nên không bật checkout, đặt hàng hoặc tính chiết khấu.
- Product thiếu/slug không đúng trả trang giải thích thân thiện, không phát sinh server 500.

## Tiêu chí nghiệm thu

- [x] Bộ lọc có URL chia sẻ, tìm không phân biệt dấu tiếng Việt và chữ hoa/thường.
- [x] Phân trang, sort, group, paper size và GSM áp dụng trên Public DTO.
- [x] Route chi tiết SKU, SEO metadata (site còn `noindex` trước UAT).
- [x] Media R2 approved-only URL guard / placeholder / không có fake data.
- [x] Responsive web, mobile không bottom dock.
- [x] Automated tests cho search, deep-link, slug, media security, empty states.
- [ ] Nghiệm thu UI bằng ảnh thật từng SKU, ảnh category và hostname media được duyệt sau PR05/08/Admin.
- [ ] Kiểm thử browser/device 360/390/768/1280/1440 sau khi chủ dự án duyệt deploy preview.

Run `npm run lint && npm run typecheck && npm test && npm run build`. Không dùng CI xanh làm bằng chứng đã nghiệm thu pixel-perfect.
