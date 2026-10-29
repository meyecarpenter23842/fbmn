# WEB PR08e — Hyperdrive staging binding

Ngày 29/10/2026. Chỉ cấu hình API công khai staging; không thay đổi production.

## Cloudflare đã xác minh
- Hyperdrive riêng: `fbmn-public-staging-readonly`, ID `a49c268446874bda9c9f0c0ec2777e7e`.
- PostgreSQL Neon staging host **không pooler**: `ep-purple-dawn-b5waz5y6.c-7.us-east-2.aws.neon.tech` cổng 5432.
- Database `neondb`, user `fbmn_public_http_staging`, caching disabled.
- Cloudflare API PATCH host thành công; không đọc hoặc lưu mật khẩu trong git.
- Worker B2B `futurebook-mien-nam-api-staging` và Hyperdrive B2B `680f8ad608b845039dcb889240ace3d2` không thay đổi.

## Bảo mật và launch gate
- Role được kiểm tra: login true, no createdb/createrole/bypassrls; SELECT public view true; SELECT bảng gốc false.
- Người dùng đã đặt mật khẩu thành công nhưng đã chụp mật khẩu trong ảnh hội thoại; **phải xoay vòng mật khẩu** và cập nhật Hyperdrive trước khi Worker được công khai.
- CI bổ sung `wrangler deploy --dry-run` để đảm bảo Worker build được; workflow không tự deploy.
- Source vẫn đặt `workers_dev=false`; chưa mở public route, chưa làm end-to-end HTTP.
- Khi tiến hành staging: cần secret đã xoay vòng, deploy Worker riêng, verify qua truy cập thử hạn chế với DB role thật, test 200/400/403/404/405/429/503, thử chặn NET và bảng khách hàng.
- Không tự bật `FBMN_PUBLIC_API_ENABLED` trên Vercel production.

## Docs xác minh
- Cloudflare: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/neon/
- Neon FAQ: https://neon.com/blog/hyperdrive-neon-faq
