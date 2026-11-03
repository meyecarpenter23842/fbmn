# Futurebook Miền Nam — bắt buộc đọc trước khi sửa repo

Đây là chỉ dẫn **áp dụng toàn repo**, cho mọi phiên AI/chat, Codex, developer và PR. Nội dung của một chat riêng lẻ **không** thay thế quy tắc này.

## Quy tắc UI bắt buộc

Trước khi tạo/sửa bất kỳ giao diện Futurebook nào, đọc:
1. [Quy chuẩn UI chung](docs/futurebook-ui-contract.md) — **nguồn sự thật duy nhất** cho nút, input, tab, bảng, toast, form và màu sắc.
2. Với Admin `apps/admin/**`: đọc thêm [hướng dẫn Admin](apps/admin/AGENTS.md) và [thiết kế Admin](docs/admin-ui-design-system.md).
3. Với Website `app/**`: đọc thêm [hướng dẫn Website](app/AGENTS.md) và [thiết kế Website](docs/web-component-design-system.md).

**Không được tự suy diễn kích thước nút, màu, padding, vị trí toast hay thiết kế lại điều hướng.** Các con số bắt buộc: nút desktop **36px**, input/select **40px**, nút mobile **44px**, chữ điều khiển **13px**, bo góc điều khiển **8–10px**, nhấn **tím Futurebook**, toast **nhỏ góc trên phải**, form tạo/sửa **drawer hoặc popup**, header các bảng dữ liệu **tím nhạt**. Một nguồn token duy nhất và component dùng chung; không sao chép CSS hoặc tạo override riêng lẻ.

Nếu yêu cầu nghiệp vụ thay đổi UX, làm trọn luồng liên quan, không sửa một trang khiến các trang khác mất kết nối hoặc mất tab. Không xóa/thêm tính năng hoặc đổi bố cục đã duyệt ngoài phạm vi được yêu cầu.

## Bảo toàn dữ liệu và phát hành

- Chỉ xử lý Futurebook Miền Nam. Không phát minh giá NET, bảng giá, SKU, mã, logo, quyền, chính sách, số liệu hoặc dữ liệu khách.
- Giá NET/giá riêng/đại lý không được công khai trên Website, App người tiêu dùng hoặc cho khách khác.
- Phải kiểm tra UI desktop/mobile và các trạng thái hover/focus/disabled/loading/empty/error; nghiệm thu bằng ảnh thật, không dùng mockup AI.
- Thực hiện **branch → PR → CI xanh → Codex review sạch → squash merge**; deploy **thủ công khi Owner yêu cầu**. Mọi thay đổi giao diện phải có kiểm tra quy chuẩn bằng CI.
- Không tạo issue/roadmap trùng; theo [Issue #104](https://github.com/alibaba240185/fbmn/issues/104) cho các lô Admin.

Nếu gặp CSS hoặc tính năng cũ lệch chuẩn, xác định phạm vi, sửa ở **hệ thống dùng chung** thay vì vá từng trang; mô tả ngoại lệ và kế hoạch chuyển đổi trong PR.
