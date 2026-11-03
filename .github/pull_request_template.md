## Scope
Closes #

## Thay đổi
-

## Quy chuẩn UI bắt buộc (nếu PR có UI)

- [ ] Đã đọc `AGENTS.md` và `docs/futurebook-ui-contract.md`, cùng AGENTS của phạm vi làm việc.
- [ ] Nút desktop 36px, mobile 44px; field/select 40px; chữ điều khiển 13px; radius 8–10px; không trùng CSS riêng trang.
- [ ] Tabs dùng CSS chung, hoạt động độc lập với CSS Excel/screen khác; không làm mất tab/luồng đã duyệt.
- [ ] Header bảng dữ liệu tím lavender nhạt; CTA dùng tím Futurebook (trừ CTA marketing đỏ đã duyệt).
- [ ] Toast thao tác nhỏ góc trên phải; form tạo/sửa dùng popup/drawer, không nhét vào danh sách.
- [ ] Screenshot desktop 1280/1440 và mobile 390/360; test hover/focus/disabled/loading/error/empty.
- [ ] Không làm sai kết nối bảng giá ↔ SKU ↔ Excel hay biến chọn nhiều kênh thành một kênh.

## Kiểm thử
- [ ] lint
- [ ] typecheck
- [ ] test
- [ ] build
- [ ] Desktop screenshot (nếu UI)
- [ ] Mobile screenshot (nếu UI)
- [ ] Không chứa secrets / giá NET / dữ liệu khách hàng

## Deployment
- [ ] Không auto deploy khi merge
- [ ] Owner comment `/deploy preview` trên PR đang mở, CI xanh
- [ ] Owner comment `/deploy production` trên PR đã merge sau khi main CI xanh
