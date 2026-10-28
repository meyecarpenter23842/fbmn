# Nguồn ảnh động cho card Futurebook

Quyết định: không hardcode ảnh danh mục/SKU vào source Next.js. Hiện tại card nhỏ là CSS demo và không phải ảnh thật. Hình tương lai dùng chung cho web và native app.

| Đối tượng | Ảnh quản trị | Khóa |
|---|---|---|
| Category | thumbnail chính (+ banner tùy chọn) | category.id |
| SKU / variant | cover và album chi tiết | variant.id / sku |
| Campaign | hero, banner, popup | campaign.id |

Luồng: Admin upload ảnh -> Cloudflare R2 private staging -> xác minh nguồn, MIME và quyền dùng -> Publisher duyệt -> Neon lưu quan hệ media/category/SKU, thứ tự, version và trạng thái -> Workers API trả ảnh đã duyệt -> Web/Native app hiển thị.

Public DTO dự kiến: category {id, slug, name, sortOrder, image: {src, alt, width, height} | null}; product {id, slug, cover: image | null}. Không gửi giá NET/contract, ảnh nháp, token upload hoặc URL staging đến frontend. Thiếu ảnh/hỏng CDN thì fallback an toàn.

Quy ước path: R2 hiện chỉ cho brand/products/banners, **chưa** hỗ trợ ảnh category. Trước khi upload thật phải bổ sung category namespace trong validator PR05, quy trình approval và kiểm thử; không lách bằng đặt ảnh vào folder banners. Các metadata lưu Neon, URL public phát bởi Workers.

Web Admin (Issue #19) cho phép sửa ảnh và thứ tự mà không deploy; backend Workers/Neon (Issue #10) là nguồn dữ liệu gốc; trang danh mục (Issue #8) dùng DTO; media R2 (Issue #7) kiểm soát quyền công khai; CMS marketing (Issue #20) tách biệt.

Chưa có SKU/thumbnail được xác minh trong Project tại thời điểm chỉnh sửa. Không suy diễn từ ảnh thiết kế.
