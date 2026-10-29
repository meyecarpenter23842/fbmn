# FUTUREBOOK MIỀN NAM — ROADMAP DUY NHẤT (v1.0)

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

**Chung một dữ liệu gốc:** Product → Variant/SKU → Specifications/Packaging → Category/Media → Evidence/Approval. Dữ liệu gốc và R2 asset metadata lưu một lần; không nhân bản product/SKU thành ba bản theo kênh.

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

## 4. Một backlog triển khai mới: ADM-01 → ADM-05

**Quy ước:** `ADM-01…05` là **mã gói công việc cố định**, không phải số GitHub Pull Request. Tên “PR09–PR13” trong trao đổi trước chỉ là dự thảo **được thay thế** bởi bảng này. GitHub PR dùng số thực do GitHub tạo, một issue có thể tách thành vài PR nhỏ cùng gói; mỗi PR có CI/review/deploy gate.

| Thứ tự | Gói duy nhất | GitHub Issue | Deliverable / definition of done |
|---|---|---|---|
| 1 | **ADM-01 — Nền backend đa kênh + Admin Auth/RBAC** | [#11](https://github.com/alibaba240185/fbmn/issues/11) | Schema kênh/platform/global overrides + audit, auth Admin thật, API/quyền với 401/403/revoke, rollback staging |
| 2 | **ADM-02 — Backend sản phẩm & media** | [#19](https://github.com/alibaba240185/fbmn/issues/19) | CRUD master product/category/variant/SKU, media R2/signed upload, import preview, nguồn/approval và publish theo kênh; không NET public |
| 3 | **ADM-03 — Backend nội dung/marketing & channel settings** | [#20](https://github.com/alibaba240185/fbmn/issues/20) | CMS banner/popup/news/campaign, lịch/cooldown/preview và channel-specific publication/feature toggles |
| 4 | **ADM-04 — Backend Đại lý và End-user** | [#40](https://github.com/alibaba240185/fbmn/issues/40) | API B2B/B2C, account-based pricing, giỏ/đơn, kiểm soát dealer ownership, contract native-ready; chưa native UI |
| 5 | **ADM-05 — Web Admin vận hành** | [#41](https://github.com/alibaba240185/fbmn/issues/41) | Admin UI product list/form/SKU/media, channel toggles, banner/popup, nhập/xuất bản, audit, và giá với role phù hợp |

**Ưu tiên backend trước native.** ADM-05 có thể mở skeleton ở nhánh riêng nhưng không coi UI demo là CRUD hoạt động; phân hệ giao diện chỉ được nghiệm thu sau khi backend API thật tương ứng đạt test. ADM-04 không bắt buộc hoàn thành toàn bộ trước khi xuất bản màn hình quản lý catalogue của ADM-05; chỉ màn hình đơn hàng/pricebook phụ thuộc API ADM-04. Không mở issue/roadmap iOS/Android frontend khi chưa có hợp đồng API được duyệt.

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
