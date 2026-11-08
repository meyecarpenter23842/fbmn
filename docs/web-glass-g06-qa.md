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
