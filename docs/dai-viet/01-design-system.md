# 01 — DESIGN SYSTEM ĐẠI VIỆT / RED COMMERCE
Trạng thái: đặc tả để triển khai; mã màu đang tạm đề xuất, chưa xác nhận từ logo thật.

## 1. Phân lớp thiết kế, chống nhiễm giữa 2 thương hiệu
Lớp CORE: geometry, spacing, hành vi button/field/tab/modal/drawer/toast, motion, keyboard/accessibility; kế thừa chuẩn không phụ thuộc thương hiệu từ docs/futurebook-ui-contract.md.
Lớp FUTUREBOOK: riêng app/**, apps/admin/** giữ tím #6D249E và bố cục, quy tắc UI hiện hành; không đụng khi làm Đại Việt.
Lớp ĐẠI VIỆT: riêng apps/dai-viet/**, nền sáng + đỏ thương hiệu, nội dung thương mại; tuyệt đối không import CSS Futurebook hoặc Admin, không gọi CSS root web sang.
Nếu contract Futurebook ghi màu tím/header bảng lavender, đó là brand-specific và KHÔNG áp vào Đại Việt. Ngược lại, kích thước và hành vi dùng chung là bắt buộc. Khi tạo shared primitives phải thiết kế brand-neutral với semantic tokens theme-scoped.

## 2. Visual direction
- Modern + Playful: đường nét gọn, cấu trúc dễ mua, sản phẩm sinh động; không tạo hiệu ứng neon, gradient bừa bãi, carousel tự chạy gây phân tâm.
- Đỏ làm chủ đạo, KHÔNG phối navy làm primary thứ hai; trắng/neutral chiếm phần lớn diện tích.
- Ảnh sản phẩm thực, ảnh nổi bật rõ khung, đủ khoảng thở; không dùng stock/mockup thay ảnh chính thức.
- Density: desktop cân đối, mobile ưu tiên nội dung chính; không lồng nhiều lớp card có bóng/viền.

## 3. Token màu đề xuất và trạng thái chờ chốt
| Semantic role | Màu đề xuất | Cách dùng |
|---|---|---|
| --dv-color-primary | #C62828 | CTA mua, active, liên kết nhấn |
| --dv-color-primary-hover | #A91F24 | Hover CTA |
| --dv-color-primary-subtle | #FDECEC | Selected, nhấn nhẹ, header popover |
| --dv-color-surface | #FFFFFF | Card, input, drawer, popup |
| --dv-color-canvas | #FAF9F7 | Nền trang |
| --dv-color-text | #252A34 | Văn bản chính |
| --dv-color-muted | #667085 | Chú thích |
| --dv-color-border | #E5E7EB | Viền trung tính |
| --dv-color-success | #16794D | Thành công |
| --dv-color-warning | #A96308 | Cảnh báo |
| --dv-color-danger | #B42318 | Lỗi; độc lập role brand red |

Đỏ #C62828 CHỈ LÀ ĐỀ XUẤT, cần đối chiếu logo Đại Việt trước khi coi là final. Không “tham khảo” màu từ Facebook không xác minh. Dùng đúng tương phản WCAG, nhấn CTA không dùng chữ trắng trên đỏ quá sáng.

## 4. Core geometry bắt buộc
| Component | Desktop | Mobile | Ghi chú |
|---|---|---|---|
| Button | 36px | 44px | font 13px; icon khoảng 16px; gap 8px |
| Text field / search / select | 40px | 40px tối thiểu | label >= 13px, touch target cần đủ 44px khi là icon |
| Control radius | 8–10px | 8–10px | token gợi ý 9px |
| Card radius | 12–14px | 12–14px | ảnh và card đồng bộ |
| Modal header | 52px | 56px | title 16px, X dễ bấm |
| Bảng dữ liệu nếu có | nhẹ, dễ đọc | cho cuộn vùng bảng | không bắt chước header tím Admin |
| Spacing scale | 4/8/12/16/24/32px | cùng hệ | không tạo padding tùy tiện |

Tạo semantic primitive Button, Field, Select, Badge, Card, Dialog, Drawer, Toast, Skeleton; dùng variant tương ứng. Không hardcode chiều cao, màu trong từng trang. Brand tokens chỉ có hiệu lực dưới root .dv-app hoặc data-brand=dai-viet; không global :root ảnh hưởng app khác. Nếu có shared package phải dùng theme provider rõ tên thương hiệu.

## 5. Buttons / Fields / Controls
- Button primary: đỏ, một CTA chính một cụm; secondary: trắng viền; tertiary/ghost: text/transparent; danger: riêng; loading giữ chiều rộng, không double-submit.
- Default/hover/active/focus-visible/disabled/loading phải rõ; disabled không khiến hành động nguy hiểm âm thầm hoạt động; icon-only có aria-label.
- Search: icon, clear control, gợi ý có keyboard arrows/Enter/Esc, loading/empty/search-error; không đưa kết quả “giả” khi chưa có API.
- Input: label rõ, required được biểu diễn có chữ, helper và field error dưới input (lỗi validation KHÔNG thay bằng toast).
- Select/filter: chỉ một control quyết định một giá trị; không lặp dropdown hai tầng, có “Xóa lọc”, trình bày selected rõ.
- Product card: ảnh vuông hoặc theo tỷ lệ chung được duyệt; tên tối đa 2 dòng không cắt mất thông tin quan trọng; meta SKU/quy cách khi cần; giá từ read-model Đại Việt; variant chip/dot; một nút phù hợp (chọn mẫu nếu nhiều biến thể, thêm giỏ nếu đơn biến thể); không fake sao/review/đã bán.

## 6. Motion bắt buộc (trừ reduced motion)
| Hành vi | Thời gian |
|---|---|
| Nút hover/press/focus | 180–200ms |
| Menu, popover, dropdown | 180–220ms, fade + dịch tối đa 6px |
| Popup mở | 280ms fade + scale 0.97→1 |
| Popup đóng | 220ms, exit hoàn chỉnh rồi unmount |
| Drawer | 300ms trượt cạnh phải; không làm xê dịch content |
| Toast vào / ra | 220ms / 190ms; tự ẩn khoảng 4,8 giây |

Easing mở cubic-bezier(.22,1,.36,1), đóng cubic-bezier(.4,0,1,1). Respect prefers-reduced-motion. Không animation làm lệch layout, gây giật ảnh, hoặc chặn nhập liệu. ESC/focus trap/restore focus/scroll lock đúng.

## 7. Toast, dialog, confirmation
- Toast thành công/lỗi/thông tin: trắng, icon trạng thái, nút X, bóng nhẹ, thanh tiến độ 3px; desktop max-width 404px, min-height 66px; cố định góc trên phải, stack không đè; auto-hide khoảng 4.8s, lỗi nghiêm trọng cần phương án giữ lại khi cần.
- Success/error của thao tác add-to-cart, lưu địa chỉ, lỗi mạng/đặt hàng dùng toast gọn; KHÔNG chèn banner thông báo đẩy layout.
- Form đăng ký/địa chỉ/tuỳ chọn sản phẩm nếu mở dạng drawer/modal: header 52/56px, title 16px, nội dung scroll, footer rõ. Không dùng alert thay field error; không mất dữ liệu nhập khi đóng nhầm.
- Xác nhận đặt hàng / xóa mục giỏ theo rủi ro; xóa/sửa đơn có xác nhận phù hợp; không tự bật thanh toán nếu backend chưa sẵn sàng.

## 8. Grid, header, mobile
- Container desktop max-width đề xuất 1200–1280px, gutter >= 16px; header 72–80px; primary nav 44–48px; ô tìm 40px; cấu trúc kiểm theo dữ liệu thực.
- Desktop: listing 4 card/cột khi không sidebar lớn, 3 card/cột nếu có filter; tablet 2–3; mobile 2 card/cột và ảnh ưu tiên.
- Mobile 360/390px: header gọn logo/search/cart/menu, category rail hoặc grid; bộ lọc dạng drawer/bottom sheet; sticky mua hàng ở PDP có kiểm tra che footer.
- **Bottom navigation/dock Đại Việt là phương án CHƯA CHỐT**: không thêm mặc định. Quyết định không dock của Futurebook chỉ áp dụng website Futurebook. Đại Việt chỉ bổ sung nếu Owner duyệt UX riêng.
- Không có horizontal page overflow; riêng carousel/chips/table có overflow nội vùng và chỉ dấu khả dụng.

## 9. Typography / hình ảnh / nội dung
- Ưu tiên Be Vietnam Pro nếu hệ thống phân phối font hợp lệ; fallback system sans; body 14–16px, title theo hierarchy 20–32px, nhãn control >= 13px.
- Tương phản text thường >= 4.5:1; icon trạng thái có text; ảnh có alt thật, lazy-load card ngoài viewport, giữ aspect-ratio tránh CLS.
- Product price phân biệt giá thường/giá khuyến mãi chỉ khi có campaign được duyệt và ngày hiệu lực rõ; không hiển thị NET trên web.
- Badge: chỉ có dữ liệu thật (mới, hết hàng, khuyến mãi), tối đa cần thiết, không nhiều nhãn chen ảnh.
- Nội dung bản quyền sản phẩm/ảnh/claim phải có quyền sử dụng, không copy nội dung đối thủ.

## 10. Quality gate UI
Chụp màn hình thật các viewport 360,390,768,1280,1440; test hover, focus, loading, empty, error, disabled, keyboard, screen reader cơ bản, reduced motion, text dài. Mọi thay đổi primitives shared phải test ba bề mặt website Futurebook, Admin và Đại Việt. CI test tokens/scoped CSS; screenshot không lấy từ hình AI. Exception phải ghi rõ file, lý do, người duyệt, ngày hết hiệu lực.
