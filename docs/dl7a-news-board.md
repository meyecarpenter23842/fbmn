# DL7A — Bảng tin Futurebook (Tin tức + Khuyến mãi)

**Phạm vi:** Website /bang-tin và màn Website Futurebook → Tin tức & Khuyến mãi trong Admin. Tận dụng CMS/Neon hiện có; không tạo table, bucket R2, API lưu bản sao hoặc chính sách giá mới.

- Website /bang-tin: cùng danh sách bài đã xuất bản với bộ lọc Tất cả/Tin tức/Khuyến mãi. Giữ permalink và SEO /tin-tuc, /tin-tuc/[slug], /khuyen-mai, /khuyen-mai/[slug]; bài gắn slot nổi bật vẫn nằm trong danh sách loại của mình.
- Ảnh đại diện/chi tiết: dùng media WebP đã xuất bản từ CMS qua cùng origin /api/cms-image, chỉ với UUID do Public CMS cho phép; không tạo URL/key R2 hay ảnh giả.
- Admin một danh sách bài theo **loại**, **trạng thái**, **tiêu đề/slug** lọc tại SQL của CMS; tạo Tin tức/Khuyến mãi riêng trong popup chung, sửa nháp, xem trạng thái, xuất bản/ẩn theo Owner, revision/audit và điều kiện nguồn đã được duyệt.
- Tin nháp/ẩn/hết hiệu lực không xuất hiện ở public vì security-barrier view Neon hiện tại, không lọc bằng JavaScript client để bảo mật. Bài khuyến mãi phải có ngày kết thúc, không tự sinh ưu đãi, giá NET hoặc hình ảnh.
- Đã có backend CMS, R2 và cấu hình Website trước DL7A: gói này không cần migration, không ghi nội dung giả hoặc sửa tài liệu Owner.
- **Nghiệm thu:** CI lint/typecheck/test/build; test API lọc server-side; sau deploy được duyệt kiểm Website desktop/mobile, Owner tạo nháp → lưu → có nguồn xác minh → xuất bản → xem Bảng tin → ẩn, bài hết hạn biến mất, không có ảnh khi chưa được upload.

**Phát hành:** PR repo phụ → CI/Codex sạch → squash merge → đồng bộ main repo chính fast-forward có cùng Git tree. **Chưa deploy production nếu Owner chưa ra lệnh riêng.** Báo commit + trạng thái UAT thực tế.
