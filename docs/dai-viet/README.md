# NHÀ SÁCH ĐẠI VIỆT — READ FIRST / PROJECT SOURCE OF TRUTH
Ngày khởi tạo: 03/11/2026. Trạng thái: ĐẶC TẢ VÀ KẾ HOẠCH, CHƯA TRIỂN KHAI WEBSITE.

## Quy tắc bất biến cho mọi chat / AI / Codex / developer
**TRƯỚC KHI THẢO LUẬN CÔNG VIỆC HOẶC SỬA CODE ĐẠI VIỆT PHẢI ĐỌC KẾ HOẠCH NÀY.**
1. Đọc AGENTS.md gốc và apps/dai-viet/AGENTS.md.
2. Đọc 00-master-plan.md để biết phạm vi, lô và tình trạng đã duyệt.
3. Đọc 01-design-system.md, 02-architecture-data.md và 03-delivery-workflow.md.
4. Đọc 04-page-specifications.md, 05-acceptance-security.md, 06-decisions-register.md.
5. Đọc 07-new-project-handoff.md nếu ở ChatGPT Project hoặc chat mới.
6. Kiểm tra main mới nhất, PR/Issue đang mở và các API/Admin thực tế; nêu đã có/chưa có/mâu thuẫn. Tuyệt đối không coi bản kế hoạch là tính năng đã code.

**Không được bắt đầu sửa code khi chưa nắm kế hoạch và chỉ rõ lô đang thực hiện.** Nếu người dùng yêu cầu khảo sát/ý tưởng, đọc trước rồi trả lời; không tự tạo PR hoặc deploy.

## Danh mục tài liệu chuẩn
- 00-master-plan.md: Mục tiêu, lộ trình, phụ thuộc, phạm vi và định nghĩa hoàn tất.
- 01-design-system.md: Nhận diện đỏ, thiết kế từng component, responsive, motion và ranh giới theme.
- 02-architecture-data.md: Một repo, một Admin, nhiều website, dữ liệu, tích hợp và bảo mật.
- 03-delivery-workflow.md: Quy trình Issue → branch → PR → CI → review → merge → deploy → UAT và bàn giao.
- 04-page-specifications.md: Chi tiết trang chủ, danh mục, sản phẩm, giỏ hàng, checkout, tài khoản và mobile.
- 05-acceptance-security.md: Ma trận kiểm thử UI/API/giá/permission/SEO và điều kiện phát hành.
- 06-decisions-register.md: Quyết định đã chốt và các điểm chưa được chủ dự án xác minh.
- 07-new-project-handoff.md: Nội dung copy vào Project “Nhà sách Đại Việt” và lệnh khởi động chat mới.

## Thứ tự ưu tiên khi xung đột
1. Quyết định mới được Owner chốt bằng chứng rõ và được cập nhật vào 06-decisions-register.md.
2. Điều kiện bảo mật, phân quyền, không lộ giá NET và release trong AGENTS.md gốc.
3. Contract hành vi/kích thước trong docs/futurebook-ui-contract.md — CHỈ phần không gắn màu nhận diện Futurebook.
4. Quy tắc Đại Việt trong 01-design-system.md về màu đỏ, bố cục và bản sắc.
5. Quy tắc hiện hữu riêng của website Futurebook app/** hoặc Admin apps/admin/** chỉ áp dụng đúng thư mục đó.
Không sửa contract Futurebook để ép website Đại Việt, không lấy CSS web Futurebook làm chuẩn thị giác Đại Việt.

## Phân định trạng thái
- CHỐT: chung repo fbmn; chung Admin hiện có; website Đại Việt độc lập; đỏ chủ đạo; phong cách hiện đại + sinh động.
- ĐỀ XUẤT CHƯA DUYỆT: mã hex đỏ, logo/asset, tên miền, phương thức thanh toán/giao hàng, bottom navigation, giá bán lẻ, kho chung/riêng.
- CHƯA TRIỂN KHAI: apps/dai-viet hiện là nơi đặt chỉ dẫn, không phải một website đã chạy.
