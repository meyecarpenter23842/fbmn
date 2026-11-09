# DL4 — Cấu hình Trang chủ Website Futurebook

Phạm vi theo docs/roadmap.md §0.2: chỉ Owner được lưu bố cục công khai. DL5 family|sku không thuộc PR này.

## Hành vi

- Admin Website Futurebook → Trang chủ & bố cục: chọn tối đa sáu danh mục đã xuất bản, giới hạn 1–6 danh mục, 1–12 thẻ sản phẩm, ghim SKU đã công khai và đổi thứ tự khu vực categories/products.
- Thẻ SKU ghim **ưu tiên family có SKU đó**; không chuyển website sang một-card-mỗi-SKU. Ảnh/SKU/giá công khai chỉ lấy từ catalogue đã xuất bản. Không ghim thì DL3 tự chọn một sản phẩm mỗi danh mục rồi điền theo tên.
- Preview desktop/mobile là bản thứ tự và nội dung SKU đã chọn, **không phải UAT ảnh/giao diện pixel thật**; hero CMS và các slot content vẫn giữ nguyên.
- POST có xác thực Owner + allowlist origin qua relay Admin; revision để chống cập nhật đè; transaction + audit before/after. Reset cũng ghi audit. Nếu migration/Worker chưa được phát hành, Admin báo lỗi rõ, không thông báo lưu thành công.
- Public Worker /v1/public/home-layout chỉ chiếu các trường cấu hình; PUBLIC_DL4_ENABLED mặc định tắt, không lộ Owner/audit/NET. Website SSR no-store, fallback về thứ tự DL3 khi Worker chưa triển khai hoặc lỗi; sản phẩm công khai vẫn phải qua catalogue publication.

## Thứ tự release — cần Owner phê duyệt từng môi trường

1. Repo phụ CI/Codex sạch, merge rồi đồng bộ GitHub repo chính, đối chiếu tree. Không dùng repo chính Actions khi hết quota.
2. Migration **Neon staging cùng nhánh catalogue**: `20261109_dl4_web_home_layout.up.sql`, có `.down.sql`; kiểm SELECT-only public role, Owner role và backup. **Chưa chạy tự động.**
3. Deploy Admin Worker staging và Public Worker staging qua công cụ kết nối; chỉ bật `PUBLIC_DL4_ENABLED=true` sau khi xác minh v_web_home_layout và role SELECT. Bật flag sớm sẽ trả 503, không tự fallback dữ liệu nhạy cảm.
4. Deploy Admin rồi Website Vercel theo lệnh Owner. Xác nhận version trên Admin, lưu / reset, reload Website thấy thay đổi mà không redeploy.
5. UAT thực tế Desktop/Mobile 1440/1280/768/390/360; unpublished SKU hide, role editor 403, revision conflict 409, dữ liệu NET không được hiện. Chụp màn hình thật trước khi đóng DL4.

DL4 không thay bảng giá, SKU công ty, data nguồn, media R2, CMS C4/C5, hay migration production.
