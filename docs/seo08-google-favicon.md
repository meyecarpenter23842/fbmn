# SEO08 — Google favicon & site name (15/11/2026)

Phạm vi duy nhất: Website Futurebook, không đụng Admin/CEO/Worker/Neon, SKU, NET, robots, sitemap hoặc domain/redirect.

- Canonical/SEO origin vẫn là `https://www.fbmn.vn`; cả hai đuôi tên miền vẫn chuyển về host này.
- Nguồn hình: `public/brand/fbmn-mark.svg` của Owner (màu tím `#623f9b`, đỏ `#c8222c`). Favicon rasterized giữ đúng nét vector và nền trắng, không dùng wordmark dài.
- Xuất `public/favicon-96.png` 96×96, `public/favicon.ico` chứa 16/32/48/96, `public/apple-touch-icon.png` 180×180. Tất cả là file thực HTTP 200, không redirect 307 từ `/favicon.ico` sang SVG.
- Metadata chung dẫn PNG/ICO; `WebSite` JSON-LD chỉ ở homepage, tên `Futurebook Miền Nam`, alternate `FBMN` và `fbmn.vn`; `Organization` hiện hữu không bị mất.
- Không thay robots/sitemap/next.config; giữ redirect www hiện hữu. Test `tests/fbmn-brand-favicon.test.mjs` kiểm tra header PNG, ICO chứa kích cỡ, metadata và canonical.
- Nghiệm thu production: `/favicon.ico`, `/favicon-96.png`, `/apple-touch-icon.png` HTTP 200 đúng Content-Type, Googlebot-Image đọc được, HTML có rel icon và JSON-LD đúng, 4 host chuyển về cùng website. Google có thể cập nhật biểu tượng/tên sau nhiều ngày; không cam kết tức thời.
- Tham chiếu: https://developers.google.com/search/docs/appearance/favicon-in-search ; https://developers.google.com/search/docs/appearance/site-names
