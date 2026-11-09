# Futurebook CMS — Hero và motion guideline (Owner 09/11/2026)

**Phạm vi:** Website Futurebook và CMS trong Admin duy nhất. Kế thừa
`docs/futurebook-ui-contract.md`, `docs/web-component-design-system.md`,
`docs/cms-placement-contract.md`. Không đổi menu, SKU, NET, phân quyền hoặc slot.

## Bố cục `home.hero`

- Giữ nguyên Hero text/CTA đã duyệt bên trái (**43%**); bên phải (**57%**) là vùng hình minh họa CMS, **không dựng một card trắng chứa tiêu đề/CTA lặp**.
- Ảnh CMS là phần thị giác, không tự thay heading, lợi ích, CTA của Hero cố định. Trong Admin, title/summary là metadata và alt; chỉ slot banner ngoài Hero mới render khối copy/CTA riêng.
- Với ảnh sản phẩm riêng lẻ/cụm sản phẩm, **WebP nền trong suốt** được ưu tiên. Sắp xếp bố cục của từng ảnh **bên trong file** thay vì xếp các lớp bằng CSS không có metadata. Cùng phối cảnh, cùng nguồn sáng; bóng mềm được làm ngay trong artwork.
- Ảnh poster có nền **cũng được chấp nhận** nếu nền được thiết kế khớp tông tím–kem của vùng Hero. Hero sử dụng `mix-blend-mode:multiply` để hạn chế mảng nền trắng trên tông sáng; đây là fallback trình bày, **không thể tự xóa nền bất kỳ ảnh nào**. Không dùng poster nền tối với vùng này.
- Dùng đúng hai asset R2 WebP `desktop` / `mobile` từ bản ghi CMS được duyệt. Không crop sản phẩm: `object-fit:contain`, `object-position:center`. Tránh nhét chữ/CTA vào file hình để khỏi trùng copy và vỡ bố cục.
- **Desktop (1440/1280):** vùng hình giữ mép an toàn khoảng 6–8% mỗi phía. Không giẫm lên hero copy, menu hoặc CTA. **Tablet 768:** chuyển sang trục dọc. **Mobile 390/360:** asset riêng, sản phẩm rõ nét và chiếm một vùng hình bên dưới copy; không ép tỷ lệ desktop vào mobile.
- Nếu chưa có CMS `home.hero` đã duyệt, giữ hình hero fallback hiện có và giao diện nguyên vẹn. Các slot `home.after_products` và `category.header` giữ mẫu banner riêng phù hợp vị trí.

## Motion

| Thành phần | Thời gian / quy tắc |
|---|---|
| Hero xuất hiện / đổi slide | `opacity` + `translateX(16px)`, **480ms**, easing `cubic-bezier(.22,1,.36,1)` |
| Tự chuyển slide | **7 giây/slide**, tối đa **5** banner đã duyệt trong vùng hero, không marquee/vòng lặp ngang liên tục |
| Nút chuyển ảnh | Nút Prev/Next có tên cho screen reader; kích thước **36px desktop / 44px mobile**, hover theo token UI **190ms** |
| Khi hover/focus | Dừng auto-advance để người dùng quan sát; khi tab ẩn cũng dừng |
| `prefers-reduced-motion: reduce` | Tắt auto-advance, bỏ transform/transition; vẫn cho chuyển bằng nút thủ công |
| Ảnh | Chỉ đổi `opacity/transform`, không animate `width/height`, không layout shift, không tự phát audio |

**Chưa triển khai motion nhiều lớp độc lập trong một Banner.** Schema hiện chỉ có một WebP/thiết bị, nên mỗi bản ghi là **một slide**. Muốn từng cuốn sổ bay vào theo lớp phải có schema riêng cho layer/position/z-index/timing, UI duyệt từng lớp và test accessibility; không giả vờ ảnh tĩnh có metadata đó.

## Checklist trước khi xuất bản

- **Chặn cứng từ backend (giữ fail-closed):** Title/slug hợp lệ; channel Website đơn lẻ; vị trí hợp lệ; nguồn/ghi chú duyệt Owner không rỗng; Desktop+Mobile WebP với banner/popup; khuyến mãi có ngày kết thúc; revision/permissions và audit. Admin hiển thị trước các thiếu sót và đưa về đúng bước để bổ sung.
- **Cảnh báo mềm:** thiếu mô tả ngắn; không có CTA. Không khóa xuất bản chỉ vì cảnh báo.
- `source_ref` **không bắt buộc là URL**: có thể ghi tên tài liệu nội bộ, mã chiến dịch hoặc ghi chú duyệt có thể đối chiếu thật. Không tự điền nguồn giả và không bỏ ràng buộc trên SQL public view.
- Ảnh chỉ được tính đủ khi đã upload thành công vào R2; lựa chọn file chưa lưu không phải bằng chứng đã hoàn tất publish.
- Nếu thiếu điều kiện, giao diện nói rõ lý do ở **danh sách và form**, nút Publish bị vô hiệu hóa trước khi gọi API. Backend tiếp tục kiểm tra lần cuối chống race và truy cập trái phép.

## Nghiệm thu

Kiểm tra thật tại 1440 / 1280 / 768 / 390 / 360 và Chrome/Safari; so sánh nền ảnh trong suốt & nền sáng; ảnh nhiều slide ở màn hình/kích thước khác nhau; keyboard Tab/Enter, mouse hover, `prefers-reduced-motion`; trường hợp CMS không có dữ liệu; tạo → upload 2 ảnh → thêm nguồn → xuất bản → kiểm tra Website → ẩn → xác minh ảnh/JSON bị thu hồi. **CI xanh không thay thế ảnh UAT trình duyệt.**

## C5 — một Banner, tối đa năm Slide (Owner 09/11/2026)

**Admin:** Website Futurebook → Banner & Popup → Sửa hoặc Thêm Banner → chọn `Trang chủ · Hero` → bước **Ảnh & xem trước**.

1. **Slide 1** dùng cặp ảnh Desktop/Mobile truyền thống: không xóa, không chuyển dữ liệu gốc hoặc thay đường dẫn R2 đang phát hành.
2. Nhấn **＋ Thêm Slide** để có Slide 2–5. Mỗi Slide có một WebP Desktop và một WebP Mobile. Có thể chọn JPG/PNG/WebP; trình duyệt chuyển sang WebP và tải lên R2 khi **Lưu bản nháp & ảnh**. Xem trước trên chính mô hình Website theo Desktop/Mobile.
3. **↑/↓** điều chỉnh thứ tự phát, nút **Xóa** xóa cả hai ảnh của Slide mới (cần xác nhận). Không thể xóa Slide 1.
4. **Thiết lập motion Hero:** Bật/tắt hiệu ứng, tự chuyển, Fade / Slide / Fade + Slide, 3–15 giây/Slide, chuyển động 300–800ms. Bấm **Lưu motion & thứ tự** sau khi bản nháp có ID.
5. Chỉ xuất bản khi Slide 1 có đủ ảnh Desktop/Mobile và **mọi Slide mới đã lưu** đều có đủ cặp. Trạng thái thiếu ảnh hiển thị trước, API vẫn xác thực Owner/revision và từ chối nếu thiếu.
6. Muốn thay Slide trong Banner đã xuất bản: **Ẩn → chỉnh ảnh/thứ tự → Lưu → Xuất bản lại**. Nội dung cũ không bị mất khi nâng cấp; nếu muốn không gián đoạn Website, dùng Banner mới rồi xuất bản trước khi ẩn Banner cũ.

**Giới hạn và bảo vệ:** Mỗi Slide là một cụm hình đã dàn trang, **không** phải animation từng sản phẩm/layer riêng. Ảnh R2 private và chỉ xuất qua image proxy với `id + device + slide` 1–5, kiểm lại published/approved/time bằng public SQL view mỗi lần. Banner chưa phát hành và slide thiếu cặp ảnh không hiển thị. Với nhiều Banner cùng Hero, carousel vẫn giới hạn tối đa năm slide đã duyệt mỗi lần render. `prefers-reduced-motion` luôn vô hiệu hóa tự phát và transition.

**Release:** migration C5 tạo bảng riêng `cms_banner_settings` và `cms_banner_slide_media`, không sửa hay xóa `cms_entry_media` hiện hành; Public Worker, Admin Worker, Website và Admin phải cập nhật đồng bộ. C5 không thay SKU, NET, bảng giá, quyền ngoài Owner hay dữ liệu CMS cũ.

## C5.1 — Chỉ báo Slide và chuẩn artwork ngang (09/11/2026)

- Bỏ bộ đếm `‹ 2/2 ›` nổi trong góc Hero. Khi có từ hai Slide, dùng **chấm điều hướng nhỏ** căn giữa mép dưới, mỗi chấm vẫn có vùng nhấn ≥36px desktop và ≥44px mobile, có `aria-label`, `aria-pressed`, bàn phím và focus rõ ràng. Không có nút/bộ đếm khi chỉ một Slide.
- **Desktop Hero:** ưu tiên artwork ngang **16:9** (ví dụ 1600×900, 1920×1080). Ảnh có tỷ lệ **nhỏ hơn 1.35:1** được cảnh báo mềm khi chọn và sau khi lưu trong Admin; không chặn vì có thể là bố cục đặc biệt cần chủ ý.
- **Mobile Hero:** dùng asset riêng, kiểm với màn 360–390px để không đè chữ. Không đảo nhầm ảnh dọc vào Desktop. Sản phẩm phải chiếm phần lớn **diện tích ảnh hữu ích**, không chỉ nằm giữa một khung ảnh có nền trong suốt quá rộng.
- `object-fit:contain` giữ nguyên để **không cắt/méo sản phẩm**. Do đó hai artwork có tỷ lệ khung khác nhau, hoặc có khoảng trống alpha khác nhau, sẽ có **kích thước sản phẩm nhìn thấy khác nhau** dù dung lượng/độ phân giải lớn hơn. Đây là lỗi chuẩn bị asset, không được giải quyết bằng `object-fit:cover` bừa bãi.
- Căn khung sản phẩm đồng nhất trong từng file WebP, bỏ khoảng trống transparent dư thừa, giữ cùng mức phóng đại và chân sản phẩm. Ảnh dọc đã xuất bản phải được Owner thay bằng artwork ngang đã duyệt; **không tự sửa hoặc thay ảnh production**.

