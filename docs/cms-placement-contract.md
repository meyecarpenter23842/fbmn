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

## C3 — preview đối chiếu theo bố cục Website thực tế (08/11/2026)

- **Nguồn giao diện:** `app/page.tsx`, `app/rebaseline.css`, `app/category-navigation.css`, `app/danh-muc/[slug]/page.tsx`, `components/catalog-ui.tsx`, `app/tin-tuc/page.tsx`, `app/khuyen-mai/page.tsx`, `components/content-ui.tsx`, `app/content.css`, `components/site-header.tsx`. Mapping kiểm được ở `apps/admin/app/cms-website-scene-map.ts`; scene riêng tại `cms-website-scene.tsx` / `cms-website-scene.css`, không import runtime hoặc CSS Website vào Admin.
- **Trang chủ:** header desktop gồm logo/search/actions + navigation; mobile logo và icon thu gọn, không có bottom dock. Hero hiện có nội dung cố định; dải danh mục 6 mục; Sản phẩm nổi bật; sau đó đến hai ô Vở A4/B5. Preview banner `home.hero` là **vị trí chèn dự kiến bên cạnh Hero cố định** (không thay thế nội dung chính). `home.after_products` ngay sau Sản phẩm nổi bật và trước hai ô. `home.news_featured` / `home.promotion_featured` **chưa có vùng live**: scene mô tả vị trí dự kiến để Owner phê duyệt trước khi C4 làm renderer, không tự chèn vào trang công khai.
- **Danh mục:** breadcrumb → vị trí `category.header` dự kiến → bộ lọc bên trái/các thẻ bên phải, một cột trên mobile. `category.entry` chỉ là overlay minh họa, không phải popup đã hoạt động.
- **Tin tức/Khuyến mãi:** breadcrumb → `content-card-grid` 2 cột desktop/1 cột mobile; `ArticlePreview` và `PromotionPreview` đang dùng **thẻ chữ (tiêu đề/tóm tắt/liên kết), không có ảnh trong thẻ**. Ảnh CMS nếu có vẫn chỉ được kiểm trong media editor; không hiển thị sai như thể Website đã render. Ngày tin tức thật chỉ có sau khi xuất bản — không dựng ngày giả.
- **Popup marketing:** mô phỏng lớp phủ trên trang chủ/danh mục; `all.entry` dùng **trang chủ làm màn đại diện**, phạm vi thực tế là toàn Website. Delay, cooldown, số lần mỗi phiên chưa thể nghiệm thu khi chưa có C4 runtime.
- **Độ chính xác:** lấy đúng thứ tự phần, cấu trúc responsive và nhãn nguồn; khung bị thu nhỏ để xem trong modal Admin, nên **không phải ảnh chụp live, không bảo đảm pixel-perfect**. Ảnh CMS thật (file đang chọn hoặc R2 đã lưu) hiển thị **`object-fit:contain`** để không cắt nội dung. Nền sử dụng fallback gradient V2 vì Admin không có quyền nhúng ảnh decorative public thuộc Website; không giả mạo kết nối R2. Tất cả slot vẫn chỉ là preview quản trị; không được coi như đã live.
- **Kiểm thử C3:** kiểm từng slot của `public_web` trong `tests/admin-c3-cms-website-scene.test.mjs`; thử desktop/mobile, bản nháp mới và sửa, ảnh chưa có / đang chọn / đã lưu, văn bản dài, popup che trang, mobile scroll, keyboard, reduced motion và media không bị cắt; CI + Codex trước merge. Ảnh chụp và UAT trình duyệt thực sau đăng nhập **vẫn phải do Owner nghiệm thu khi deploy Admin**.
- **C4 cần quyết định rõ:** vị trí thực sự của hero banner khi Hero cố định đang tồn tại, có tạo section featured tin/khuyến mãi hay không, và chính xác component renderer CMS sẽ dùng. Không được tự thêm/sửa cấu trúc Website hay tuyên bố "khớp pixel" từ preview C3.
