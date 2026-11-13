# SEO03 — Bản đồ từ khóa và nội dung Futurebook Miền Nam
Ngày 13/11/2026. Nguồn định hướng: nhóm sản phẩm trong `lib/catalog/schema.ts`, `lib/catalog/query.ts`, danh mục công khai và nhu cầu kinh doanh do Owner giao. **Đây là định hướng biên tập**, không phải số liệu Keyword Planner, Search Console về lượt tìm kiếm hoặc cam kết thứ hạng.

| Cụm tìm kiếm | Ý định | Landing page | Điều kiện triển khai |
|---|---|---|---|
| tập học sinh, vở học sinh, tập học sinh A5 | Chọn mẫu/quy cách | `/san-pham` và danh mục công khai nhóm `school_notebook` | Chỉ ghi khổ A5 nếu sản phẩm thật có A5 |
| tập sinh viên, vở sinh viên, tập A4 200 trang | So sánh quy cách | Danh mục nhóm `student_notebook` và sản phẩm thật | Số trang/khổ lấy từ SKU đã xuất bản |
| sổ ghi chép, sổ tay | Tìm mẫu | Danh mục nhóm `memo_book` và sản phẩm thật | Không khẳng định chất liệu/đóng gáy chưa xác nhận |
| văn phòng phẩm | Khám phá ngành hàng | `/san-pham` và nhóm `stationery` | Chỉ liệt kê sản phẩm có trong read model |
| giấy photocopy, giấy in A4 | Tìm loại giấy | **Backlog — chưa mở landing riêng** | Chỉ kích hoạt khi catalogue công khai xác minh đúng nhóm/mã hàng giấy photocopy; không tự gắn nhãn cho mọi VPP |
| nhà phân phối tập vở, đại lý tập học sinh | Hợp tác thương mại B2B | `/dai-ly` → `/lien-he` | Không công bố NET, chiết khấu, điều kiện hợp tác chưa được duyệt |
| đại lý văn phòng phẩm TP.HCM | Tìm nguồn hàng | `/dai-ly` | Nội dung khuyến khích gửi khu vực và nhu cầu, không khẳng định có sẵn đại lý ở mọi quận |
| nhà phân phối tập vở miền Tây | Hợp tác tại khu vực mục tiêu | `/dai-ly` | Không bịa tuyến giao hàng hoặc nhà máy |
| gia công tập vở theo yêu cầu, gia công sổ tay | Tư vấn gia công | `/gia-cong` | Khả năng đáp ứng, MOQ và giá phải xác nhận sau khảo sát |

## Quy tắc xuất bản
- **Tên/meta sản phẩm:** chỉ thêm tên nhóm, khổ, trang, gsm khi có đúng dữ liệu `PublicCatalog` đã xuất bản. Luôn giữ tên gốc và canonical của nhóm, không sinh URL SEO mới cho từng SKU biến thể.
- **Danh mục:** mô tả hiển thị gồm nhóm thật, số dòng sản phẩm đang công khai và quy cách đã được công bố. URL `?q`, `?trang` hoặc lọc vẫn `noindex` như SEO02.
- **Ảnh:** giữ ALT được duyệt khi mô tả cụ thể; với ALT mặc định chung, dùng tên sản phẩm và SKU đã duyệt. Không thêm màu/chất lượng giấy tự suy diễn, không đổi media R2.
- **Liên kết nội bộ:** trang sản phẩm ↔ danh mục, danh mục → trang sản phẩm, cả hai → `/dai-ly`, `/gia-cong`, `/lien-he`; anchor diễn giải đích, không liên kết đến bản nháp.
- **Admin:** Owner có thể tùy chỉnh Title/Description/OG/noindex theo URL thật, còn sản phẩm chưa có thiết lập vẫn dùng SEO tự động. Google không dùng `meta keywords` để xếp hạng; tránh spam từ khóa.
- **Đo lường sau triển khai:** Search Console theo URL/cụm truy vấn (impressions, clicks, CTR, position), PostHog theo lượt xem sản phẩm và liên hệ; **chưa có baseline để tự đặt KPI hoặc số search volume**.
- **Rà soát:** ưu tiên 10–20 URL thật được Google phát hiện, tránh tự tạo 617 nội dung mỏng giống nhau; kiểm tra Rich Results và ALT trên điện thoại. Không bật Google Ads khi chưa xác minh landing và đo chuyển đổi.
