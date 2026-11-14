# DL8 — Regression & nghiệm thu hệ thống Futurebook Miền Nam

**Audit read-only ngày 14/11/2026** · Phạm vi theo docs/roadmap.md DL8: đại lý, CMS Hero, Catalogue, liên hệ/gia công, SEO, ảnh/performance, a11y, Chrome/Safari mobile, Owner workflows và rollback. **Audit code/production bước đầu đã thực hiện; CHƯA nghiệm thu hoàn chỉnh bằng thiết bị thật và Owner credentials.**

## 1. Hiện trạng đã xác minh

- Hai repo: phát triển meyecarpenter23842/fbmn main 990a21e0add14c30655c4933621c8c259ada8d5f; chính alibaba240185/fbmn main 2905d482faea1b6d30541122c4593dfbdd05c317; cùng Git tree 76774c884aff1a91c2654ce23e3aaa26809039aa tại thời điểm audit.
- Vercel Website fbmn-web READY dpl_7BVt7uwkFkZDNWhCHwqCpajr56Tt, source b091148; Admin fbmn-admin READY dpl_CK7PXPNwuKnGrqkcFKoxZ7HJosud, source 515d508; CEO fbmn-ceo READY dpl_GE3MTEGjkz5zLaRyxdqFvo91GEgp, source 990a21e0.
- Website production: HTTP 200 với /, /san-pham, /catalogue, /bang-tin, /dai-ly, /gia-cong, /lien-he, /gioi-thieu, /policy, /tin-tuc, /khuyen-mai, /sitemap.xml, /robots.txt; các trang chính có H1, title, canonical. Đây chỉ là HTTP-level, không phải browser UAT.
- Sitemap có **617 URL** gồm **606 trang chi tiết sản phẩm** và route tĩnh/tin tức; không thấy URL Admin/CEO. 10 URL sản phẩm/bài viết lấy mẫu trong sitemap trả 200 và canonical khớp. URL có lọc sản phẩm xuất noindex,follow; Policy index; CEO và Admin noindex.
- Vercel runtime error clusters 24h: Website 0, Admin 0; CEO có cảnh báo pg-connection-string SSL compatibility lặp lại và url.parse() deprecated trên deployment cũ. Warning không đồng nghĩa outage; cần kiểm dependency riêng.
- Cloudflare read-only: ba Worker scripts (futurebook-mien-nam-admin-api-staging, futurebook-mien-nam-api-staging, futurebook-mien-nam-public-api-staging); ba bucket R2 (fbmn, fbmn-catalogue, fbmn-chatbot-credentials). Không thay binding/bucket.
- Neon production read-only: fbmn_public.v_p5_visible_skus = **613**; fbmn_catalog.skus = **613**; fbmn_catalog.categories = **2**; fbmn_public.v_categories = **0**; fbmn_public.v_catalogue_ready_books = **1**. Bảng private có 2 liên hệ, 1 gia công, 1 grant GSC OAuth; chỉ đếm bản ghi, không đọc dữ liệu khách/token.

## 2. Finding và xử lý

| ID | Mức | Bằng chứng / tác động | Biện pháp |
|---|---|---|---|
| DL8-SEO-01 | P1 | Home thực liên kết /danh-muc/chua-phan-loai; trang đó HTTP 200, index,follow, dù danh mục placeholder bị loại khỏi sitemap. Public category view = 0. | Bỏ tile placeholder khỏi điều hướng, vẫn hiển thị các sản phẩm public thật. Không tự tạo nhóm/SKU, Owner phân nhóm qua Admin. |
| DL8-SEO-02 | P2 | /san-pham/khong-ton-tai trả 200 noindex (soft 404). | Gọi notFound() ngay từ generateMetadata sản phẩm và danh mục không tồn tại; xác nhận HTTP 404 sau release. |
| DL8-SEO-03 | P2 | /danh-muc/chua-phan-loai index được. | Ép noindex,follow dù SEO setting cũ; giữ deep link trực tiếp để không phá liên kết hiện tại. |
| DL8-OPS-01 | P2 | CEO ghi warning SSL PostgreSQL; url.parse() deprecated trong deployment cũ. | Cần kiểm riêng thư viện kết nối, không thay chuỗi DB/migration trong PR Website. |
| DL8-SEO-DATA | UAT | Một số title do nguồn sản phẩm public cung cấp có lỗi chính tả, ví dụ “SIẾU CẤP”. | Owner rà soát dữ liệu Admin; không tự sửa nguồn SKU/tên. |
| DL8-DEVICE | UAT | Chưa có xác nhận Safari/iPhone thật, PWA notifications và thao tác flipbook bằng touch. | Chromium/WebKit lab + Owner nghiệm thu thiết bị thật. |

## 3. Ma trận luồng

| Luồng | Kiểm tra đã có | Cần nghiệm thu thật |
|---|---|---|
| Đại lý → sản phẩm → SKU | Tests DL1/3/5/G07; route /dai-ly, /san-pham, mẫu SKU trả 200 | Filter, SKU 0 đầu, ảnh, CTA và viewport mobile |
| CMS Hero | SEO04 reducer, lazy media, reduced motion, Home HTTP 200 có Hero | Slide desktop/mobile, lịch xuất bản, ảnh/switch/keyboard |
| Catalogue | Tests DL7A/B/C; R2, một sách public trong Neon, /catalogue HTTP 200 | Lật trang, audio opt-in, zoom/PDF, Safari/touch |
| Liên hệ/gia công | 34 tỉnh, honeypot, consent, proxy same-origin, lưu thành công mới HTTP 201 | Gửi thật, xem inbox Admin/CEO và badge; audit không POST |
| CEO Chat/Email/Push | Owner gate + Node/Flutter contract tests; CEO READY | Đăng nhập Owner, inbox, read receipts, Push thiết bị |
| SEO | SEO01–07, 617 sitemap URLs, chính sách canonical/noindex | GSC property/indexing và Core Web Vitals thực tế |
| A11y/performance | UI Contract, SEO04 static, chưa có thiết bị thật | Chromium/WebKit, axe, screenshots, VoiceOver/TalkBack |
| Rollback | Vercel có deployment READY trước đó | KHÔNG rollback production nếu Owner chưa cho phép |

## 4. Audit tự động được thêm

- scripts/dl8-browser-audit.mjs: Chromium + WebKit tại 360, 390, 768, 1280, 1440 px; audit title/H1/canonical, overflow, ảnh, page errors, WCAG2/2.1 A/AA bằng axe-core, LCP/CLS/TTFB lab.
- Mọi HTTP POST/PUT/PATCH/DELETE đều bị chặn. Không tạo lead, chat, mail, DB receipt hay marketing event. Chỉ screenshot public, artifact giữ 7 ngày. Không chứa dữ liệu cá nhân/token.
- Workflow .github/workflows/dl8-browser-audit.yml chạy trên PR DL8 hoặc workflow_dispatch với quyền read-only, không secrets/deploy; lưu JSON/Markdown/screenshots cho Owner. Kết quả đo production **cũ**, không phải chứng nhận cho commit chưa deploy.
- tests/dl8-regression.test.mjs kiểm placeholder, notFound metadata, bảo vệ form contact/gia công, SEO và quy tắc audit read-only.

## 5. Release gate còn lại

1. CI root 4 job + Chromium/WebKit audit + Codex review sạch; sửa mọi finding code. Squash merge repo phụ rồi đối chiếu Git tree, fast-forward repo chính không force.
2. Không deploy Website/Admin/CEO/Worker hoặc chạy Neon migration nếu Owner chưa duyệt cụ thể.
3. Sau Website deploy: xác minh Home không tile placeholder, sản phẩm public còn đủ, placeholder noindex, unknown product/category HTTP 404.
4. Owner thử liên hệ/gia công có kiểm lưu và badge, flipbook PDF, login CEO, Web Push trên Safari/iPhone/Chrome Android; không báo đã UAT khi chưa có bằng chứng.
5. Trước rollback, xác nhận deployment READY/DB compatibility, không rollback thử production.
