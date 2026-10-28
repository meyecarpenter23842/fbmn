# WEB PR 04 — Hợp đồng catalogue Futurebook Miền Nam

**Trạng thái:** schema/validation/public projection, chưa nhập SKU thật, chưa kết nối database.
**Nguồn:** Issue #6. Ngày 28/10/2026 chưa truy cập được 2 PDF bảng giá trong Project Files/Library; KHÔNG suy diễn giá/thông số từ bản mockup. Không thay đổi repo order.

## 1. Mô hình chuẩn, dùng chung đa nền tảng

- Category: nhóm school_notebook / student_notebook / memo_book / stationery; trạng thái hiển thị và thứ tự.
- Product: tên, slug, category, mô tả, nguồn, trạng thái, publicPriceMode.
- Variant: SKU duy nhất toàn hệ thống (không phân biệt hoa/thường), trạng thái, quy cách khổ giấy/số trang/GSM/đóng gáy/bìa/quy cách đóng gói và giá theo SKU.
- Media: R2 object key, alt text, thứ tự, phê duyệt và nguồn; đường dẫn ảnh public được media-service phát hành ở PR05/08.
- Evidence: tên tài liệu, ngày ban hành YYYY-MM-DD, trang, trạng thái pending/estimated/confirmed, người/ngày xác nhận.
- PriceRecord: kind NET/dealer/retail/contract, số tiền VND, thời gian hiệu lực, trạng thái duyệt, nguồn xác minh.

Dữ liệu thực được thay bằng adapter trên Cloudflare Workers/Neon ở PR08, không thay đổi hợp đồng DTO. Không migration/gọi production trong PR04.

## 2. Ranh giới giá và bảo mật

| Phân loại | Nội bộ/quản trị | Website và Native App công khai |
|---|---|---|
| NET, dealer, contract | Chỉ role có quyền, không nằm trong public DTO | **Không** |
| Retail | Lưu nguồn, hiệu lực, phê duyệt | Chỉ khi product + SKU confirmed, mode retail, retail approved và còn hiệu lực |
| Không có giá retail duyệt | Trạng thái pending | **Liên hệ báo giá** |
| Dữ liệu nguồn, ghi chú nội bộ | Nội bộ | **Không** |
| Ảnh chưa xác minh | Nháp | **Không** |

Public serializer tại lib/catalog/public.ts là phép chiếu theo **danh sách trường cho phép**, không serialize toàn bộ product rồi xóa các trường nhạy cảm. Trước khi đưa dữ liệu thực lên API phải kiểm tra quyền **server-side** cho mọi truy vấn NET. Không coi ẩn trường trong frontend là bảo mật.

## 3. Lệnh kiểm tra

npm run lint
npm run typecheck
npm test
npm run build

npm test chạy Node 22 với --experimental-strip-types để thực thi trực tiếp TypeScript catalogue. Fixture synthetic trong tests/catalog.test.mjs dùng chuỗi DEMO, không import vào lib/catalog/data.ts hay website. Adapter production hiện là 0 sản phẩm — đúng theo tình trạng nguồn.

## 4. Checklist dữ liệu còn chờ

- [ ] BBG Vở HS-SV 10.04.2026.pdf: xác nhận danh sách SKU và cột quy cách, giá và hiệu lực.
- [ ] BG NET VPP & SP Giấy 05.10.2026 (update).pdf: xác nhận SKU, NET, đơn vị tính và thay đổi bảng giá.
- [ ] Catalogue/ảnh SKU thật: xác nhận ảnh nào tương ứng SKU nào, quyền sử dụng và phiên bản.
- [ ] Danh mục nhóm hàng được chủ dự án duyệt và mapping SKU → biến thể.
- [ ] Bảng giá bán lẻ **được phê duyệt riêng** nếu muốn hiện giá public.
- [ ] Trạng thái khả dụng, mã nhóm, điều kiện bán hàng và chính sách giá đại lý (nội bộ).
- [ ] Ghi log ai xác minh/duyệt/đổi dữ liệu và thời điểm, trước khi triển khai Admin.

## 5. Nghiệm thu & cổng triển khai

- Schema và validator: category, product, variant, media, price và evidence; chống SKU trùng.
- Public DTO không rò NET/dealer/contract và khóa dữ liệu demo.
- Trang web hiện vẫn là UI preview PR01–03; không được hiểu là catalogue thật.
- Chỉ sau khi được duyệt: thiết kế migration Neon có rollback, audit/backup và môi trường thử nghiệm, **không** chạy trên production mặc định.
- Không có public write endpoint. PR08 mới triển khai Workers, PR09 triển khai quyền và quản trị khi cần.

Giới hạn hiện tại: Không có dữ liệu SKU đã xác nhận để import nên số sản phẩm thật = **0**.
