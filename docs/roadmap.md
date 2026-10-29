# FUTUREBOOK MIỀN NAM — ROADMAP DUY NHẤT (v1.1, ưu tiên hoàn thiện Website)

**Chốt ngày:** 29/10/2026. **Chủ sở hữu scope:** Futurebook Miền Nam.  
**Đây là tài liệu kế hoạch DUY NHẤT.** GitHub [issue #1](https://github.com/alibaba240185/fbmn/issues/1) chỉ là **mục lục/trạng thái**, không là một kế hoạch thứ hai. Các issue thực thi phải dẫn về đây. `docs/admin-console-roadmap.md` được giữ như tài liệu tham khảo kỹ thuật, không còn roadmap độc lập.

## 1. Mục tiêu và hiện trạng đã xác minh

**Mục tiêu:** Một Web Admin và một bộ backend trung tâm cho Website công khai, App Đại lý/NPP và App Người tiêu dùng (End-user); iOS/Android sẽ làm **frontend native thật sau**, không xây lại logic nghiệp vụ hoặc database cho từng nền tảng.

**Đang hoạt động, KHÔNG đồng nghĩa hoàn thành sản phẩm thương mại:**
- Website production `https://fbmn-web.vercel.app` chạy trên Vercel, đã bật SSR remote API, 7/7 public routes trả HTTP 200 (Actions `40884287308`).
- Cloudflare Worker công khai **riêng** `futurebook-mien-nam-public-api-staging` với `/v1/public/categories`, `/v1/public/products`, `/v1/public/content` kết nối Neon **staging** (Actions `40883055487`).
- Kênh B2B/Auth Worker cũ `futurebook-mien-nam-api-staging` **không được gộp, thay thế hoặc repurpose**.
- **Chưa** có catalogue/danh mục/nội dung đã duyệt nhập vào public views; không có CRUD Web Admin, app native, nhập kho, checkout/order end-to-end. Website production đang đọc **Neon staging**, chưa migrate database production.
- Mockup màn Web Admin và SKU/giá/hình ảnh minh họa **không phải dữ liệu thật**. Nguồn thực tế là catalogue, bảng giá, hình ảnh Futurebook được cung cấp/duyệt.

**Phạm vi:** chỉ repo `alibaba240185/fbmn` và hệ thống Futurebook Miền Nam; repo `order` không nằm trong kế hoạch này trừ khi có yêu cầu riêng.

## 2. Mô hình sản phẩm, kênh và hệ điều hành

**Control plane:** `admin_web` là ứng dụng quản trị, **không phải kênh bán**; CRUD và xuất bản qua `/v1/admin/*` có xác thực/phân quyền.

| Business channel (khóa ổn định) | Giao diện dùng dữ liệu | Chức năng/cấp dữ liệu |
|---|---|---|
| `public_web` | Website responsive desktop/mobile | Catalogue/nội dung đã duyệt, công khai; không NET/khách hàng/hợp đồng |
| `dealer_app` | App Đại lý/NPP (iOS/Android native sau) | Catalogue được phép, bảng giá/chính sách theo tài khoản đại lý được phê duyệt, giỏ/đơn B2B |
| `consumer_app` | App End-user (iOS/Android native sau) | Catalogue/giá bán lẻ nếu đã phê duyệt, khuyến mãi người tiêu dùng, giỏ/đơn B2C |

**Không tạo `ios` và `android` làm hai kênh dữ liệu.** `platform=web|ios|android` chỉ là đặc tính frontend/device: store URL, deep link, app version/min-version, push configuration, asset kích thước/hiển thị nếu thật sự cần. Website responsive không có bottom navigation kiểu native (đã chốt 28/10/2026).

**Chung một dữ liệu gốc:** Nhóm hiển thị/family (không phải SKU) → **SKU sản xuất/chứng từ đúng mã công ty** → quy cách, đóng gói, barcode và nhiều ảnh/mẫu bìa → category/nguồn/duyệt. Website có thể gom SKU khác khổ hoặc dòng kẻ vào **một thẻ lựa chọn** nếu cùng dòng hàng, nhưng đặt hàng và quản trị kho vẫn dùng **đúng SKU công ty**. Không tạo `FB-...`, `-H`, `-X` hoặc SKU phụ từ màu bìa; chỉ có internal UUID để liên kết bảng. Barcode là trường riêng, không là unique SKU vì có SKU khác nhau dùng chung barcode. Giá gốc, giá NET, giá bán lẻ không được trộn.

**Tách phần biến đổi theo kênh:** channel-product publication/visibility, sort, featured, image presentation, category placement, page sections, banner/popup/campaign, thông báo, chatbot prompt/knowledge scope. Nội dung có `channel_targets`, lịch và quyền duyệt.

**Giá/phân quyền:** Giá bán lẻ công khai (nếu có nguồn duyệt) khác **giá NET/đại lý/hợp đồng**; pricebook/B2B theo account/role/date/quantity, chỉ backend xác thực được truy cập. Không cho client tự quyết định mức giá hay đọc trực tiếp bảng giá private.

**Quy tắc cấu hình:** global defaults → channel overrides → resource override (một SKU/banner/campaign) → account-specific entitlement/pricebook cho B2B. Không dùng biến `channel` thay cho user role, tenant hoặc platform. Các giá trị có version, hiệu lực, audit.

## 3. Phân ranh dữ liệu và API

- PostgreSQL: schema master/variants/media/channel targets, publication status, pricebook protected, identity/roles/audit. Thiết kế migration có rollback, foreign keys/check constraints, unique SKU, index theo channel. **Không vận chuyển business rules vào iOS/Android frontend.**
- Cloudflare R2: bytes ảnh; PostgreSQL giữ media key/metadata/owner/approval; upload ticket ngắn hạn + kiểm MIME/size, preview, ảnh đại diện/alt/sort, không để R2 secret ở browser.
- Backend business services/DTO không phụ thuộc cố định Neon/Cloudflare: adapter DB, object storage và auth, versioned API, env-specific config để chuyển sang máy chủ riêng sau mà không viết lại client native.
- `GET /v1/public/*`: đã chạy, public-approved view, **không có NET/PII**.
- `/v1/admin/*`: CRUD, media tickets, approval, publish, settings, pricebook theo RBAC + audit.
- `/v1/dealer/*`: B2B theo account/customer isolation, pricebook/đơn; `/v1/consumer/*`: B2C theo auth/user và dữ liệu bán lẻ.
- Auth Admin phải test session browser thật, 401/403/revoke và không self-elevate; không đồng nhất sự tồn tại của Neon Auth staging với login đã nghiệm thu.

## 4. Thứ tự thực hiện WEBSITE-FIRST theo các gói ADM đã có

**Giữ NGUYÊN các mã ADM-01…05 và GitHub Issues; đây là thay đổi ưu tiên trên roadmap duy nhất, không phải kế hoạch thứ hai.** Các tên `PR09–PR13` trong mockup cũ không được dùng làm số gói; mỗi GitHub PR là một thay đổi nhỏ có số tự cấp.

**Mốc mục tiêu gần nhất:** chủ dự án vào Web Admin → tạo/import SKU công ty thật → kiểm tra tên/quy cách/ảnh → duyệt xuất bản cho `public_web` → truy cập sản phẩm thật trên `fbmn-web.vercel.app` **không cần redeploy chỉ để thêm sản phẩm**.

| Giai đoạn | Gói/issue đang có | Phạm vi và nghiệm thu thực tế |
|---|---|---|
| **1 — Nền tối thiểu** | **ADM-01 [#11](https://github.com/alibaba240185/fbmn/issues/11)** | Admin login, role/editor/publisher, schema kênh + audit, API admin riêng; test 401/403/không tự cấp Admin. Không làm toàn bộ B2B lúc này |
| **2 — Dữ liệu sản phẩm** | **ADM-02 [#19](https://github.com/alibaba240185/fbmn/issues/19)** | Master SKU công ty + family/variant display, tên/quy cách/barcode, nguồn, importer XLSX/CSV, metadata ảnh R2, mapping và publish; test chống trùng/không bịa mã, giữ mã `0114` |
| **3 — Admin catalogue MVP** | **ADM-05 [#41](https://github.com/alibaba240185/fbmn/issues/41)** | Web Admin login + danh mục + tạo/sửa SKU + import preview + upload ảnh R2 + kiểm duyệt/đăng public. Chỉ phần catalogue/media trước, không chờ toàn bộ màn quản trị |
| **4 — Website sản phẩm thật** | **ADM-02 #19 + WEB CONTENT #9 + VISUAL #24** | Trang catalogue, ảnh, nhóm hiển thị/mẫu bìa/khổ/đường kẻ, tìm kiếm, lọc, chi tiết, thông tin chính thức lấy API thật; nghiệm thu một luồng nhập→publish→web |
| **5 — Hoàn thiện nội dung website** | **ADM-03 [#20](https://github.com/alibaba240185/fbmn/issues/20)** và phần CMS của **ADM-05 #41** | Banner, popup, menu, nội dung/khuyến mãi, lịch và cấu hình `public_web`; phân kênh nền backend để dùng app native sau |
| **6 — Nghiệm thu Website** | **QUALITY #12 + VISUAL #24 + RELEASE #13 + CONTACT #9 + INFRA #2** | Desktop/mobile đúng mẫu, ảnh/thông tin thật, contact E2E, SEO/a11y/performance, release/rollback, owner UAT. HTTP 200/CI xanh chưa phải hoàn thiện catalogue |
| **7 — Mở rộng app sau Website** | **ADM-04 [#40](https://github.com/alibaba240185/fbmn/issues/40)**; các màn Admin nghiệp vụ tương ứng thuộc **ADM-05 #41** | API đại lý/End-user, bảng giá B2B đúng quyền, giỏ/đơn; **frontend iOS/Android native làm về sau**. Không đổi SKU/master data |

**ADM-05 là một issue xuyên suốt:** phần catalogue/media MVP được làm sớm để website có dữ liệu; các màn CMS, giá và đơn chỉ mở sau API ADM-03/04 liên quan. Không mở một issue khác trùng Admin.

### 4.1. Quy tắc bắt buộc cho SKU, ảnh và tên sản phẩm

- **SKU gốc luôn là chuỗi**, lấy chính xác từ bảng giá/công ty, bảo toàn số 0 đầu (`0114`, `0714`), không sinh mã riêng cho website/app khi thêm thủ công, import, mapping ảnh. SKU công ty là khóa nghiệp vụ duy nhất; UUID là khóa hệ thống nội bộ và không được hiển thị như SKU mới.
- **Một SKU có nhiều ảnh/mẫu bìa**, ví dụ `L536-01.png`, `L536-02.png`; phần `-01` là **số thứ tự ảnh**, không phải mã hàng. Ảnh chưa xác minh, ảnh chi tiết/phụ trợ và mẫu bìa phải tách trạng thái/vai trò.
- **Nhóm hiển thị (family)** có thể chứa nhiều SKU khác khổ hoặc dòng kẻ, ví dụ NICE TRAVEL `L536` A5 và `L836` B5 có thể chọn từ một card. Khách chọn khổ → SKU thật thay đổi; chọn ảnh/mẫu bìa trong cùng SKU → không tự sinh SKU mới. Nếu kho không quản lý được mẫu bìa cụ thể, giao diện phải thông báo giao ngẫu nhiên hoặc không cam kết mẫu.
- **Tên chính thức** cần giữ `ten_dong_goc_pdf`/nguyên bản và `ten_san_pham` tổng hợp **riêng biệt**, cho phép review/edit trên Admin; không dùng tên ảnh thay tên hàng.
- **Barcode không là unique SKU** (ví dụ 4/5 ô ly có thể trùng barcode); không tự động hợp nhất mã hàng dựa trên barcode.
- **Import và nhập thủ công cùng UPSERT theo SKU công ty** (create/update/unchanged/conflict/error preview). Không ghi đè bản đã được duyệt âm thầm; concurrent revision, audit và staging review. Ảnh thiếu → báo thiếu, không lấy nhầm ảnh của SKU khác. Media gốc lưu một lần ở R2, nhiều quan hệ ảnh–SKU chỉ sau khi duyệt.
- **Giá từ bảng nhập** thuộc `source_price` + `source_vat` + `effective_date` và tình trạng xác minh. Không tự suy ra `retail_price`, `NET` hay giá riêng cho từng kênh từ một cột mang nhãn `giá bảng VAT 8%`.

### 4.2. Audit nguồn Excel đính kèm ngày 29/10/2026

File người dùng cung cấp: `Futurebook_MASTER_SAN_PHAM_VA_ANH_2026.xlsx` (**chưa commit vào GitHub hoặc đưa vào database**; chứa giá nguồn). SHA-256 `0e25ae21ae2b0196dcbe7365b7681e9940f63c82b8bdf1246330c0ea128bc562` để đối chiếu lại nếu nhập sau.

| Chỉ số audit file | Đọc trực tiếp từ sheet |
|---|---|
| `SKU - TEN SAN PHAM` | **228 SKU duy nhất**, 49 HS, 20 SV, 159 VPP/giấy. Tất cả có `ten_san_pham`, nhưng đây là tên tổng hợp PDF cần review; tất cả ở `draft` |
| `ANH - SKU` | **212 dòng liên kết SKU–ảnh**, tương ứng 195 ảnh gốc khác nhau, phân loại 178 dòng `MATCHED` và 34 dòng `SHARED_REVIEW` (17 ảnh gốc dùng 2 mã ứng viên) |
| `ANH CHUA KHOP` | **46 ảnh gốc**: 21 `UNLISTED`, 25 `SUPPORT`; tổng ảnh gốc từ bảng là **241** |
| Bao phủ SKU | 61 SKU có `so_anh_da_gan>0`; 11 SKU chỉ có ảnh ở diện cần duyệt; **156 SKU chưa có ảnh liên kết** |
| Khác | **11 SKU** có số 0 đầu; **6 SKU** thiếu `gia_trong_bang_gia_vat_8pct` (P0041, P0042, P0051, P006, P0081, P0082). Không coi giá nguồn là retail/NET chung |

**Cảnh báo provenance:** lịch sử đối chiếu PDF ghi **40 ảnh có mã khớp trực tiếp** và **138 ảnh được suy luận theo tên/dòng/hình**. Trường `MATCHED` trong sheet hiện **không phân biệt hai mức bằng chứng**; `MATCHED` tuyệt đối **không đồng nghĩa đã duyệt**. Cần bổ sung `match_method`, `confidence`, `review_status`, `reviewed_by`, `source_file` và nút duyệt/loại tại Admin trước bulk publish. 17 ảnh shared-review phải được quản lý như asset gốc duy nhất và liên kết SKU ứng viên có phê duyệt; không phát hành mặc định.

**Đầu vào hình ảnh:** XLSX mới chứa **tên file/đường dẫn trong ZIP**, không chứa bytes của 241 ảnh. Muốn upload R2 phải lấy ZIP ảnh gốc/V3 từ Drive hoặc tải ZIP; không tự cho rằng các tệp đã nằm trong R2. Không sửa hoặc ghi đè ảnh gốc trong Drive. **Mẫu Admin 3 hình cũ chỉ là minh họa**, SKU `FB-VHS-200`, `FB-VHS-200-H`, `FB-VHS-200-X` không thuộc bảng giá và bị cấm import làm SKU thật.

## 5. Các việc website cũ vẫn mở — không được đè mã ADM

| Nhóm | GitHub issue | Trạng thái/ranh giới |
|---|---|---|
| CI, manual deploy/release protection | [#2](https://github.com/alibaba240185/fbmn/issues/2) | Hạ tầng đã có, còn nghiệm thu comment-deploy/rollback/branch protection |
| Public content & contact form | [#9](https://github.com/alibaba240185/fbmn/issues/9) | Routes có HTTP 200, nội dung thật/contact E2E còn thiếu; khác ADM-03 CMS |
| Web quality/security/a11y/SEO | [#12](https://github.com/alibaba240185/fbmn/issues/12) | Kiểm tra độc lập, không gọi là ADM-02 |
| Website release/UAT/rollback | [#13](https://github.com/alibaba240185/fbmn/issues/13) | Release gate, không gọi là ADM-03 |
| Visual & asset owner sign-off | [#24](https://github.com/alibaba240185/fbmn/issues/24) | Chỉ nghiệm thu mẫu web/ảnh thật; **không bottom nav** |

**Issue legacy đã hợp nhất/hoàn tất:** #6 (schema front), #8 (catalogue pages), #10 (public API live) đã đóng theo phạm vi code chứng minh; #7 R2 pipeline chuyển toàn bộ checklist còn lại vào ADM-02 #19. #3–#5 là các đợt UI lịch sử, phần visual sign-off còn lại chỉ quản lý tại #24. Các issue đã đóng giữ lịch sử, **không hồi sinh PR09–PR11 cũ**.

## 6. Nguyên tắc đối soát issue, PR, CI và môi trường

1. **Chỉ một master plan:** file này là nguồn quyết định, GitHub #1 chỉ dẫn link và trạng thái. Không lập “roadmap v2” ở một issue hoặc doc khác; thay đổi phải qua PR sửa file này trước.
2. **Một work item có một owner issue:** link GitHub PR vào issue ADM; scope/acceptance và phụ thuộc ở issue, không tạo issue trùng tên tính năng. Checklist đã chuyển thì issue cũ đóng với lý do rõ ràng.
3. **PR nhỏ:** tạo branch từ `main` → commit/push → CI lint/typecheck/test/build xanh → Codex review không unresolved findings → merge. Không merge CI đỏ, không tuyên bố test thật khi chỉ là mock/unit.
4. **Deploy riêng:** merge không tự deploy Vercel. Deploy staging/production **theo yêu cầu rõ ràng**, xác nhận commit SHA, domain/env, HTTP smoke và rollback. Nâng Neon staging → production chỉ khi migration/backup/review được chấp thuận; môi trường “website production đọc DB staging” không phải backend production.
5. **Dữ liệu:** chỉ nhập sản phẩm, giá, khuyến mãi, ảnh đã được chủ dự án cung cấp và duyệt. Cấm dùng số liệu/SKU/ảnh minh họa thiết kế làm dữ liệu kinh doanh thực; giá NET/PII không đi qua API public hoặc frontend consumer.
6. **Đóng issue:** chỉ khi acceptance evidence được đính kèm (CI, unit/HTTP/E2E, screenshot khi cần). Nếu chuyển scope, ghi issue nhận trách nhiệm và đóng issue nguồn là superseded/duplicate; không để hai issue cùng theo dõi một phần việc.
7. **Kết thúc mỗi PR:** cập nhật issue công việc, docs và ghi cái đã/chưa làm; không tự sinh một “plan bàn giao” mâu thuẫn.

## 7. Định hướng xa hơn, KHÔNG thuộc 5 gói ADM hiện tại

- Frontend Native **iOS và Android** cho dealer và end-user theo hợp đồng API đã hoàn thiện; có thể dùng hai UI/client codebases hoặc công cụ native khác theo quyết định riêng. Backend sử dụng chung.
- Chuyển backend/DB sang máy chủ riêng: qua service/data adapters, backups, migration cutover và smoke; tránh thay frontend và giữ API contracts. Đây là **giai đoạn sau**, không tự tạo issue triển khai ngay.
- Kết nối CRM, push nâng cao, analytics, kho/ERP hoặc vận hành nhiều pháp nhân chỉ bổ sung khi có yêu cầu nghiệp vụ, không trộn vào roadmap đang chốt.
