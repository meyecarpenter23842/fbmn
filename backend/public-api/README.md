# WEB PR08a — Hợp đồng Public API (Issue #10)

**Phạm vi PR này:** định nghĩa API versioned, handler HTTP thuần, field allowlist ở response, query validation, CORS allowlist, phân trang và unit/contract tests. Đây là **code chưa triển khai**. Không nối Worker, không đọc/ghi DB/R2, không thay các adapter website, không sửa order, không deploy.

## Inventory đã audit read-only ngày 2026-10-29
- GitHub `main` tại `15bf68d6abd6416d16cc439e09c6e55ec4416532` và CI xanh.
- Vercel `fbmn-web` production READY đúng commit trên.
- Cloudflare: Worker hiện hữu `futurebook-mien-nam-api-staging` có Hyperdrive/Neon Auth binding; bucket R2 `fbmn`.
- Neon `lively-paper-20200386`: default branch `production` chưa có bảng nghiệp vụ; branch `pr03-auth-migration-test` có 13 bảng `futurebook` và bảng `neon_auth`.
- **Nguy cơ**: RLS chưa bật trên 13 bảng `futurebook` trong branch thử nghiệm. Không cấp quyền public cho database owner hoặc schema này.
- `lib/catalog/adapter.ts`, `lib/content/adapter.ts` vẫn dùng dữ liệu xác minh rỗng tại chỗ.

## Contract
- `GET /v1/public/categories?slug=` — danh mục; slug không tồn tại trả 404.
- `GET /v1/public/products?slug=&categoryId=&page=&limit=` — sản phẩm; page 1–1000, limit 1–50, missing slug 404.
- `GET /v1/public/content` — nội dung đã duyệt.
- Mã phản hồi: 200, 400, 403 (Origin), 404, 405, 503. CORS chỉ allow origin HTTPS đã cấu hình; native client không cần Origin. Cache 60 giây cho public 200; lỗi no-store.
- HTTP handler chỉ nhận **approved public read model** từ dependency injection. Không biến source PostgreSQL thành public DTO tại lớp này. Handler tiếp tục áp dụng allowlist từng trường và bỏ mọi metadata ngoài hợp đồng. Không chạy được nếu chưa cung cấp data source.
- Tài liệu nguồn máy đọc: `backend/public-api/openapi.json`. Tests: `node --test tests/backend-public-api.test.mjs`.

## Chưa được phép coi Issue #10 là hoàn thành
1. Thiết kế **schema riêng + SQL views/role chỉ SELECT** dành cho public catalogue. Chặn bảng giá NET/dealer/contract, customers/orders ngay ở quyền Postgres. Có thể dùng schema tách biệt, RLS chỉ là lớp bổ sung.
2. Backup và kiểm thử migration/rollback trên **branch staging mới**, không dùng nhầm nhánh order/auth; phải review mới áp dụng production.
3. Adapter database đọc dữ liệu được duyệt, có nguồn, lịch xuất bản và image approval. Test DB privileges bằng vai trò thật và thử SELECT bảng private phải thất bại.
4. Cấu hình và test rate-limit server-side trước deployment; hiện HTTP handler **chưa có rate limiting**, không phù hợp để xuất bản Internet.
5. Cấu hình HTTPS host, CORS allowlist và smoke test real Workers staging 200/400/404/503; audit R2 ownership và cache revocation.
6. Chỉ sau khi các bước trên đạt, đổi Next.js adapters sang API origin cấu hình (server-side), không chuyển DB secrets ra browser.

**Release:** Không merge/deploy khi CI hay review chưa đạt; production hiện tại không thay đổi.
