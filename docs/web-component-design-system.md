# Futurebook Miền Nam — Website component design v1
Ngày: 03/11/2026. Áp dụng cho website công khai tại repo root, KHÔNG đồng nhất bố cục với Admin.

- Không thay bố cục, khối nội dung, sản phẩm, màu sắc brand đã duyệt (tím nền tảng, CTA đỏ tại vị trí hiện có), không thêm dock mobile.
- Card thường: nền trắng / lavender nhạt, viền 1px trung tính, radius 12–14px và shadow rất nhẹ. Không lift/scale card vô lý.
- Nút primary: tím Futurebook; CTA đỏ trong hero/banner là ngoại lệ đã duyệt. Nút phụ trắng có viền. Dùng hover/focus/disabled rõ, tránh icon không mô tả.
- Input/search: chiều cao ~40–44px, focus outline tím, text tối thiểu 13px desktop khi khả thi. Không làm placeholder giả như dữ liệu.
- Product card giữ ảnh/tên/thông tin có nguồn thật; không tạo giá hay SKU từ mockup. Label, nút và ảnh cùng khoảng cách, radius nhất quán.
- Trang web công khai không dùng toast Admin để báo lỗi API nội bộ. Chỉ bổ sung toast web khi có nghiệp vụ tương tác thật; phải dùng top-right, nhẹ, không đẩy layout và không lộ NET.
- Responsive: test 360 / 390 / 768 / 1280 / 1440, đặc biệt card sản phẩm/carousel; tránh overflow. Hỗ trợ `prefers-reduced-motion`.
- Triển khai bằng PR riêng, không đổi API, auth, Neon/R2, hay UI Admin; ảnh AI không được dùng làm bằng chứng nghiệm thu.
