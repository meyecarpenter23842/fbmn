# Web Admin & CMS — tài liệu tham khảo kỹ thuật (KHÔNG PHẢI ROADMAP)

> **Nguồn kế hoạch duy nhất:** [docs/roadmap.md](roadmap.md) và [GitHub #1](https://github.com/alibaba240185/fbmn/issues/1). Tài liệu này ghi chú thiết kế kỹ thuật, **không** phát hành một lịch PR hay issue backlog thứ hai. Tất cả gói thực thi là ADM-01…ADM-05, issue #11/#19/#20/#40/#41.

## Quyết định cập nhật 01/11/2026 — module Sản phẩm

**Ràng buộc theo roadmap gốc, mục 4.0:** rà soát mã XNT/bảng giá/ảnh/giá ở file riêng **bên ngoài ứng dụng**. Web Admin **không** xây hàng đợi “Cần duyệt/Cần rà soát”, nút duyệt ảnh/mapping theo SKU hoặc checklist ngoại lệ. Chỉ kiểm lỗi kỹ thuật SKU, file, xung đột và quyền; quản lý danh mục, thêm/sửa popup, Excel 1 sheet, nhóm mẫu, ảnh R2 và thao tác hiển thị/ẩn đơn giản theo kênh. Bản ghi trạng thái/evidence lịch sử ở backend vẫn có thể tồn tại để tương thích và audit nhưng **không là quy trình người dùng**. Mọi phần kỹ thuật bên dưới có từ “duyệt/rà soát” đối với sản phẩm/ảnh phải hiểu theo quyết định này, không được biến thành UI.

## Quyết định kỹ thuật

- Một Web Admin quản lý chung sản phẩm/ảnh/giá/nội dung cho ba business channels: `public_web`, `dealer_app`, `consumer_app`. `admin_web` là control plane, không phải nơi bán; `ios/android` là platforms, không phải data channels.
- Backend sở hữu policy; client web/native chỉ gửi yêu cầu có quyền. Sử dụng PostgreSQL schema và R2 assets qua versioned API, không kết nối DB credentials trực tiếp từ browser.
- Schema: **family/group hiển thị (không phải mã hàng)** → đúng SKU công ty (text, không sinh SKU phụ), spec/barcode/packaging, media ảnh nhiều mẫu trên cùng SKU, đối chiếu mapping từ file ngoài app và provenance nội bộ; per-channel publication/presentation; campaign targets/cooldown/schedule; pricebook/contract private per customer. Barcode có thể trùng giữa SKU nên không unique; ghi revision, actor, audit.
- Admin role: viewer/editor/publisher/pricing/admin. Import Excel/CSV và tạo thủ công phải **dùng SKU đúng mã công ty (giữ số 0 đầu)**, UPSERT/dedupe/preview, không sinh `FB-` hoặc SKU phụ từ màu bìa; tên sản phẩm từ bảng giá PDF cần audit nguồn. Ảnh R2 cần upload ticket, allowlist MIME/size, image-alt/order; đối chiếu mapping ngoài app, không yêu cầu reviewer trong UI. Giá PDF có VAT là giá nguồn, không mặc định retail/NET; NET chỉ ở API riêng tư.
- CMS: hero/offer/popup/news, desktop/mobile media, CTA nội bộ hợp lệ, draft/approved/scheduled/published/paused/archived; account-specific B2B campaigns cần quyền.
- **Website-first:** triển khai Admin catalogue MVP ngay sau backend sản phẩm, để import 613 SKU từ nguồn hiện hành đã đối chiếu bên ngoài hoặc thêm thủ công và quản lý ảnh, rồi hoàn thiện website bằng nội dung thật; CMS và Dealer/End-user mở rộng sau. UI concept gồm danh sách sản phẩm, thêm/sửa sản phẩm, upload nhiều ảnh và quản lý kênh. Mockup chỉ là **giao diện minh họa**, không xác thực thông số/giá/SKU/stock đã xuất hiện trên ảnh.
- Sau này desktop Tauri, nếu thật sự cần, chỉ là giao diện mỏng gọi chung backend; native iOS/Android làm UI riêng.

## Nguồn tham khảo giao diện (không copy source)

- `NPP-Platform`: tổ chức SKU/biến thể/danh mục/đơn vị, review/audit và quản trị giá hợp đồng.
- `sichuan-hotpot`: trải nghiệm CatalogPanel, HomeHeroPanel, HomeOffersPanel, HomePopupPanel, metadata/CTA/lịch/cooldown.
- Không mang nghiệp vụ nhà hàng vào Futurebook. Cấu hình ứng dụng native của tương lai độc lập với thiết kế Website mobile; website không có bottom dock.

## Ghi chú chuyển đổi

- Bản trước của tài liệu này gọi các bước WEB PR04–09 và lập thêm roadmap Admin độc lập. **Danh sách đó đã bị bãi bỏ** vào 29/10/2026.
- Mọi thay đổi thứ tự, dependencies và release gates chỉ sửa `docs/roadmap.md` bằng PR có review.
