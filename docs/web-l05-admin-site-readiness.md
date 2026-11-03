# WEB Lô 05 — Audit kết nối Admin → Website (03/11/2026)

Theo Issue #19 và `docs/roadmap.md`; không tạo roadmap/issue hay Admin khác.

## Bằng chứng đọc trực tiếp (trước PR)

- GitHub `main`: `09c9fc58d16683823e0505211b2cbf858492e88d`.
- Neon nhánh mặc định tên `production` có **613 SKU**, **1** publication `public_web` published. Đây là nhãn nhánh DB, không phải xác nhận cho phép triển khai Website production. Không thay dữ liệu.
- Role `fbmn_p5_public_login` tồn tại, có SELECT các view P5, **không có SELECT** bảng `fbmn_catalog.skus` hoặc `fbmn_catalog_private.price_evidence`.
- Cloudflare public Worker vẫn cấu hình Hyperdrive `fbmn-public-staging-readonly` với login `fbmn_public_http_staging`. Repo và Worker dùng `PUBLIC_P5_ENABLED=false`. Chưa nối với role/Neon branch P5.
- Vercel Website production có hai biến `FBMN_PUBLIC_API_ENABLED` / `FBMN_PUBLIC_API_BASE_URL`; chỉ xác nhận biến tồn tại, không suy đoán giá trị.
- Website catalogue SSR `force-dynamic`, client API fetch `cache: no-store`. HTTP Worker trước PR vẫn `public,max-age=60` cho products/categories.

## Phạm vi PR đầu tiên

- Đổi cache headers catalogue `/v1/public/products` và `/v1/public/categories` sang `no-store`; không sửa cache CMS; ảnh P5 vốn `no-store`.
- Test hành trình DB-view mock: hidden → published (giữ SKU text/0 đầu) → sửa tên/quy cách/xóa ảnh → hidden, không build/deploy lại website. Payload chỉ chứa allowlist public, không chứa NET/XNT, private key.
- Không sửa UI Admin/Website, bảng giá, Neon migration hay mã công ty.

## Release gate tiếp theo (CHƯA THỰC HIỆN trong PR này)

1. Xác minh chính xác branch/endpoint Admin đang dùng với Neon chứa 613 SKU, rồi tạo Hyperdrive **riêng** cho Public Worker dùng role P5 read-only; không tái sử dụng credential Admin/owner.
2. Đọc trực tiếp `current_user`, thử SELECT các P5 views và xác nhận denied SELECT bảng SKU cơ sở/NET. Không đưa credential hoặc nội dung nội bộ vào Git/logs.
3. Khi kiểm chứng xong mới deploy **thủ công** Worker với role `fbmn_p5_public_login`, `PUBLIC_P5_ENABLED=true`, R2 binding phù hợp, limiter và CORS; kiểm 200/404 và fail-closed. Không sửa `wrangler` sang P5 khi chưa có Hyperdrive an toàn.
4. Xác nhận Vercel Website production thực sự trỏ Worker mới. Nếu cần thay URL, redeploy Website **một lần** rồi các chỉnh sửa SKU tiếp theo chỉ cần refresh; không redeploy mỗi thay đổi.
5. Với SKU thật đã được Owner bật `public_web` (không tự publish toàn bộ 613), xác minh bật → web thấy tên/quy cách/ảnh được phép → tắt → biến mất; 401/403 Admin và không lộ giá NET/XNT/PII. Owner UAT thủ công để sau.

**Rollback:** trở về Worker Hyperdrive/role/flag cũ, không rollback dữ liệu SKU của Owner. Báo cáo kết quả vào Issue #19.
