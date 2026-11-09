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

## C4 — CMS → Website: read-model đã code, PHÁT HÀNH CÓ CỔNG CHẶN

**Phạm vi code:** `backend/neon/migrations/20261108_c4_cms_public_views.up.sql` tạo hai view chỉ đọc `fbmn_public.v_cms_web_entries` và `v_cms_web_images` (chỉ các bản ghi `public_web` status published, source, verified/approved/published, khoảng thời gian hiệu lực, không withdrawn). Public Worker có `GET /v1/public/cms` và `GET /v1/public/cms/image?id=<uuid>&device=desktop|mobile`, DTO field allowlist, ảnh WebP lấy bằng R2 binding hiện có, không chấp nhận object key trực tiếp; response **no-store**. Public Worker không đọc bảng NET, khách hàng hoặc API admin. Admin Worker có `GET /v1/admin/cms/capability` chỉ Owner (401/403), nút Xuất bản ở CMS mở khi server trả `ready:true`, có kiểm soát kênh và revision/audit.

**Vị trí Website đã gắn:** `home.hero` (trong vùng hình Hero hiện có, không thay nội dung cố định), `home.after_products` (sau Sản phẩm nổi bật), `category.header` (trước filter ở `/danh-muc/[slug]`); `home.news_featured`/`home.promotion_featured` (thêm section *chỉ khi có nội dung xuất bản* trước khối Vở A4/B5); `news.list` và `promotions.list` theo các trang/danh sách tương ứng. Popup `home.entry`, `category.entry`, `all.entry` theo đường dẫn, có delay (0–120 giây), giới hạn trong session và cooldown khi đóng (lưu ID/timestamp, không PII). Ảnh desktop/mobile riêng và `object-fit:contain`; trang không có bản ghi hợp lệ giữ nguyên giao diện cũ, không tự tạo quảng cáo/chương trình/giá.

**Mặc định FAIL-CLOSED:** `PUBLIC_CMS_ENABLED="false"` trong `backend/public-api/wrangler.jsonc`, `ADMIN_CMS_PUBLIC_READY="false"` trong `backend/admin-api/wrangler.jsonc`, Website `FBMN_CMS_PUBLIC_ENABLED` chưa bật. C4 merge code **không đồng nghĩa đã triển khai hay nghiệm thu**. Không sửa cấu hình production tự động, không chạy migration tự động.

### Kịch bản release cần Owner phê duyệt riêng

1. Kiểm tra backup, DB role, migration ADM-03/03b đang áp dụng, kết nối Hyperdrive staging Admin/Public đúng cùng môi trường. **Nếu hai Worker trỏ hai Neon branch khác nhau, dừng**. Apply migration C4 *staging* theo review và xác minh view/role thật: chỉ SELECT views được phép; SELECT `fbmn_catalog_private.cms_entries`, giá NET và bảng khách từ public login phải bị chặn; kiểm `draft/hidden/expired/future/withdrawn` không có trong view. Không migration production nếu chưa có lệnh Owner.
2. Deploy Public Worker có code C4 với `PUBLIC_CMS_ENABLED=false`, smoke 503 đối với CMS read. Khi view/role/R2 và test staging xong, **Owner duyệt bật** `PUBLIC_CMS_ENABLED=true` rồi deploy Public Worker; test JSON schema, không lộ source_ref, giá, actor, media key; tải ảnh được cho published, trả 404 sau khi ẩn và 400 cho input sai; 429 cho rate-limit.
3. Deploy Website code C4 với `FBMN_CMS_PUBLIC_ENABLED` chưa bật, quan sát baseline; sau khi public Worker pass, Owner bật `FBMN_CMS_PUBLIC_ENABLED=true` và deploy Website; kiểm từng trang, responsive, SSR no-store, source/SEO, popup delay/max/cooldown. Không bật khi public Worker/CMS view chưa sẵn sàng.
4. Deploy Admin Worker với `ADMIN_CMS_PUBLIC_READY=false`, smoke Owner/Editor 200/403. **Chỉ sau khi Website thực sự tiêu thụ CMS và pass UAT** mới Owner chấp thuận chuyển `ADMIN_CMS_PUBLIC_READY=true` và deploy Worker; nút Publish mở. Kiểm create → upload 2 ảnh → nhập nguồn/lịch/vị trí → Publish → Website thấy đúng → Hide → Website biến mất ngay khi tải lại (bao gồm ảnh 404) → sửa → Publish lại; test conflict revision, App record, malicious URLs, popup/cooldown, 429, R2 lỗi và rollback.
5. Nếu cần rollback: tắt `ADMIN_CMS_PUBLIC_READY` trước để khóa publish, tắt `FBMN_CMS_PUBLIC_ENABLED` rồi `PUBLIC_CMS_ENABLED`; rollback view SQL chỉ sau khi Owner xác nhận `fbmn.rollback_confirmed=yes`. **Không xóa data hay ảnh R2**.

**Giới hạn đã biết:** C3 là scene thu nhỏ từ mã nguồn, không phải pixel-perfect. Vì không có quyền kiểm tra trình duyệt Owner và Neon staging thực từ PR, chỉ có CI/test code. Thông số chương trình khuyến mãi yêu cầu ngày kết thúc khi publish; bài nổi bật có trang chi tiết riêng nhưng không lọt vào tab danh sách nếu chỉ target Home. Cookie/session popup chỉ giữ số lần và dấu thời gian trên trình duyệt; không thu dữ liệu cá nhân. Các bản ghi legacy dùng chung Web/App vẫn không được phát hành từ Website cho đến khi có quy trình phân tách được duyệt.

## C5 mở rộng Banner đa Slide

Xem [Motion guideline C5](cms-hero-motion-guideline.md). Một Banner tại `home.hero` có tối đa 5 Slide, Desktop/Mobile riêng, cấu hình hiệu ứng và thứ tự. Slide 1 dùng ảnh legacy; chỉ C5 view mới cung cấp ảnh Slide 2–5 đã được duyệt. Giữ nguyên toàn bộ điều kiện xuất bản C4; thiếu cặp ảnh mới là điều kiện chặn.
