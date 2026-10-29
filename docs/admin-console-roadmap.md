# Web Admin & CMS — tài liệu tham khảo kỹ thuật (KHÔNG PHẢI ROADMAP)

> **Nguồn kế hoạch duy nhất:** [docs/roadmap.md](roadmap.md) và [GitHub #1](https://github.com/alibaba240185/fbmn/issues/1). Tài liệu này ghi chú thiết kế kỹ thuật, **không** phát hành một lịch PR hay issue backlog thứ hai. Tất cả gói thực thi là ADM-01…ADM-05, issue #11/#19/#20/#40/#41.

## Quyết định kỹ thuật

- Một Web Admin quản lý chung sản phẩm/ảnh/giá/nội dung cho ba business channels: `public_web`, `dealer_app`, `consumer_app`. `admin_web` là control plane, không phải nơi bán; `ios/android` là platforms, không phải data channels.
- Backend sở hữu policy; client web/native chỉ gửi yêu cầu có quyền. Sử dụng PostgreSQL schema và R2 assets qua versioned API, không kết nối DB credentials trực tiếp từ browser.
- Schema: master product/SKU/category/spec/packaging/media/evidence; per-channel publication/presentation; campaign targets/cooldown/schedule; pricebook/contract private per customer. Ghi `revision`, timestamps, actor và audit.
- Admin role: viewer/editor/publisher/pricing/admin. Import Excel/CSV phải validate/dedupe/preview; ảnh R2 cần upload ticket, allowlist MIME/size, image-alt/order và approval. Giá NET chỉ trong API riêng tư.
- CMS: hero/offer/popup/news, desktop/mobile media, CTA nội bộ hợp lệ, draft/approved/scheduled/published/paused/archived; account-specific B2B campaigns cần quyền.
- UI concept gồm danh sách sản phẩm, thêm/sửa sản phẩm, upload nhiều ảnh và quản lý kênh. Mockup chỉ là **giao diện minh họa**, không xác thực thông số/giá/SKU/stock đã xuất hiện trên ảnh.
- Sau này desktop Tauri, nếu thật sự cần, chỉ là giao diện mỏng gọi chung backend; native iOS/Android làm UI riêng.

## Nguồn tham khảo giao diện (không copy source)

- `NPP-Platform`: tổ chức SKU/biến thể/danh mục/đơn vị, review/audit và quản trị giá hợp đồng.
- `sichuan-hotpot`: trải nghiệm CatalogPanel, HomeHeroPanel, HomeOffersPanel, HomePopupPanel, metadata/CTA/lịch/cooldown.
- Không mang nghiệp vụ nhà hàng vào Futurebook. Cấu hình ứng dụng native của tương lai độc lập với thiết kế Website mobile; website không có bottom dock.

## Ghi chú chuyển đổi

- Bản trước của tài liệu này gọi các bước WEB PR04–09 và lập thêm roadmap Admin độc lập. **Danh sách đó đã bị bãi bỏ** vào 29/10/2026.
- Mọi thay đổi thứ tự, dependencies và release gates chỉ sửa `docs/roadmap.md` bằng PR có review.
