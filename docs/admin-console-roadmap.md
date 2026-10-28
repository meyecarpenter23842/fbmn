# Đề xuất Web Admin / Desktop và CMS quảng cáo (sau WEB PR 04)

## Quyết định kiến trúc

Ưu tiên **Web Admin riêng**, bảo vệ bằng Neon Auth + Cloudflare Workers API; khi cần desktop triển khai Tauri wrapper dùng cùng API, không copy database về máy. Không thực hiện app quản trị trong PR04. Website responsive vẫn không có bottom-tabs/sticky-cart Native.

                   [Web Admin]     [Tauri Desktop sau này]
                           \         /
                          [Workers Admin API] ---- [Neon PostgreSQL]
                            /         \                       |
               [R2 media storage]  [Public read DTO]     [audit/version]
                                        |
                               [Website] [Native B2B app]

Bắt buộc **một nguồn dữ liệu sản phẩm**, nhưng tách private price data và public DTO. Không cho trình duyệt tự truy vấn bảng giá NET. API chịu trách nhiệm kiểm soát role/claim, audit và publish (server-side).

## Bài học từ hai repo đã đọc (chỉ tham khảo, không copy code)

- NPP-Platform: tách product → SKU/variant, category, đơn vị/đóng gói; phân biệt dữ liệu quản trị và danh mục hiển thị, quy trình duyệt/audit. Khả năng đa kho/giá hợp đồng của NPP là ngoài phạm vi website PR04.
- sichuan-hotpot: tách các màn CatalogPanel, HomeHeroPanel, HomeOffersPanel, HomePopupPanel. Có upload image qua R2, cài đặt tần suất popup, autoplay/dwell, thứ tự slide, revision để tránh ghi đè, toggle publish. Chỉ lấy mô hình thao tác, không dùng giá/ảnh/logic nhà hàng.

## Phân hệ dự kiến của Admin

| Chức năng | Vai trò / điều kiện |
|---|---|
| Danh mục & sản phẩm | Editor tạo/sửa nháp, SKU, quy cách, SEO, ảnh, mã biến thể |
| Import CSV/XLSX | Xem bản so sánh trước nhập, phát hiện SKU trùng, nguồn và cảnh báo; không ghi thẳng DB |
| Đối chiếu giá | Pricing role; NET/đại lý/hợp đồng không bao giờ gửi qua public API |
| Phê duyệt xuất bản | Publisher xác minh nguồn, preview, duyệt phiên bản và rollback |
| Media library | R2 upload ticket ngắn hạn, allowlist MIME, kiểm tra size/type, alt, liên kết SKU |
| Hero banner | Thứ tự, lịch chạy, CTA, desktop/mobile asset, autoplay/dwell; preview |
| Khuyến mãi/offer | Nội dung, thời gian, SKU áp dụng; có xác minh riêng trước khi hiển thị |
| Popup quảng cáo | Bật/tắt, ảnh, thứ tự, lịch, tần suất, cooldown, không hiện dồn dập |
| Nhật ký thay đổi | Ai thay đổi, trước/sau, revision và khôi phục phiên bản |

## Hợp đồng nội dung marketing (thiết kế cho PR chuyên biệt)

- Campaign: id, name, type (hero | offer | popup), status (draft | scheduled | published | paused | archived), priority, sortOrder, startAt, endAt, audience (public_web | b2b_app), approvedBy/At, revision.
- CampaignSlide: id, campaignId, r2Key, mobileR2Key?, alt, title?, CTA label?, validated internal relative route, enabled, sortOrder.
- PopupPolicy: enabled, repeatIntervalMinutes, slideDwellMs, maxPerSession, dismissible; cookie/local storage lưu **lịch sử đóng popup**, không lưu quyền hay giá riêng tư.
- Quy tắc: chỉ phát hành campaign đã approved, trong khoảng giờ chạy, asset approved, CTA hợp lệ. Áp dụng cooldown và hạn chế người dùng gặp popup liên tục. Không áp dụng các chương trình khuyến mãi từ ảnh thiết kế chưa duyệt.
- Revision/optimistic concurrency và preview/draft/publish để tránh ghi đè thay đổi. Tách media metadata và storage object.
- Giao diện desktop và mobile của website có thể nhận cùng API marketing nhưng layout do web quyết định, không thêm dock kiểu Native.

## Roadmap thực hiện không phá các PR đã chốt

1. PR04 (hiện tại): schema + validation + public DTO + nguồn, kiến trúc Admin/CMS.
2. PR05: R2 thực tế, upload media, đường dẫn, metadata/alt.
3. PR06–08: trang danh mục và Workers API; migration DEV/QA sau review.
4. PR09: Neon Auth + phân quyền cho Admin; bảo vệ NET và thao tác xuất bản.
5. Issue/PR riêng cho **Admin sản phẩm** (CRUD/import/review/audit).
6. Issue/PR riêng cho **CMS marketing** (hero, offer, popup/lịch và public API).
7. Chỉ cân nhắc Tauri khi workflow desktop thật sự cần, không duy trì hai source nghiệp vụ.
