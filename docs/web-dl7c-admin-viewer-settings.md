# DL7C-S — Thiết lập sách lật chỉ trong Admin (10/11/2026)

Owner yêu cầu cấu hình nằm tại Admin → Website Futurebook → Kho Catalogue → Cài đặt sách lật; không có các thanh chỉnh thông số trên giao diện khách xem.

- Tốc độ 750–1500 ms, bước 50 ms, mặc định 950.
- Tiếng lật giấy Admin bật/tắt chung, mặc định tắt. Trang khách không có nút âm thanh. Khi bật, chỉ phát sau tương tác người dùng đủ điều kiện cho trình duyệt mở AudioContext; chính sách autoplay có thể giữ im lặng.
- Độ bóng từ 0.10–0.50, mặc định 0.26.
- Một cấu hình áp dụng toàn bộ bộ sách, không cần deploy sau thay đổi. Revision + audit; chỉ Owner sửa.
- Public read model truy vấn view read-only trên Neon, không lộ actor/revision/audit. Website nhận qua JSON list endpoint.
- Nền G05 chung toàn Website giữ nguyên; không thay R2, SKU, giá NET, nội dung sách.
- Migration rehearsal trước production; release chỉ sau Owner cho phép. Không dùng down-migration để xóa dữ liệu settings thực tế.
