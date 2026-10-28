# WEB PR 01 — Hệ thiết kế Futurebook Miền Nam

Tham chiếu đã duyệt: ảnh người dùng gửi ngày 28/10/2026, chứa thiết kế desktop (laptop) và mobile (phone). **Đây là trang WEB responsive, không phải Native App.**

## Nguyên tắc
- Desktop giữ bố cục: announcement tím → logo/tìm kiếm/tài khoản/giỏ → navigation → hero hai cột → bốn danh mục → sản phẩm 5 cột → dải nội dung → banner giới thiệu → footer.
- Mobile giữ: header hamburger/logo/tìm kiếm/giỏ → **navigation mở từ header** → hero một cột → danh mục hai cột → thẻ sản phẩm cuộn ngang → nội dung → footer web chuẩn.
- **Không sử dụng mobile bottom navigation, tab bar, dock, sticky cart, floating action bar, hay control nào gắn cố định cạnh dưới màn hình.** Các thành phần dạng ứng dụng chỉ dành cho Native App tương lai.
- Giao diện hiện là **design preview**. Hình sản phẩm là minh họa CSS, không phải ảnh catalogue thực; giá, hotline, khuyến mãi, đánh giá, số lượng khách của ảnh tham chiếu **không được coi là dữ liệu thật**.
- Không kết nối login/cart/checkout hay public data API trong PR này; nút chưa hoạt động phải được disabled và mô tả trạng thái, không điều hướng sang 404.

## Tokens
| Thuộc tính | Token | Giá trị |
|---|---|---|
| Brand purple | --color-primary | #6d249e |
| Deep purple | --color-primary-strong | #431078 |
| Pink CTA | --color-accent | #ec0753 |
| Text | --color-ink | #27133d |
| Violet canvas | --color-background | #f8f5ff |
| Lavender section | --color-lavender | #eee6ff |
| Container | --content-width | 1200px |
| Card radius | --radius-card | 14px |

Font hệ thống tiếng Việt phù hợp; các font logo/covers đang ở trạng thái minh họa. Artwork/logo chính thức sẽ được thay bằng asset R2 khi chủ dự án cung cấp.

## Breakpoints và QA
- 360px / 390px: mobile web (2 ô danh mục, header gọn, **không bottom bar**).
- 768px: tablet (2 danh mục, cards thích ứng).
- 1280px / 1440px: desktop theo ảnh mẫu.
- Kiểm tra không có horizontal overflow, keyboard focus, touch target, giảm chuyển động theo prefers-reduced-motion, không có fake price/claim.
- PR 02/03 sẽ thay artwork giả lập bằng ảnh R2 và tinh chỉnh pixel/visual snapshots khi có bản gốc/bộ logo xuất file riêng.

## UI primitives
- components/ui.tsx: Container, Icon, Pill, Badge, Card, ButtonLink, Skeleton.
- components/site-header.tsx: header responsive với trạng thái menu; không dùng bottom navigation.
- components/notebook-art.tsx: khối nghệ thuật CSS chờ ảnh sản phẩm thật.
- lib/ui-preview.ts: dữ liệu DEMO chỉ phục vụ minh họa; chưa phản ánh catalogue hoặc kết quả kinh doanh.

## Danh sách còn chờ phê duyệt
- Logo chính thức vector / R2 URL; ảnh banner gốc đủ nét; ảnh SKU theo catalogue.
- Nội dung liên hệ, cam kết, giới thiệu, sản phẩm được xác minh.
- Bộ screenshot baseline chuẩn (desktop/mobile) để nghiệm thu pixel fidelity.
