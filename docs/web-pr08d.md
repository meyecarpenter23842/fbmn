# WEB PR08d — Worker staging riêng và audit role

- Neon: `lively-paper-20200386`, branch `br-broad-sun-b5or5p77` (**không phải production**).
- Role `fbmn_public_http_staging` được tạo trực tiếp qua SQL, chỉ có quyền đọc 8 view `fbmn_public.v_*`. Kiểm tra SQL qua `SET LOCAL ROLE`: SELECT view thành công (0 dòng), SELECT bảng gốc, INSERT view và CREATE TABLE đều bị PostgreSQL từ chối. Quyền SET ROLE cấp tạm đã thu hồi.
- Phát hiện mặc định Neon API cấp role `neon_superuser` khi dùng `create_postgres_role`; tài khoản tạo nhầm `fbmn_public_api_staging` đã được **xóa**, không kết nối Worker.
- Role chỉ đọc mới **chưa được gắn mật khẩu**; không có Hyperdrive mới. Bước truyền mật khẩu qua app bị bộ kiểm tra an toàn chặn. Không đưa password, token vào GitHub.
- Worker mới `futurebook-mien-nam-public-api-staging` đã có source, nhưng **chưa deploy/không có public URL**. `workers_dev=false`, Hyperdrive ID vẫn là placeholder và bắt buộc đổi khi vận hành.
- Sử dụng SQL allowlist, verify current_user, chỉ đọc view; 429 từ rate limit binding bắt buộc, các lỗi thiếu binding hoặc DB sai quyền trả 503 chung, không trả secrets.
- Cloudflare rate limit chỉ áp dụng gần đúng theo POP, **không** phải giới hạn toàn cầu nghiêm ngặt.

## Các cổng cần xong trước khi mở Internet

1. Cấp mật khẩu bí mật cho role SQL trên Neon Console; kiểm tra role không có `neon_superuser`.
2. Tạo **Hyperdrive mới** bằng role SQL này, không tái sử dụng Hyperdrive B2B `680f8ad608b845039dcb889240ace3d2`.
3. Gắn Hyperdrive ID thật, deploy riêng qua `npm install` và `wrangler deploy` trong thư mục `backend/public-api`, bật binding rate limit bắt buộc, không public trước khi test.
4. Kiểm thử HTTP thật 200/400/403/404/405/429/503; thử đọc bảng khách hàng, giá NET, ghi bảng phải bị từ chối, kiểm tra log không lộ bí mật.
5. Mới kích hoạt website remote API theo biến môi trường (chưa làm trong PR này).

**PR08d hiện chỉ là foundation và kiểm thử SQL role + HTTP unit tests, KHÔNG phải Worker→Neon E2E.** Cloudflare B2B Worker, Neon production, Vercel production và order vẫn nguyên trạng.
