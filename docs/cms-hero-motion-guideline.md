# Futurebook CMS — Hero và motion guideline (Owner 09/11/2026)

**Phạm vi:** Website Futurebook và CMS trong Admin duy nhất. Kế thừa
\`docs/futurebook-ui-contract.md\`, \`docs/web-component-design-system.md\`,
\`docs/cms-placement-contract.md\`. Không đổi menu, SKU, NET, phân quyền hoặc slot.

## Bố cục \`home.hero\`

- Giữ nguyên Hero text/CTA đã duyệt bên trái (**43%**); bên phải (**57%**) là vùng hình minh họa CMS, **không dựng một card trắng chứa tiêu đề/CTA lặp**.
- Ảnh CMS là phần thị giác, không tự thay heading, lợi ích, CTA của Hero cố định. Trong Admin, title/summary là metadata và alt; chỉ slot banner ngoài Hero mới render khối copy/CTA riêng.
- Với ảnh sản phẩm riêng lẻ/cụm sản phẩm, **WebP nền trong suốt** được ưu tiên. Sắp xếp bố cục của từng ảnh **bên trong file** thay vì xếp các lớp bằng CSS không có metadata. Cùng phối cảnh, cùng nguồn sáng; bóng mềm được làm ngay trong artwork.
- Ảnh poster có nền **cũng được chấp nhận** nếu nền được thiết kế khớp tông tím–kem của vùng Hero. Hero sử dụng \`mix-blend-mode:multiply\` để hạn chế mảng nền trắng trên tông sáng; đây là fallback trình bày, **không thể tự xóa nền bất kỳ ảnh nào**. Không dùng poster nền tối với vùng này.
- Dùng đúng hai asset R2 WebP \`desktop\` / \`mobile\` từ bản ghi CMS được duyệt. Không crop sản phẩm: \`object-fit:contain\`, \`object-position:center\`. Tránh nhét chữ/CTA vào file hình để khỏi trùng copy và vỡ bố cục.
- **Desktop (1440/1280):** vùng hình giữ mép an toàn khoảng 6–8% mỗi phía. Không giẫm lên hero copy, menu hoặc CTA. **Tablet 768:** chuyển sang trục dọc. **Mobile 390/360:** asset riêng, sản phẩm rõ nét và chiếm một vùng hình bên dưới copy; không ép tỷ lệ desktop vào mobile.
- Nếu chưa có CMS \`home.hero\` đã duyệt, giữ hình hero fallback hiện có và giao diện nguyên vẹn. Các slot \`home.after_products\` và \`category.header\` giữ mẫu banner riêng phù hợp vị trí.

## Motion

| Thành phần | Thời gian / quy tắc |
|---|---|
| Hero xuất hiện / đổi slide | \`opacity\` + \`translateX(16px)\`, **480ms**, easing \`cubic-bezier(.22,1,.36,1)\` |
| Tự chuyển slide | **7 giây/slide**, tối đa **5** banner đã duyệt trong vùng hero, không marquee/vòng lặp ngang liên tục |
| Nút chuyển ảnh | Nút Prev/Next có tên cho screen reader; kích thước **36px desktop / 44px mobile**, hover theo token UI **190ms** |
| Khi hover/focus | Dừng auto-advance để người dùng quan sát; khi tab ẩn cũng dừng |
| \`prefers-reduced-motion: reduce\` | Tắt auto-advance, bỏ transform/transition; vẫn cho chuyển bằng nút thủ công |
| Ảnh | Chỉ đổi \`opacity/transform\`, không animate \`width/height\`, không layout shift, không tự phát audio |

**Chưa triển khai motion nhiều lớp độc lập trong một Banner.** Schema hiện chỉ có một WebP/thiết bị, nên mỗi bản ghi là **một slide**. Muốn từng cuốn sổ bay vào theo lớp phải có schema riêng cho layer/position/z-index/timing, UI duyệt từng lớp và test accessibility; không giả vờ ảnh tĩnh có metadata đó.

## Checklist trước khi xuất bản

- **Chặn cứng từ backend (giữ fail-closed):** Title/slug hợp lệ; channel Website đơn lẻ; vị trí hợp lệ; nguồn/ghi chú duyệt Owner không rỗng; Desktop+Mobile WebP với banner/popup; khuyến mãi có ngày kết thúc; revision/permissions và audit. Admin hiển thị trước các thiếu sót và đưa về đúng bước để bổ sung.
- **Cảnh báo mềm:** thiếu mô tả ngắn; không có CTA. Không khóa xuất bản chỉ vì cảnh báo.
- \`source_ref\` **không bắt buộc là URL**: có thể ghi tên tài liệu nội bộ, mã chiến dịch hoặc ghi chú duyệt có thể đối chiếu thật. Không tự điền nguồn giả và không bỏ ràng buộc trên SQL public view.
- Ảnh chỉ được tính đủ khi đã upload thành công vào R2; lựa chọn file chưa lưu không phải bằng chứng đã hoàn tất publish.
- Nếu thiếu điều kiện, giao diện nói rõ lý do ở **danh sách và form**, nút Publish bị vô hiệu hóa trước khi gọi API. Backend tiếp tục kiểm tra lần cuối chống race và truy cập trái phép.

## Nghiệm thu

Kiểm tra thật tại 1440 / 1280 / 768 / 390 / 360 và Chrome/Safari; so sánh nền ảnh trong suốt & nền sáng; ảnh nhiều slide ở màn hình/kích thước khác nhau; keyboard Tab/Enter, mouse hover, \`prefers-reduced-motion\`; trường hợp CMS không có dữ liệu; tạo → upload 2 ảnh → thêm nguồn → xuất bản → kiểm tra Website → ẩn → xác minh ảnh/JSON bị thu hồi. **CI xanh không thay thế ảnh UAT trình duyệt.**
