# DL7B — Kho R2 và Admin Catalogue Futurebook

**Phạm vi:** Chỉ tab Catalogue. Không sửa menu 6 mục, sản phẩm/SKU, CMS Hero, nền chung Website hoặc giá NET. Roadmap duy nhất: docs/roadmap.md §0.2, sau DL4; DL7C lật sách triển khai sau.

## Hạ tầng đã kiểm chứng 09/11/2026

- Tài khoản Cloudflare đang có các Worker Futurebook staging; bucket sản phẩm/CMS là \`fbmn\`.
- Đã tạo **bucket riêng \`fbmn-catalogue\`**, APAC Standard; R2.dev managed domain vẫn **disabled**. Không mở public access.
- Sơ đồ object key cố định trong bucket mới:
  - \`books/{book_uuid}/pages/{asset_uuid}.webp\`
  - \`books/{book_uuid}/covers/{asset_uuid}.webp\`
  - \`backgrounds/desktop/{book_uuid}/{asset_uuid}.webp\`
  - \`backgrounds/mobile/{book_uuid}/{asset_uuid}.webp\`
- Trong R2, "folder" là **prefix ảo**: xuất hiện khi Admin tải ảnh đầu tiên. Không tạo ảnh rỗng hoặc ảnh minh họa thay dữ liệu thật.

## Kiến trúc triển khai trong code

1. Admin hiện hữu thêm **Website Futurebook → Kho Catalogue**, Owner-only. Quản lý nhiều bộ/phiên bản, trang, cover, nền Desktop/Mobile, thứ tự trang, đánh dấu sẵn sàng/ẩn bộ.
2. Browser lấy JWT ngắn hạn qua \`/api/auth/token\`; proxy \`/api/website/catalogue\` same-origin kiểm tra Origin, Bearer, MIME và giới hạn ảnh. JWT/R2 key không lộ trong URL và không lưu storage.
3. Admin Worker staging thêm route \`/v1/admin/website/catalogue/*\` có RBAC Owner-only; R2 binding **mới**, khác \`ADMIN_MEDIA_R2\`: \`CATALOGUE_MEDIA_R2\` → \`fbmn-catalogue\`.
4. Neon private metadata/mapping/revision/audit tại \`fbmn_catalog_private.website_catalogue_*\`, **chưa có public view**. Ready = nội bộ, không phải Website đã xuất bản. Mọi upload và thay đổi thứ tự có revision 409 khi xung đột.
5. Chỉ nhận WebP tối đa 5 MiB/ảnh; kiểm chữ ký cấu trúc, kích thước 64–6000px, hash. Ảnh xem qua Owner relay no-store; không dùng URL public R2. PDF viewer và xuất bản Web là **DL7A/DL7C**, không giả lập ở DL7B.

## Release gate — KHÔNG tự ý thực hiện

- Chạy PR trên repo phụ → CI + Codex review sạch → squash merge → đồng bộ qua local/repo chính theo quy trình.
- Migration: \`backend/neon/migrations/20261109_dl7b_catalogue_books.up.sql\` cần **DL4 migration trước**, rehearsal riêng rồi Owner cho phép mới chạy staging/production. Down có thể làm mất metadata; tuyệt đối không rollback tự động.
- Worker: triển khai binding \`CATALOGUE_MEDIA_R2\` lên Admin Worker staging sau khi migration tồn tại, rồi Admin Vercel. Không deploy Worker/Admin/Website production khi chưa được Owner cho phép.
- Khi Worker/migration chưa được kích hoạt, Admin phải hiện lỗi kho chưa sẵn sàng, không hiển thị giả như danh sách rỗng.
- Nghiệm thu: Owner login, 401 anonymous / 403 non-Owner, bộ trống / 200 trang, WebP sai MIME/bytes, upload cover/background thay thế, chỉnh order, trạng thái ready/hidden, rollback, Safari/Chrome và mobile 360/390/768/1280/1440; bảo toàn bucket \`fbmn\`.
