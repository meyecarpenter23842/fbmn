# Lô 07 CMS — vị trí, ảnh và trạng thái xuất bản (Issue #20)

## Từ ngữ rõ ràng

- **Popup Admin**: hộp thoại tạo/sửa nội dung, chỉ người quản trị thấy. Không phải quảng cáo.
- **Popup marketing**: hộp quảng bá khi khách truy cập một trang được chọn, có thời gian chờ, giới hạn số lần mỗi phiên và cooldown sau khi đóng; KHÔNG phải login.
- **Banner**: một khối ảnh/CTA gắn vào vị trí cụ thể. Không có quyền tự chen vào trang.
- **Tin tức/Khuyến mãi**: bài ở trang danh sách/chi tiết; tùy chọn vị trí nổi bật trên trang chủ.

## Vị trí được cấu hình rõ theo kênh

| Loại | Kênh | Slot cho phép | Ý nghĩa |
|---|---|---|---|
| Banner | public_web | `home.hero` | vùng hero trang chủ, không viết đè nội dung cố định khi chưa duyệt UI |
| Banner | public_web | `home.after_products` | dải dưới Sản phẩm nổi bật |
| Banner | public_web | `category.header` | đầu trang danh mục |
| Popup marketing | public_web | `home.entry`, `category.entry`, `all.entry` | popup khách truy cập tại đúng phạm vi |
| Tin tức | public_web | `news.list`, `home.news_featured` | danh sách tin tức hoặc bài nổi bật |
| Khuyến mãi | public_web | `promotions.list`, `home.promotion_featured` | danh sách khuyến mãi hoặc ưu đãi nổi bật |
| Banner | dealer_app / consumer_app | `home.banner` | khối banner trang chủ app tương ứng |
| Popup | dealer_app / consumer_app | `home.entry` | popup marketing ở app tương ứng |
| Tin tức | dealer_app / consumer_app | `news.list` | mục tin tức app |
| Khuyến mãi | dealer_app / consumer_app | `promotions.list` | mục ưu đãi app |

Không suy luận slot từ URL hoặc cùng một kiểu CSS. Một nội dung có thể chỉ định slot khác nhau cho mỗi kênh; ảnh là **mỗi kênh × desktop/mobile**, lưu WebP riêng trong Cloudflare R2 private. App iOS/Android chưa triển khai UI: cấu hình dành cho app là **chuẩn bị dữ liệu**, không phải chức năng đã online. Khi triển khai native, app tự diễn giải slot của mình; không dùng nguyên bố cục Web desktop.

## Phát hành fail-closed

1. Owner tạo bản nháp, chọn kênh và vị trí; lưu → có ID → upload ảnh WebP theo từng thiết bị → xem trước metadata/ảnh ngay trong Admin.
2. Sau khi backend, public read-model và renderer của **kênh đang chọn** kết nối đầy đủ, mới mở thao tác Xuất bản, có kiểm nguồn, kênh, vị trí, ảnh, lịch. Không cho xuất bản ảo chỉ cập nhật cột `status`.
3. Public API chỉ trả nội dung đã duyệt/đang hiệu lực và cho đúng kênh. **Không grant public role vào bảng CMS private**, không lộ mã R2 private, NET, dữ liệu nội bộ.
4. Website: bài viết/khuyến mãi vào trang danh sách/chi tiết; banner/popup vào slot đã gắn và tự cập nhật không cần deploy; màn hình trống không tự tạo banner giả.
5. Popup marketing mặc định khi khách truy cập: delay 3 giây, 1 lần/phiên, cooldown 1440 phút. Thay đổi giá trị trong Admin phải được runtime client thực thi và test; không tính như đã hoạt động chỉ vì lưu vào DB.

## Trạng thái thực tế tại PR này

- Admin: sửa component nút/feedback 404, cấu hình slot, popup cadence, upload và preview ảnh R2 private.
- Website/App: chỉ có **contract**, chưa có renderer CMS; xuất bản hiện phải bị chặn. Bài viết, khuyến mãi, banner và popup chưa được gọi là đã hiển thị.
- Phụ thuộc deploy: Cloudflare Worker phải có build từ commit đã duyệt. Nếu Worker cũ trả 404, Admin phải hiển thị lỗi kết nối rõ ràng, **không hiển thị bảng rỗng giả**.
- Không động đến cấu trúc website đã duyệt, tính năng sản phẩm, SKU, bảng giá hoặc public API khi chỉ sửa Admin.
