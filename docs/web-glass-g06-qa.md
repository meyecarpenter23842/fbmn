# G06 — Kiểm thử trực quan / motion / tốc độ / SKU (08-11-2026)

**Website production khi bắt đầu:** `https://fbmn-web.vercel.app`, G05 commit `498fc63c7b2bef0a08049dffe1f79db215288568`. **Đây là G06 QA, không phải đợt tự deploy.** Không chỉnh Admin, Worker, DB, giá, chính sách hay dữ liệu SKU.

## Hai mẫu tham chiếu Owner

- Ảnh thứ nhất: **1122 × 1402**, trang Song Natural với gallery trái, info phải, 3 card lợi ích, bộ sưu tập. Đây là cảm hứng *visual material / spacing / typography*, **không** phải nội dung hay SKU phát hành.
- Ảnh thứ hai: **1086 × 1448**, phiên bản tổng thể có header kính, album thumbnail, 4 card lợi ích, CTA đại lý và footer tím. Cần so sánh ảnh chụp thực tế từ công cụ bên dưới; **chưa thể tuyên bố pixel-perfect** nếu không có đối chiếu trực quan.
- Mẫu có bìa và thông số minh họa. Website phải dùng logo, mã SKU, ảnh và quy cách thực, không lấy ảnh trong mẫu làm ảnh sản phẩm hay sao chép hotline/giá/chính sách.

## Bằng chứng production đã xác minh bằng truy vấn HTTP

| Route / quan sát | Kết quả |
|---|---|
| `/`, `/san-pham`, Song Natural, `/dai-ly`, `/lien-he`, `/tin-tuc`, `/khuyen-mai` | 200 / SSR render HTML, có lớp `fb-glass-backdrop` và đường đọc nền |
| Song Natural | Có đủ 8 chọn mã từ public data: `0110`, `0114`, `0120`, `0124`, `8381`, `8384`, `8394`, `M439`; lựa chọn sau hydration **phải kiểm bằng Chromium** |
| `/api/decorative-background` | **HTTP 404** tại lần kiểm tra G06; gradient fallback tồn tại. **Chưa nghiệm thu ảnh nền R2 thật** |
| CLS/LCP/INP thực tế, screenshot 1440/1280/768/390/360 | Chưa có chứng cứ tại thời điểm khởi tạo G06, không được báo xanh. GitHub Actions sẽ lưu ảnh + chỉ số sau khi chạy |

Cấu hình `FBMN_PUBLIC_API_BASE_URL` đã trỏ tới HTTPS hostname Worker staging; không sửa biến môi trường. Nguyên nhân sâu của 404 (Worker response hay ảnh trong R2) **chưa thể xác nhận qua phản hồi Web hiện tại**, không được đoán.

## Chạy QA bằng Chromium

Workflow **`G06 Website Browser QA`** tại `.github/workflows/g06-website-browser.yml` chạy **chỉ** với PR thay đổi script/harness này, hoặc `workflow_dispatch` thủ công. Không tự chạy mỗi lần phát triển thông thường và **không deploy**. Workflow cài Playwright ngoài Website runtime, mở production và upload artifact `g06-production-browser-evidence` 7 ngày; kết quả bao gồm ảnh full-page và `report.json`, `report.md`.

Chạy lại trên local/CI có internet:

```bash
npm install --no-save --no-audit --no-fund playwright@1.56.1
npx playwright install --with-deps chromium
G06_BASE_URL=https://fbmn-web.vercel.app node scripts/g06-browser-qa.mjs
```

Ở PowerShell:

```powershell
npm install --no-save --no-audit --no-fund playwright@1.56.1
npx playwright install chromium
$env:G06_BASE_URL = "https://fbmn-web.vercel.app"
node scripts/g06-browser-qa.mjs
```

Bằng chứng nằm tại `artifacts/g06/` (không commit vào mã nguồn). Các route chính chụp ở cả 5 độ rộng, trang nội dung chụp tại desktop 1440 và mobile 390. Test dùng `prefers-reduced-motion: reduce` để chụp hình ổn định và test các thao tác. Cần bổ sung lượt `no-preference` khi nghiệm thu motion thực trên thiết bị.

## Cách đánh giá / rào chắn nghiệm thu

| Nhóm | Điều kiện |
|---|---|
| Visual | Owner nhìn ảnh chụp thật và đối chiếu material kính, xanh lá nhẹ, header/nav, khoảng trắng, CTA và footer so với hai ảnh mẫu. Không ép bố cục/ảnh minh họa y hệt khi dữ liệu thật khác |
| Responsive | 1440,1280,768,390,360; không ngang viewport; không tràn CTA/footer hoặc menu |
| SKU | Click SKU khác, `aria-pressed` và mã tóm tắt cập nhật chính xác kể cả `0110`, không sinh SKU mới |
| Gallery | Chọn thumbnail (khi có hơn 1 ảnh hợp lệ), ảnh không nhảy layout; thiếu ảnh phải fallback |
| Navigation | Hamburger mở, Escape đóng; focus/disabled và dark-on-light contrast |
| Motion | Button 190ms, menu 200ms, hover card nâng nhẹ, reduced-motion giảm chuyển động; không animation backdrop-filter |
| Tốc độ | LCP, CLS, INP từ browser QA là **mẫu đơn lab**, không phải Real User Web Vitals; lặp lại nhiều lần, đánh giá kích thước ảnh 2.14 MB, theo dõi request nền 404 và đường tải JS/CSS |
| An toàn | Admin, Worker, database, SKU, SEO, chính sách bán hàng giữ nguyên |

**Trạng thái G06:** đang kiểm thử, không thể ghi `đã nghiệm thu UI mẫu` khi chưa có ảnh chụp so sánh, tốc độ và lỗi 404 còn tồn tại. Nếu cần sửa lỗi riêng của Worker/R2, phải có phạm vi và quyền phù hợp; không mở Public Access toàn bucket, không sửa ngầm qua G06 visual-only.


## G06.1 — Tinh chỉnh visual theo hai ảnh tham chiếu (theo lệnh Owner)

**Nguồn đánh giá:** artifact G06 `g06-production-browser-evidence` đã xác nhận bằng Chromium: 23 ảnh thật, không tràn ngang trên 1440/1280/768/390/360, gallery 3 thumbnails, SKU `0110` → `0114`, menu Escape và CTA đều hoạt động. **Lượt Chromium cuối trả HTTP 200** cho nền R2 (404 ở lần truy vấn HTTP trước đó là kết quả không ổn định, không xem như blocker thường trực). Lab LCP khoảng 0.8–1.3 giây ở các trang đã lấy mẫu, CLS 0; đây không phải chỉ số Real User Monitoring.

**Visual chênh lệch với mẫu:**
1. Gallery desktop chiếm khoảng 44% bề ngang, hình thật tương đối nhỏ; mẫu ưu tiên ảnh lớn hơn và card bên phải cao cân đối hơn.
2. Phần gợi ý hiện xếp lưới nhiều hàng cao, ảnh nhiều SKU chưa có nguồn đã duyệt phải hiển thị placeholder. Mẫu cho nhịp một dải bộ sưu tập; không được thay placeholder bằng bìa minh họa hoặc ẩn SKU.
3. Overlay trên ảnh nền làm pastel khá mờ, header chiếm nhiều chiều cao; mẫu dùng kính trong, viền sáng, chữ display serif và header thanh mảnh.

**Thay đổi trong PR G06.1:**
- `app/globals.css`: chỉnh opacity overlay từ `.70/.48/.70` thành `.46/.28/.49`; kính giữ alpha thấp, viền highlight và shadow có sáng cạnh trên. Vẫn dùng chính ảnh R2 G04R và gradient fallback; không có URL/binding mới.
- `app/glass-product-detail.css`: gallery từ 44% lên 53%, ảnh cao hơn 330–490px, panel thông tin giãn cân theo gallery, font tiêu đề serif, summary SKU nằm dưới; mobile xếp một cột/ảnh tối đa 430px. Mã SKU/ảnh/CTA giữ logic.
- `app/glass-product-detail.css`: dải gợi ý dùng `overflow-x:auto`, scroll-snap, 4 card desktop/3 tablet/một phần card kế tiếp trên mobile; **không dùng `display:none` ẩn SKU**, vẫn điều hướng keyboard/tab như trước.
- `app/rebaseline.css`: desktop header thu gọn 76→68px, thanh navigation 52→46px, giảm độ gắt của tia hero, không đổi route, search, nút/cart hay motion.
- `tests/web-glass-g06-polish.test.mjs`: bảo vệ layout, nguồn media, lựa chọn SKU, reduced-motion, không CSS owner trùng.

**Ranh giới:** không dùng ảnh của mẫu thiết kế làm bìa sản phẩm, không thêm lời chào hàng/chính sách/giá; không đổi API/Admin/DB/SEO/Worker. Không force push, không deploy production nếu chưa được Owner cho phép. G06.1 merge repo phụ rồi Owner **đồng bộ đúng một lần** cả G06 và G06.1 về local và repo chính.

**Chưa thể khẳng định pixel-perfect sau G06.1** cho đến khi có screenshot từ build đã phát hành; ảnh QA trước là baseline của G05. Chủ động so sánh ảnh 1440/1280/768/390/360 sau khi được phép deploy.
