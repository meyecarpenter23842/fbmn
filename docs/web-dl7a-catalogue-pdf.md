# DL7A Catalogue PDF — bộ và phiên bản Futurebook Miền Nam

## Phạm vi và nguồn dữ liệu
- Tận dụng bảng website_catalogue_books (tên bộ, phiên bản, trạng thái) và bucket R2 riêng fbmn-catalogue; không xây kho CMS mới, không đổi SKU/giá và không thay hệ thống trang WebP/StPageFlip DL7B/DL7C.
- Mỗi bộ/phiên bản hiện có có thể có tối đa 1 PDF tại một thời điểm; dùng metadata website_catalogue_pdfs có revision/audit qua website_catalogue_audit. PDF nằm riêng theo prefix books/{bookId}/pdf/{assetId}.pdf.
- Admin Owner: tại Website Futurebook -> Kho Catalogue -> bộ/phiên bản -> tải PDF tối đa 20 MiB, công khai PDF (mặc định tắt), nút Tải PDF (mặc định tắt), xóa/thay PDF. Khi bộ đang READY, phải ẩn trước khi sửa; thay PDF buộc xét duyệt lại quyền. Chỉ bộ READY và có ít nhất một trang WebP hoặc PDF công khai được đưa ra Website.

## Kiến trúc, bảo mật
- Neon migration: backend/neon/migrations/20261110_dl7a_catalogue_pdf.up.sql (chưa chạy production). Private table chỉ cấp quyền Admin; public security-barrier view v_catalogue_ready_pdfs kiểm tra state READY/visible, chỉ đọc PDF của bộ được phát hành. Không đưa URL/key R2 hay giá NET vào DTO.
- Public Worker: GET /v1/public/catalogue-pdf?book={uuid} để xem inline; nếu có download=1, chỉ trả attachment khi download_enabled=true. Cả hai đường recheck quyền tại DB mỗi lần, xác nhận key, size, MIME application/pdf; no-store/nosniff, không cung cấp các PDF nháp/ẩn.
- Website: /catalogue hiển thị danh sách bộ và phiên bản với Lật sách / Xem PDF / Tải PDF tùy loại tài liệu; PDF-only không chạy engine StPageFlip. Xem PDF mở trình xem PDF sẵn có của trình duyệt, không chồng viewer mới lên sách lật.
- Browser upload: 20 MiB qua POST Admin Worker trực tiếp được cấp địa chỉ an toàn qua relay Admin /api/website/catalogue/pdf-target; JWT Owner và Origin allowlist, không mở bucket R2 public, không đặt key bí mật trong trình duyệt. Kiểm magic %PDF- và %%EOF, SHA256.
- Quan trọng: tắt nút Tải PDF không phải DRM. Người xem có thể lưu file đã xem. Không đưa bảng giá NET, XNT hoặc tài liệu riêng của đại lý vào kho công khai.

## Release gate, nghiệm thu
1. PR trên repo phụ -> CI tests, typecheck, lint, production builds -> Codex review sạch -> squash merge -> đồng bộ fast-forward main repo chính và so sánh Git tree.
2. Migration rehearsal ở Neon staging/nhánh thử, kiểm role/public view và rollback. Owner cho phép riêng mới chạy migration production. Không tự xóa bảng có PDF (down migration có guard).
3. Khi được phép: migration -> Admin Worker + Public Worker với đúng binding Hyperdrive/R2/rate limiter và PUBLIC_DL7A_PDF_ENABLED=false -> Website/Admin Vercel đúng SHA -> smoke. Chỉ bật flag PDF sau khi UAT.
4. UAT Owner: upload PDF thật <=20 MiB, permission 401/403, PDF-only, trạng thái draft/ready/hidden, quyền view/download, revoke 404, phiên bản, Chrome/Safari/mobile 360/390/768/1280/1440. Kiểm hiệu suất/SEO/không rò dữ liệu.

Chưa migration/deploy production chỉ từ lệnh phát triển DL7A.
