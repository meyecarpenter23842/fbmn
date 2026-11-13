# SEO04 — Hiệu năng Mobile & kỹ thuật Google Search (13/11/2026)

**Phạm vi:** Website Futurebook Miền Nam. Không thay Premium Purple Glass, SKU, dữ liệu khách, giá NET, ảnh R2, schema Neon, Worker hoặc phân quyền. Chỉ phát hành production khi Owner yêu cầu riêng.

## Audit nguồn và sửa lỗi
- Hero CMS (`components/cms-hero-carousel.tsx`): những slide ảnh full-size chồng absolute có thể vẫn được tải dù opacity 0. SEO04 chỉ render ảnh slide đầu ở SSR, giữ slot/animation, chuẩn bị slide liền kề sau khi trang hiển thị; chỉ chuyển khi ảnh đã tải và decode thành công, còn nếu ảnh lỗi thì giữ slide cũ và vô hiệu nút ảnh lỗi. Không bỏ autoplay, pause hoặc prefers-reduced-motion.
- Gallery/SKU (`CatalogProductImage`): thẻ đầu danh mục và ảnh gallery đang chọn được ưu tiên; ảnh dưới fold tiếp tục lazy. Thumbnail khai báo width/height nhằm giữ ổn định khung. Dùng `sizes` nhưng **không khẳng định đã resize hay giảm số byte** khi Next Image còn `unoptimized`.
- Sitemap: thay cách gom các category có variant bằng `catalogueListingCards(catalog,modes)` đồng nhất với listing thực theo DL5 Family/SKU; các category không có thẻ thực tế không vào sitemap. Không thêm URL cho filtered query, bảo lưu noindex trên danh sách lọc, canonical, Article/Organization/Breadcrumb.
- SEO03 metadata: tên nhóm kỹ thuật “Chưa phân loại” không được ghép vào Title/Description sản phẩm như Song Natural.
- Ảnh public hiện dùng `Cache-Control: no-store` để bảo vệ việc thu hồi ảnh; SEO04 **không** bật cache/optimizer CDN mới khiến ảnh hết quyền xuất bản vẫn còn khả dụng.

## Đo kiểm và bằng chứng
Đã thêm workflow **SEO04 Website mobile lab baseline (advisory)** tại `.github/workflows/seo04-mobile-audit.yml`. Dùng Playwright Chromium, 5 trang: /, /san-pham, Song Natural, /dai-ly và /gia-cong; đo mobile 390px và desktop 1440px. Chạy trong PR trên repo phụ và có `workflow_dispatch` để đo lại khi production cập nhật. Artifact 7 ngày: `artifacts/seo04/report.md`, `report.json` và ảnh mobile.

**Phân biệt metric:** Đây là lượt đo lab ngắn; LCP/CLS chỉ quan sát sau khoảng 2 giây, TTFB là navigation responseStart, không đo được INP p75 hoặc Core Web Vitals người dùng. Cần Search Console/CrUX có dữ liệu thực rồi mới tuyên bố ngưỡng tốt (tham chiếu LCP ≤2,5 giây; INP ≤200 ms; CLS ≤0,1 ở p75).

## Acceptance khi Owner cho phép phát hành
1. Website production và domain www.fbmn.vn đúng commit; 5 URL công khai HTTP 200, responsive 360/390/768/1440, không tràn ngang.
2. Trang chủ khi có nhiều CMS Hero: đúng ảnh được duyệt, lần tải đầu chỉ có slide đang nhìn; đổi slide/autoplay/focus/reduced motion giữ nguyên; không nhấp nháy/CLS bất thường.
3. Trang sản phẩm: SKU, gallery, zoom, CTA và ALT không sai; sơ đồ WebPage/Breadcrumb không đưa lại Product thiếu Offer; title Song Natural không có “Chưa phân loại”.
4. Sitemap xuất category có sản phẩm thực theo DL5; query tìm kiếm/lọc noindex. Không tự yêu cầu Google submit lại 617 URL.
5. Admin `admin.fbmn.vn`: Owner có thể lưu auto/custom/noindex; UI thực tế phải được test với phiên Owner (không thể giả lập đăng nhập trong CI).
6. Chạy lại Chrome lab, đặt cùng route/viewports/mạng trước/sau, ghi khác biệt thật; kiểm tra Vercel Runtime Errors. Chỉ coi hoàn tất nghiệm thu đo lường khi có dữ liệu thực.

**Tình trạng khi mở PR:** chưa có chứng cứ p75 hoặc kết quả PageSpeed mobile thật được xác thực; tuyệt đối không tự đưa điểm Lighthouse/%, không khẳng định đạt Core Web Vitals trước khi đo.
