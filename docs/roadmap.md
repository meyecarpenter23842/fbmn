**DL7C-S — Owner chỉnh vị trí cấu hình 10/11/2026:** tốc độ lật (750–1500ms), tiếng giấy (on/off) và bóng trang (0,10–0,50) **CHỈ** quản lý tập trung tại **Admin → Website Futurebook → Kho Catalogue → Cài đặt sách lật**, lưu Neon revision/audit. Website Catalogue chỉ đọc settings đã duyệt, không hiển thị nút cài đặt/đổi âm thanh cho khách; tiếng giấy chỉ phát khi chính sách trình duyệt cho phép sau thao tác lật. Tất cả bộ dùng chung settings; nền G05 chung không đổi. Migration rehearsal → PR CI/Codex → upstream → production theo phép phát hành Owner; không xóa ảnh R2/metadata/SKU/NET.

# FUTUREBOOK MIỀN NAM — ROADMAP DUY NHẤT (v1.4, Website đại lý & Admin theo kênh)

**Chốt module sản phẩm:** 01/11/2026; **cập nhật IA Admin theo kênh:** 08/11/2026 (giữ lịch sử nguồn 29/10). **Chủ sở hữu scope:** Futurebook Miền Nam.  
**Đây là tài liệu kế hoạch DUY NHẤT.** GitHub [issue #1](https://github.com/alibaba240185/fbmn/issues/1) chỉ là **mục lục/trạng thái**, không là một kế hoạch thứ hai. Các issue thực thi phải dẫn về đây. `docs/admin-console-roadmap.md` được giữ như tài liệu tham khảo kỹ thuật, không còn roadmap độc lập.

## 0. Ưu tiên thiết kế mới 08/11/2026 — Website Premium Glass UI V2 (UI-only)

Owner chốt hai ảnh tham chiếu Premium Purple Glass: **glassmorphism trong suốt là phong cách chính** trên lớp ảnh nền trang trí có thể cấu hình từ R2. Đây là cập nhật UI/UX **nằm trong roadmap duy nhất**, không mở roadmap/issue trùng. Nguồn quy tắc: [UI Contract chung](futurebook-ui-contract.md), [Website Design System V2](web-component-design-system.md), [Website AGENTS](../app/AGENTS.md).

**Phạm vi giữ nguyên:** toàn bộ SKU, family, dữ liệu công khai, API, database, phân quyền, nội dung, navigation, SEO, luồng báo giá và chức năng đang hoạt động. Không tự thêm module hay triển khai production; không sử dụng ảnh bìa AI/mockup làm ảnh sản phẩm.

| Lô | Công việc UI | Đầu ra nghiệm thu |
|---|---|---|
| **G01 — Foundation** | Audit CSS/component hiện hữu; tokens glass, màu, shadow, border, radius, typography, motion; document contract | Một nguồn tokens và style nhất quán, không chồng chéo với Admin; không đổi layout hoặc nghiệp vụ |
| **G02 — Shared primitives** | Glass backdrop/header/card/panel/button/chip; gallery style, state hover/active/focus/disabled/loading/error | Primitives tái sử dụng, không nhân bản CSS hoặc bỏ chức năng |
| **G03 — Song Natural** | Áp V2 vào trang `/san-pham/sku-3ac08ff247847c1e77bfccb0e806ed29`: gallery trái/info phải, selector, CTA, related cards | Chuyển SKU/ảnh/quy cách/CTA đúng dữ liệu; UAT screenshot desktop/mobile thực tế |
| **G04 — R2 decorative background** | Lớp ảnh nền riêng, overlay và fallback; lấy URL từ cấu hình public/media **nếu hệ thống hiện có hỗ trợ** | Có ảnh thì glass hiển thị trên nền; thiếu ảnh vẫn đẹp; không hardcode URL, không tự đổi DB/API |
| **G05 — Website rollout** | Dùng primitives V2 cho trang chủ, danh mục, liên hệ/đại lý, banner và footer | Cùng một hệ thống kính mờ, giữ nav/content/CTA và responsive hiện tại |
| **G06 — QA & performance** | Test viewport 1440/1280/768/390/360, prefers-reduced-motion, contrast, keyboard, Web Vitals, gallery/SKU/CTA | Lint/typecheck/test/build, CI và Codex sạch; ảnh nghiệm thu thật; không chậm/giật, không overflow |
| **G07 — Product UX theo lệnh Owner** | Một thẻ sản phẩm = một liên kết; desktop card dọc gọn, mobile catalogue card ngang; mobile chi tiết đưa ảnh nhỏ + SKU lên trước gallery, ảnh thật phóng to và CTA chỉ xuất hiện khi nút chính khuất màn | Không mất SKU/ảnh/CTA, không đổi backend/SEO hay giá; 1 branch/PR, CI và Codex sạch, đồng bộ một lần; deploy khi Owner cho phép |
| **G07.2 — Cleanup sau ảnh nghiệm thu** | Ẩn thumbnail nếu ảnh đã duyệt chỉ có một tấm; dải sản phẩm gợi ý trở về lưới không kéo ngang; footer gọn; popup/tải app Glass V2 và icon CH Play đúng nhận diện; bỏ tiêu đề/mô tả tab dư thừa nhưng giữ H1 trợ năng | Một PR Website-only; không thay SKU, ảnh, giá, chính sách, liên hệ chưa xác minh hoặc backend; desktop/mobile QA, CI + Codex sạch, squash merge, đồng bộ rồi deploy khi Owner yêu cầu |

**Thứ tự PR:** PR tài liệu V2 (quy tắc/roadmap) → G01 → G02 → G03 và Owner nghiệm thu trang mẫu → G04 (phụ thuộc URL nền đã xác minh) → G05 → G06. Mỗi PR có scope độc lập, CI xanh và Codex review sạch mới squash merge repo phát triển. Đồng bộ local rồi fast-forward repo chính theo quy trình. Deploy production chỉ khi Owner cho phép.

**Điểm phân biệt:** Lô G04 không có nghĩa đã tồn tại API cấu hình background. Nếu chưa hỗ trợ, chỉ làm CSS fallback và ghi blocker/tách phạm vi cấu hình để Owner quyết định; không phá nguyên tắc UI-only.

**G04R — Owner phê duyệt bổ sung ngày 08/11/2026:** sau G04 fallback, Owner đã upload và chỉ định **đúng ảnh** `banners/G04/backdrop-v1.webp`. Lô kết nối độc lập được phép tạo một read-only route allowlist tại Public Worker `PUBLIC_MEDIA_R2` hiện có và same-origin Website proxy, được kích hoạt qua manifest public `lib/media/decorative-background.ts` (có thể tắt về `null`). Đây là ngoại lệ cụ thể do Owner phê duyệt, không phải xây CMS, không thêm DB/schema, không bật public R2, không thay API sản phẩm/Admin. CI xanh + Codex sạch + squash merge repo phụ → đồng bộ repo chính; **Worker rồi Website production chỉ deploy khi Owner cho phép**. Fallback gradient bắt buộc giữ khi ảnh không tải được.

--- 

## 0.1. QUYẾT ĐỊNH OWNER 08/11/2026 — ADMIN THEO TỪNG KÊNH, CẬP NHẬT ROADMAP TRƯỚC KHI SỬA UI

**Ưu tiên/hiệu lực:** quyết định kiến trúc thông tin (IA) Admin này bổ sung mục 2–4 và thay cách đặt menu CMS chung trong Admin; **không thay** quy tắc SKU/giá, schema, backend dùng chung, Website Glass UI V2 hoặc bố cục Website/App đã duyệt. **Bắt buộc cập nhật roadmap và thông qua PR tài liệu trước mọi PR tái cấu trúc UI.** Theo dõi thực thi CMS ở **[ADM-03 #20](https://github.com/alibaba240185/fbmn/issues/20)**; không tạo issue/roadmap khác trùng nội dung.

**Lý do:** Banner, Popup, Tin tức, Khuyến mãi đang được đặt làm menu chức năng toàn cục rồi chọn Web/App trong màn chi tiết. Điều này gây nhầm vị trí và bố cục vì Website, App Đại lý và App Người tiêu dùng có điều hướng, slot, viewport và trình bày riêng. **Admin phải điều hướng theo kênh hiển thị trước, rồi chọn loại nội dung/vị trí/tab con trong kênh đó.**

### Cấu trúc menu mục tiêu (một Admin, một backend)

| Cấp menu chính | Menu con / vai trò | Trạng thái triển khai |
|---|---|---|
| **Dùng chung — Sản phẩm** | SKU, danh mục/nhóm mẫu, ảnh R2, Excel, dữ liệu gốc | Giữ màn/luồng đang có, không nhân bản theo kênh |
| **Dùng chung — Giá & bảng giá** | Danh sách bảng giá, giá SKU/Excel, chính sách áp dụng theo quyền và kênh | Giữ nghiệp vụ riêng, không đặt menu Giá trong từng Website/App; không lộ NET |
| **Website Futurebook** | Trang chủ & bố cục; Banner & Popup; Tin tức & Khuyến mãi; Danh mục & hiển thị sản phẩm; Liên hệ & đăng ký đại lý; Cấu hình Website | **Ưu tiên số 1 để triển khai thật**, dùng đúng tên và vị trí của Website live |
| **App Đại lý/NPP** | Bố cục trang chủ, nội dung/khuyến mãi, hiển thị sản phẩm và chức năng app tương ứng khi có thiết kế/API | Chỉ đưa vào điều hướng khi có chức năng thật; **chưa phải app đã phát hành** |
| **App Người tiêu dùng** | Bố cục trang chủ, nội dung/khuyến mãi, hiển thị sản phẩm và chức năng app tương ứng khi có thiết kế/API | Chỉ đưa vào điều hướng khi có chức năng thật; **chưa phải app đã phát hành** |
| **Dùng chung — Khách hàng / Hệ thống** | Khách hàng, quyền, audit, cài đặt toàn hệ thống nếu đã có chức năng tương ứng | Không bịa module mới chỉ để đủ menu |

- **Phạm vi ngữ cảnh:** khi vào `Website Futurebook`, tất cả trang con tự dùng `public_web`; **không yêu cầu chọn Web/App lặp lại** trong mỗi form. Trong App Đại lý/Người tiêu dùng dùng lần lượt `dealer_app`/`consumer_app`. Chỉ có hành động **dùng lại/phân phối sang kênh khác** mới cần chọn nhiều kênh rõ ràng và xác nhận quyền.
- **Dữ liệu không bị tách:** một kho SKU, pricebooks được bảo vệ, nội dung nguồn/CMS entries, ảnh R2, revision/audit và backend chung. Mỗi kênh có **placement/slot, ảnh responsive, lịch, khả năng hiển thị, nội dung hiển thị và trạng thái xuất bản riêng**; không sao chép bản ghi/đổi SKU âm thầm. Phân quyền kiểm tra ở server, không tin tham số kênh do client tự gửi.
- **Bố cục/preview theo kênh:** trong từng trang con có tab/khối **Nội dung → Vị trí hiển thị → Xem trước → Lịch & xuất bản** khi thật sự cần, tránh quá nhiều lớp tab. Preview Website phải thể hiện đúng các slot `home.hero`, `home.after_products`, `category.header`, `home.entry`/`category.entry`/`all.entry`, tin tức/khuyến mãi theo [CMS placement contract](cms-placement-contract.md), hỗ trợ **desktop/mobile** và dữ liệu/ảnh đã chọn. Preview là **bản nháp quản trị**, phải dùng contract của giao diện thật và ghi rõ khi chưa tương đương live; không thay thế kiểm tra xuất bản thực tế. App preview theo màn hình/layout native riêng **sau khi có app**; không áp Website desktop lên App.
- **Giữ runtime và quyền:** chỉ sửa cấu trúc menu/routes/tab/preview Admin theo PR hẹp; không đổi navigation/layout Website, không đổi SKU/giá, không cho nút xuất bản giả hoạt động khi public read-model/renderer chưa sẵn sàng; không làm mất bản nháp, ảnh, phân quyền, liên kết cũ hoặc chức năng quản trị đang chạy. URL Admin cũ cần redirect/compatibility hợp lệ.

### Lộ trình thi hành theo thứ tự (không được gộp mất bước nghiệm thu)

| Bước | Mục tiêu | Tiêu chí hoàn thành / ranh giới |
|---|---|---|
| **C0 — Chốt roadmap** | Chỉ sửa **`docs/roadmap.md`** để chuẩn hóa IA, kênh và thứ tự công việc | PR tài liệu được CI + review sạch, squash merge; **chưa sửa Admin/UI/DB/Worker** |
| **C1 — Sắp xếp navigation Admin** | Menu chung giữ Sản phẩm/Giá; CMS dời vào **Website Futurebook**; chuẩn bị chỗ cho 2 App theo mức sẵn sàng thực tế | Không thay API hay dữ liệu; đường dẫn cũ vẫn dùng được, menu/motion/responsive/accessibility đúng UI Contract; Owner UAT |
| **C2 — Tái tổ chức CMS Website** | Trang con theo ngôn ngữ live, nhóm slot và tab nhỏ; tạo/sửa, gắn media, lịch, quyền trong ngữ cảnh `public_web` | Một hành trình quản trị nội dung Web dễ hiểu; không lặp dropdown kênh; không phá dữ liệu nhiều kênh cũ |
| **C3 — Preview thật theo vị trí** | Website desktop/mobile preview banner, popup, tin tức, khuyến mãi tại slot được cấu hình | Ảnh không bị cắt sai; vị trí, kích thước, trạng thái và văn bản khớp contract; không ngụy nhận preview là live |
| **C4 — CMS → Website E2E** | Kết nối Admin CMS → private API/storage → **public-approved read-model** → renderer Website, refresh không redeploy theo nội dung | Trước tiên xác minh Worker/migration đang dùng; test `draft/published/hidden/scheduled`, lịch/cooldown popup, 401/403, cache, R2 và chặn NET; deploy/migration **chỉ khi Owner duyệt riêng** |
| **C5 — UAT & bàn giao Website** | Kiểm desktop 1440/1280/768/390/360, Safari/Chrome, chức năng thực trên production/staging đã phê duyệt | CI/Codex, screenshots thực, ảnh/SEO/keyboard/toast/motion, rollback và Owner ký nghiệm thu; phối hợp #9/#12/#13/#24 |
| **C6 — Mở rộng theo App** | Lặp lại mô hình IA và preview **riêng** cho Dealer/Consumer khi đã có UI/API nghiệp vụ và quyền | Phụ thuộc ADM-04 #40 + quyết định thiết kế từng app; không tạo màn App giả trong C1–C5 |

**Tình trạng làm gốc ngày 08/11/2026 (không phải xác nhận UAT):** G07.2 Website đã merge/deploy tại `a8f76bb` nhưng UAT trực quan còn mở; Admin CMS #20 đã có code CRUD, placement, upload ảnh responsive/preview tại Admin nhưng **chưa xác nhận public CMS renderer và luồng xuất bản hoàn chỉnh**. Khác biệt code/merge/deploy/UAT phải báo riêng. Ưu tiên hoàn tất UAT G07.2/R2 song song với chuẩn bị C1; **không mở C1 trước khi C0 được merge**.


## 0.2. QUYẾT ĐỊNH OWNER 09/11/2026 — WEBSITE FBMN THEO HƯỚNG KHÁCH ĐẠI LÝ (LÀM KẾ HOẠCH TRƯỚC)

**Đây là cập nhật kế hoạch DUY NHẤT, không phải roadmap thứ hai.** Thay đổi thông tin điều hướng và trình bày Website chỉ theo phạm vi Owner yêu cầu; ngoại lệ mới đối với những đoạn “giữ menu/bố cục” của G05/G07 và Website Design System 08/11. Các hợp đồng còn lại giữ nguyên. **PR DL0 chỉ sửa `docs/roadmap.md`: chưa sửa UI, Admin, API, Worker, DB hoặc deploy.** Dùng issue hiện có: Web/content/contact [#9](https://github.com/alibaba240185/fbmn/issues/9), visual [#24](https://github.com/alibaba240185/fbmn/issues/24), SKU/catalogue [#19](https://github.com/alibaba240185/fbmn/issues/19), Admin [#41](https://github.com/alibaba240185/fbmn/issues/41), CMS [#20](https://github.com/alibaba240185/fbmn/issues/20), quality [#12](https://github.com/alibaba240185/fbmn/issues/12), release [#13](https://github.com/alibaba240185/fbmn/issues/13). Không tạo issue/roadmap trùng.

### Mục tiêu, menu và nguyên tắc

**Khách ưu tiên:** đại lý, nhà phân phối, nhà sách, khách đặt gia công. Hành trình chính: **xem mẫu → chọn danh mục/SKU và quy cách → xem/tải Catalogue chính thức → gửi nhu cầu báo giá hoặc hợp tác**. Không thiết kế Website như sàn bán lẻ và không coi giỏ hàng/checkout chưa hoạt động là CTA chính.

**Menu Website theo đúng thứ tự Owner chốt:** **Trang chủ – Sản phẩm – Gia công – Bảng tin – Catalogue – Liên hệ**.

- **Trang chủ:** Hero CMS nhiều Slide/motion giữ nguyên; lấy danh mục và sản phẩm thật đã phát hành thay vì card minh họa; có CTA liên hệ/báo giá sỉ/đăng ký đại lý dẫn tới luồng hoạt động thật.
- **Sản phẩm:** danh mục nhiều cấp, tìm tên/SKU, lọc quy cách, mẫu bìa rõ, trang chi tiết và chọn biến thể theo mã công ty. Mỗi sản phẩm độc lập trong danh mục là một card; nếu gom nhiều SKU vào một `family`, **mặc định chỉ một card và chọn biến thể bên trong**. Muốn bung mỗi SKU thành card phải thực hiện DL5, **không báo đã có sẵn**.
- **Gia công:** trang giới thiệu và form nhận yêu cầu gia công. Phạm vi dịch vụ, khổ, chất liệu, in riêng, MOQ, tiến độ và năng lực chỉ công bố khi Owner có thông tin xác minh; không tự tạo cam kết thương mại.
- **Bảng tin:** hợp nhất điều hướng Tin tức/Khuyến mãi vào một trang, phân loại vẫn rõ và giữ CMS/publication, permalink/SEO cũ.
- **Catalogue:** danh sách tài liệu PDF đã được Owner phê duyệt, theo nhóm hàng/phiên bản/ngày cập nhật; xem/tải thật, không tạo PDF giả hoặc đưa bảng giá NET ra công khai. **Catalogue PDF khác catalogue dữ liệu SKU**.
- **Liên hệ:** thông tin thật, form đại lý/yêu cầu báo giá/gia công đến đầu nhận đã xác minh; không bịa số điện thoại, Zalo, địa chỉ. Giữ tương thích URL cũ `/gioi-thieu`, `/khuyen-mai`, `/tin-tuc`, `/dai-ly` qua redirect/đường dẫn hợp lệ có kiểm SEO.
- **Giữ nguyên** logo, tone tím–kem Premium Purple Glass, lớp nền R2, CMS C4/C5 Banner/motion, SKU thực (bao gồm số 0 đầu), nhóm family, R2 ảnh, backend dùng chung, quyền Owner/public, và bảng giá private. Website `public_web` **không được trả NET, tồn kho nội bộ, giá đại lý/chính sách hợp đồng hay PII**. Không dùng ảnh AI/mockup làm sản phẩm công khai.

**Hiện trạng kiểm từ mã ngày 09/11/2026:** `components/site-header.tsx` còn 7 menu cũ; `app/page.tsx` vẫn dùng `previewProducts` và danh mục/thẻ minh họa. `app/san-pham/page.tsx` và `app/danh-muc/[slug]/page.tsx` đã dùng `getPublicCatalog()` và `CatalogListing` nhưng không đồng nghĩa có chế độ một card cho mỗi SKU. Cần kiểm tra logic/family/ảnh/quyền trước mỗi PR.

**Quy tắc bố cục sản phẩm:**
1. `category` (danh mục) ≠ `family` (nhóm hiển thị) ≠ `SKU` (mã hàng công ty); sắp xếp danh mục trên Trang chủ **không** làm đổi SKU hoặc family. Ảnh phụ của cùng SKU **không** phải SKU mới.
2. Card phải ưu tiên nhìn rõ bìa, hình ảnh chiếm mục tiêu khoảng **70–75% vùng card**, hạn chế padding và bỏ scale cứng khiến ảnh nhỏ. Ưu tiên `object-fit:contain` và ảnh thật đã cắt khoảng trống hợp lý; không méo, không cắt bìa, thiếu ảnh dùng placeholder trung tính. Tên/SKU/quy cách/đóng gói chỉ hiển thị khi có dữ liệu thật.
3. Desktop mục tiêu **Trang chủ 4 card/hàng**, **danh mục 3 card/hàng nếu có bộ lọc bên trái**. Mobile phải nghiệm thu 390/360px; thử hai cột nếu đủ chỗ cho SKU và tên, nếu không giữ card ngang một cột theo G07. **Không tự đảo G07 mobile trước khi Owner duyệt ảnh thực.**
4. Admin `Website Futurebook → Trang chủ & bố cục` cần cho chọn danh mục công khai, thứ tự, số card và nhóm nổi bật; `Danh mục & hiển thị sản phẩm` cần chọn mode `family` (mặc định) hoặc `sku` (chỉ khi DL5 sẵn sàng). Có preview Desktop/Mobile, quyền, version/audit và public API thật; **không làm nút cấu hình giả**.
5. Mode `sku`: mỗi SKU đã xuất bản được một card đúng ảnh/thông số và link chọn SKU; không nhân bản records, không sinh mã theo mẫu bìa; cần kiểm filter, pagination, canonical/SEO, ảnh thiếu và quyền công khai.

### Lộ trình từng PR — **DL0 trước mọi thay đổi runtime**

| Thứ tự | Gói / phạm vi | Điều kiện hoàn thành |
|---|---|---|
| **DL0 — Cập nhật roadmap** | Chỉ `docs/roadmap.md`, chốt 6 menu, dữ liệu, 7 hạng mục, thứ tự, giới hạn và gate. | PR docs-only → CI/Codex sạch → squash merge repo phụ → đối chiếu/fast-forward repo chính. **Không deploy**. |
| **DL1 — Menu và CTA đại lý** | 6 menu, search SKU/tên, CTA liên hệ/báo giá sỉ, responsive, redirect/SEO URL cũ. | Menu đúng desktop/mobile, keyboard/focus, link không gãy, tone và Hero không đổi; Owner nghiệm thu rồi mới DL2. |
| **DL2 — Thẻ sản phẩm ảnh lớn** | Dùng component/style owner chung cho home/category/related; tăng khung ảnh, giảm đệm, giữ tên, SKU/quy cách. | So sánh ảnh thật 1440/1280/768/390/360; không crop/méo bìa, không tràn chữ, placeholder rõ; không vô ý phá G07. |
| **DL3 — Trang chủ dữ liệu thật** | Thay `previewProducts`/danh mục minh họa bằng catalogue `public_web` đã duyệt, giữ Hero và slot CMS, có trạng thái empty/loading/error. | Danh mục/sản phẩm thay đổi theo publish không cần code deploy; không hardcode SKU/giá/ảnh và không lộ NET. |
| **DL4 — Admin cấu hình bố cục** | Chọn danh mục nổi bật, thứ tự section/card, số lượng hiển thị, preview desktop/mobile; settings/API/version/audit. | Admin thay đổi → Website nhận đúng; kiểm quyền, fallback, reset/sort và test dữ liệu thật; không đổi SKU. |
| **DL5 — Danh mục theo nhóm hoặc SKU** | Mở `family|sku` mode trong danh mục/Admin, ánh xạ mỗi SKU công ty và ảnh đúng, mặc định family. | Kiểm 1 nhóm nhiều SKU, 1 SKU nhiều ảnh, SEO, lọc/phân trang, đổi mode không đổi dữ liệu gốc. |
| **DL6 — Gia công** | Trang dịch vụ đã xác minh + form yêu cầu gia công/báo giá đến đầu nhận thật. | Có nguồn cho năng lực/MOQ/quy cách; test gửi thành công/lỗi, quyền dữ liệu, chống spam; chưa có thông tin thì để trạng thái chờ, không bịa. |
| **DL7A — Bảng tin và danh sách PDF** | Giữ phạm vi DL7 cũ: tin tức/khuyến mãi hợp nhất; danh sách catalogue PDF theo bộ/phiên bản và xem/tải. Đây là gói *sau* DL7B/C trong quyết định ưu tiên mới. | Dùng tài liệu được Owner phê duyệt, giữ URL/SEO, không hiện draft, không lộ NET/R2 key; test mobile. |

**DL7A-PDF (triển khai tiếp sau Bảng tin):** tận dụng bộ Catalogue và phiên bản hiện có, mỗi bộ có thể có PDF được Owner bật/tắt quyền công khai/xem/tải, không thay DL7C/G05; xem thêm docs/web-dl7a-catalogue-pdf.md. Migration cần lệnh Owner riêng, không tự phát hành.

| **DL7B — Kho R2 & Admin Catalogue (ưu tiên NGAY SAU DL4)** | Audit R2/Worker/media hiện hữu; tách kho/prefix ảnh trang Catalogue, PDF/cover/thumbnail khỏi SKU; **ảnh nền chỉ tab Catalogue** có folder riêng desktop/mobile và cấu hình độc lập; Admin Website Futurebook quản lý bộ/phiên bản, thứ tự trang, ảnh nền, trạng thái xuất bản. Dùng bucket riêng nếu audit có lý do và Owner duyệt hạ tầng; không tự tạo binding/bucket production. | Upload/đọc từ R2 theo quyền, manifest/metadata cho từng trang, fallback ảnh lỗi, sort/publish có audit và revision, public chỉ trả file đã phát hành; không NET, không expose key. |
| **DL7C — Sách lật trực tiếp trên nền (ngay sau DL7B)** | Riêng tab Catalogue: sách nằm nổi trực tiếp trên background đã chọn, **không khung PDF viewer**; desktop 2 trang, mobile 1 trang; lật trang có reduced-motion; thumbnail, mục lục, zoom, fullscreen, deep-link/chia sẻ từng trang; tùy chọn hotspot tới SKU công khai khi có mapping xác thực. | Kết nối ảnh R2 thật, đúng logo/tím–kem Premium Purple Glass; 1440/1280/768/390/360, keyboard/touch, loading/empty/error, ảnh/motion/performance, test PDF/tải; các tab khác không đổi. |
| **DL8 — Regression và nghiệm thu** | Kiểm toàn luồng đại lý, performance ảnh, mobile/Chrome/Safari, SEO, a11y, CMS Hero, contact, rollback. | CI/Codex mỗi PR + UAT bằng trình duyệt thật và Owner xác nhận; HTTP 200/CI xanh không thay thế UAT. |

**Quyết định Owner 09/11/2026 — ưu tiên triển khai Catalogue ngay sau DL4:** Các mã DL giữ nguyên để không mất lịch sử, nhưng **thứ tự thực thi mới là DL4 → DL7B → DL7C → DL5 → DL6 → DL7A → DL8**. Phần Catalogue flipbook không phụ thuộc chế độ family|sku (DL5), Gia công (DL6) hay Bảng tin (DL7A). Không đổi cấu trúc SKU, menu sáu mục, các tab khác, DL4 hoặc chính sách giá. DL7B/C là **hai PR runtime độc lập**, mỗi lô phải có test/CI + Codex review; trước đó PR tài liệu này cần hoàn tất. Chưa tự kích hoạt Worker, Neon migration, binding R2 hoặc deploy Website/Admin production; mỗi release cần lệnh Owner riêng. Ghi nhận yêu cầu tại issue Website hiện có #9, không mở roadmap/issue trùng. Tên bucket/prefix thực tế phải kiểm tra R2 đang kết nối trước khi code.

**DL7C-R — quyết định Owner 10/11/2026:** Nâng cấp DL7C thành sách lật giấy thật bằng StPageFlip 950ms (cong giấy, bóng động, kéo góc, bìa cứng), tiếng giấy WebAudio opt-in; **Catalogue dùng nền G05 chung của toàn website từ `GlassPageBackdrop`**, không dựng background khác. Xóa hai luồng upload nền Desktop/Mobile khỏi Admin và API xuất ảnh; chỉ trang/bìa còn được quản lý. Không xóa dữ liệu nền R2/Neon cũ, không thêm bucket/migration; giữ SKU, giá, tab khác. Qua PR repo phụ → CI/Codex → đồng bộ → deploy khi Owner duyệt, UAT ảnh thật và mobile trước khi gọi hoàn tất.

**Quy trình bắt buộc cho DL1–DL8:** đọc `AGENTS.md`, UI contract, roadmap và hiện trạng hai repo → branch phát triển `meyecarpenter23842/fbmn` → PR, CI, Codex review sạch, squash merge → fetch/đối soát `origin/main` và `upstream/main`, fast-forward repo chính `alibaba240185/fbmn` (không force push) → xác minh commit/tree → **chỉ migration/deploy production theo lệnh Owner cho từng phạm vi** → kiểm tra thực tế và bàn giao SHA/CI/review/UAT. Không dùng preview nếu Owner không yêu cầu; **CI repo phụ không được tính thay CI repo chính**. Một PR/gói, không gộp toàn bộ vào một PR khổng lồ. DL0 được duyệt **không** đồng nghĩa tự động duyệt deploy DL1–DL8.

**Đo hiệu quả sau khi có tracking thật:** số lượt xem danh mục/chi tiết SKU, lượt xem/tải Catalogue, lead đại lý và yêu cầu gia công hợp lệ. Không tự đặt KPI hoặc báo cáo số liệu khi chưa đo.


---

## 0.3. OWNER 10/11/2026 — HOÀN THIỆN WEBSITE SAU DL7

Thực hiện theo thứ tự DL7D/DL7E → DL7C-T → DL9 → DL10A/B/C → DL8 nghiệm thu cuối. Đây là bổ sung vào roadmap duy nhất; không đổi SKU, NET, menu sáu mục, nền G05 chung hay Admin ngoài phạm vi. Từng PR repo phụ, CI/Codex sạch rồi đồng bộ; chỉ deploy/migration theo phép Owner.

| Lô | Phạm vi | Nghiệm thu |
|---|---|---|
| DL7D — Nội dung & nhận diện | Địa chỉ 1092A Lê Đức Anh (QL01A), P. Tân Tạo, Ho Chi Minh City, Vietnam, 700000; email info@fbmn.vn. Đồng nhất Website, bỏ text demo/đối chiếu Fanpage, footer bỏ Khám phá/Hỗ trợ, logo gốc nền trong suốt. | Không bịa hotline; giữ logo, màu, đường dẫn, chức năng thật; footer gọn mobile. |
| DL7E — Typography | Sửa nguồn font/tokens dùng chung, hỗ trợ tiếng Việt, tiêu đề/nội dung cân đối, tương phản trên Glass V2; giữ kích thước control theo UI Contract. | Kiểm toàn Website 1440/1280/768/390/360, dấu tiếng Việt, không tràn/cắt chữ; không đổi Admin. |
| DL7C-T — Catalogue | Bỏ tiêu đề/mô tả lặp, sách lớn gọn trên nền G05, thay tiếng mô phỏng bằng âm giấy thật có quyền dùng; Admin chỉnh tốc độ/âm lượng/bật tắt/nghe thử. | Test âm thanh, touch/keyboard, mobile, reduced motion; không nền riêng. |
| DL9 — Liên hệ | Dropdown 34 tỉnh/thành theo mã hành chính hiện hành; email/SĐT, đối tượng khách, chọn nhiều sản phẩm quan tâm; lưu Neon, Admin quản lý, báo email khi đã cấu hình. | Gửi thật, chống spam, quyền, validation, không báo thành công giả; dùng lại luồng DL6 khi phù hợp. |
| DL10A/B/C — Chatbot CX | Admin nhập cấu hình JS/JSON an toàn (không chạy script tùy ý), kết nối Agent/environment, load/chọn model được API hỗ trợ; Playbook/prompt quản lý Google. Website chat qua backend, lưu hội thoại Neon, Admin xem/xóa. | Kiểm quyền, secrets server-only, model thực tế, giới hạn request, PII/NET, xóa hội thoại; không giả kết nối. |

DL8 nghiệm thu cuối sau các lô mới. DL7D/DL7E là phạm vi Owner yêu cầu thực hiện trước; DL9/DL10 và DL7C-T không nằm trong PR runtime bước 1.


## 1. Mục tiêu và hiện trạng đã xác minh

**Mục tiêu:** Một Web Admin và một bộ backend trung tâm cho Website công khai, App Đại lý/NPP và App Người tiêu dùng (End-user); iOS/Android sẽ làm **frontend native thật sau**, không xây lại logic nghiệp vụ hoặc database cho từng nền tảng.

**Đang hoạt động, KHÔNG đồng nghĩa hoàn thành sản phẩm thương mại:**
- Website production `https://fbmn-web.vercel.app` chạy trên Vercel, đã bật SSR remote API, 7/7 public routes trả HTTP 200 (Actions `40884287308`).
- Cloudflare Worker công khai **riêng** `futurebook-mien-nam-public-api-staging` với `/v1/public/categories`, `/v1/public/products`, `/v1/public/content` kết nối Neon **staging** (Actions `40883055487`).
- Kênh B2B/Auth Worker cũ `futurebook-mien-nam-api-staging` **không được gộp, thay thế hoặc repurpose**.
- **Đã có** Admin tạo/sửa SKU bản nháp, nhập XLSX 1 sheet hoặc đối chiếu 8 sheet, popup thêm/sửa/nhóm mẫu; **chưa có** Media Manager R2, cập nhật SKU cũ hàng loạt, xuất bản catalogue thật lên web, app native, nhập kho hay checkout/order end-to-end. Catalogue public chưa được nghiệm thu với sản phẩm thật. Website production đang đọc **Neon staging**, chưa migrate database production.
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

### 4.0. QUYẾT ĐỊNH OWNER 01/11/2026 — RÀ SOÁT DỮ LIỆU BÊN NGOÀI, KHÔNG ĐƯA VÀO APP

**Đây là quyết định bắt buộc cho các PR mới, thay thế các ý tưởng UI rà soát/duyệt nằm trong tài liệu và mockup cũ.**

- **Ngoài ứng dụng:** đối chiếu XNT, bảng giá, tên/quy cách, mã sai hoặc gần giống, barcode, ảnh chưa khớp và giá nguồn bằng file làm việc riêng. Kết quả bàn giao là **một file sản phẩm chuẩn đã xử lý**. Báo cáo ngoại lệ của 613 SKU là dữ liệu nội bộ phục vụ chuẩn hóa **ngoài app**, không phải module Admin.
- **Trong Admin:** tìm kiếm/danh mục → thêm hoặc sửa bằng popup → lưu, import/xuất Excel 1 sheet, quản lý quy cách/đơn vị, nhóm mẫu, ảnh, bật/tắt hiển thị theo kênh. **Không có** bộ lọc “Cần duyệt”, “Cần rà soát”, hàng đợi phê duyệt tên/ảnh từng SKU, nút duyệt/reject mapping, KPI “cần kiểm tra”, bảng danh sách ngoại lệ XNT/PDF hoặc chuỗi trạng thái 4–5 bước. Những trạng thái kỹ thuật cũ có thể được giữ trong database để tương thích nhưng **không trở thành thao tác người dùng**.
- **Chỉ kiểm tra lỗi kỹ thuật trong app:** mã công ty phải giữ nguyên kể cả số 0 đầu (0114 khác 114), mã trùng, cột thiếu, kiểu file sai, xung đột revision/cập nhật, quyền tài khoản. Thông báo chỉ rõ dòng/cột/lý do để sửa file **bên ngoài**, không tạo hàng đợi rà soát trong app. Thiếu ảnh/giá chưa xác minh không cản lưu SKU.
- **Xuất bản tách riêng với nhập:** nhập không tự phát hành. Người quản trị có quyền chủ động bật/tắt hiển thị cho public_web, dealer_app hoặc consumer_app bằng **một thao tác rõ ràng**; backend xác thực quyền, kiểm soát dữ liệu công khai và ghi audit. Không bắt Owner bấm “Duyệt SKU” hoặc “Duyệt ảnh” trước khi bật hiển thị. Các trạng thái approved kỹ thuật nếu cần được xử lý nội bộ ở service, không tạo workflow kiểm duyệt ở UI.
- Không commit workbook có giá NET, XNT hoặc dữ liệu nội bộ sang repo/public API. Lịch sử đối chiếu 613 SKU bên dưới chỉ là hồ sơ nguồn, **không là danh sách tính năng Admin phải làm**.

**Thứ tự làm tiếp — thuộc gói ADM-02 #19 và ADM-05 #41, mỗi hạng mục một PR nhỏ:**

| Ưu tiên | Phạm vi thực hiện | Nghiệm thu |
|---|---|---|
| **P1 — Dọn UI Sản phẩm** | Gỡ “Cần kiểm tra/Cần rà soát”, filter review, tùy chọn trạng thái phức tạp, nhóm thống kê thừa; bảng SKU–tên–ảnh–quy cách–nhóm–hiển thị, tìm kiếm và thao tác ...; Thêm/Sửa/Nhóm mẫu bằng popup. | Thêm/sửa trực tiếp, không form kéo dài xuống trang, không bước rà soát, giữ nguyên SKU; lỗi hiện trong popup. |
| **P2 — Danh mục & thuộc tính** | Danh mục cha/con cho tập HS/SV và VPP/giấy, quy cách khổ/số trang/dòng kẻ/GSM/bìa, barcode, đóng gói, đơn vị tính và quy đổi khi cần. Family là nhóm hiển thị, SKU là mã công ty, mẫu bìa là ảnh của SKU. | Form mặc định chỉ trường chính, thuộc tính ít dùng trong tab phụ. Không tự sinh SKU theo màu/ảnh/thùng nếu không có mã công ty. |
| **P3 — Excel nhập/cập nhật/xuất** | Một template SAN PHAM, một sheet sử dụng hằng ngày; nhập mới, cập nhật SKU cũ theo từng thuộc tính, xuất Excel/CSV, so sánh giá trị cũ → mới, cập nhật có xác nhận một lần; file 8 sheet chỉ để tương thích nguồn lịch sử. | Chọn file → xem thay đổi → lưu; báo lỗi kỹ thuật rõ ràng, không ép 8 sheet hay duyệt ngoại lệ; không ghi đè khi có xung đột. |
| **P4 — Ảnh R2 & nhóm mẫu** | Upload nhiều ảnh, chọn bìa đại diện, sắp xếp/xóa/gắn lại theo mã SKU; gom SKU cùng dòng để chọn khổ/quy cách, một SKU có nhiều mẫu bìa; map ảnh từ file đã chuẩn hóa ngoài app. | Thiếu ảnh được để trống/placeholder; không tự gán ảnh suy luận hoặc sinh SKU phụ; không có hàng đợi duyệt ảnh. |
| **P5 — Hiển thị theo kênh, kết nối web** | Công tắc hiển thị/ẩn cho kênh theo quyền, backend ghi audit; API công khai cho catalogue, lựa chọn mẫu, khổ, quy cách; website cập nhật khi đổi dữ liệu mà không redeploy. | Có thể bật một sản phẩm lên public_web, web thấy đúng mã/ảnh; giá NET/giá hợp đồng và XNT nội bộ không lộ. Không có hai lần phê duyệt. |

**Release gate:** branch → CI xanh → Codex sạch → squash merge; chỉ deploy khi có lệnh thủ công. Không mở issue/roadmap song song. Không mở rộng CMS/giá B2B trước khi P1–P5 hoàn thành.

**Mốc mục tiêu gần nhất:** chuẩn hóa dữ liệu ở ngoài app → nhập SKU công ty qua Excel 1 sheet hoặc popup → bổ sung quy cách/ảnh/nhóm mẫu → chủ động bật hiển thị public_web → sản phẩm thật xuất hiện trên fbmn-web.vercel.app **không cần redeploy khi thêm sản phẩm**.

| Giai đoạn | Gói/issue đang có | Phạm vi và nghiệm thu thực tế |
|---|---|---|
| **1 — Nền tối thiểu** | **ADM-01 [#11](https://github.com/alibaba240185/fbmn/issues/11)** | Admin login, role/editor/publisher, schema kênh + audit, API admin riêng; test 401/403/không tự cấp Admin. Không làm toàn bộ B2B lúc này |
| **2 — Dữ liệu sản phẩm** | **ADM-02 [#19](https://github.com/alibaba240185/fbmn/issues/19)** | Master SKU công ty + family/variant display, tên/quy cách/barcode, nguồn, importer XLSX/CSV, metadata ảnh R2, mapping và publish; test chống trùng/không bịa mã, giữ mã `0114` |
| **3 — Admin catalogue MVP** | **ADM-05 [#41](https://github.com/alibaba240185/fbmn/issues/41)** | Web Admin login + danh mục + popup tạo/sửa SKU + Excel 1 sheet/preview/update/export + nhiều ảnh R2 + bật/tắt hiển thị theo kênh. **Không có hàng đợi rà soát/duyệt sản phẩm trong UI.** Catalogue/media trước, không chờ toàn bộ màn quản trị |
| **4 — Website sản phẩm thật** | **ADM-02 #19 + WEB CONTENT #9 + VISUAL #24** | Trang catalogue, ảnh, nhóm hiển thị/mẫu bìa/khổ/đường kẻ, tìm kiếm, lọc, chi tiết, thông tin chính thức lấy API thật; nghiệm thu một luồng nhập→publish→web |
| **5 — Hoàn thiện nội dung website** | **ADM-03 [#20](https://github.com/alibaba240185/fbmn/issues/20)** và phần CMS của **ADM-05 #41** | **Theo quyết định 0.1/C1–C4:** menu quản trị theo Website → nội dung/vị trí → preview desktop/mobile → xuất bản E2E; giữ backend chung và chuẩn bị phân kênh cho app native sau |
| **6 — Nghiệm thu Website** | **QUALITY #12 + VISUAL #24 + RELEASE #13 + CONTACT #9 + INFRA #2** | Desktop/mobile đúng mẫu, ảnh/thông tin thật, contact E2E, SEO/a11y/performance, release/rollback, owner UAT. HTTP 200/CI xanh chưa phải hoàn thiện catalogue |
| **7 — Mở rộng app sau Website** | **ADM-04 [#40](https://github.com/alibaba240185/fbmn/issues/40)**; các màn Admin nghiệp vụ tương ứng thuộc **ADM-05 #41** | API đại lý/End-user, bảng giá B2B đúng quyền, giỏ/đơn; **frontend iOS/Android native làm về sau**. Không đổi SKU/master data |

**ADM-05 là một issue xuyên suốt:** phần catalogue/media MVP được làm sớm để website có dữ liệu; các màn CMS, giá và đơn chỉ mở sau API ADM-03/04 liên quan. Không mở một issue khác trùng Admin. **Mục 4.0 thay thế yêu cầu UI rà soát/duyệt trong các ghi chú lịch sử.**

### 4.1. Quy tắc bắt buộc cho SKU, ảnh và tên sản phẩm

- **SKU gốc luôn là chuỗi**, lấy chính xác từ bảng giá/công ty, bảo toàn số 0 đầu (`0114`, `0714`), không sinh mã riêng cho website/app khi thêm thủ công, import, mapping ảnh. SKU công ty là khóa nghiệp vụ duy nhất; UUID là khóa hệ thống nội bộ và không được hiển thị như SKU mới.
- **Một SKU có nhiều ảnh/mẫu bìa**, ví dụ `L536-01.png`, `L536-02.png`; phần `-01` là **số thứ tự ảnh**, không phải mã hàng. Ảnh chưa xác minh, ảnh chi tiết/phụ trợ và mẫu bìa phải tách trạng thái/vai trò.
- **Nhóm hiển thị (family)** có thể chứa nhiều SKU khác khổ hoặc dòng kẻ, ví dụ NICE TRAVEL `L536` A5 và `L836` B5 có thể chọn từ một card. Khách chọn khổ → SKU thật thay đổi; chọn ảnh/mẫu bìa trong cùng SKU → không tự sinh SKU mới. Nếu kho không quản lý được mẫu bìa cụ thể, giao diện phải thông báo giao ngẫu nhiên hoặc không cam kết mẫu.
- **Tên chính thức** cần giữ `ten_dong_goc_pdf`/nguyên bản và `ten_san_pham` tổng hợp **riêng biệt**, cho phép sửa trên popup Admin; đối chiếu nguồn thực hiện ở file bên ngoài, không dùng tên ảnh thay tên hàng.
- **Barcode không là unique SKU** (ví dụ 4/5 ô ly có thể trùng barcode); không tự động hợp nhất mã hàng dựa trên barcode.
- **Import và nhập thủ công cùng UPSERT theo SKU công ty** (create/update/unchanged/conflict/error preview). Không ghi đè SKU cũ âm thầm; cần so sánh giá trị cũ/mới, xác nhận cập nhật một lần, revision và audit; không mở luồng rà soát dữ liệu trong app. Ảnh thiếu → báo thiếu, không lấy nhầm ảnh của SKU khác. Media gốc lưu một lần ở R2, gắn nhiều quan hệ ảnh–SKU đúng theo dữ liệu đã đối chiếu bên ngoài.
- **Giá từ bảng nhập** thuộc `source_price` + `source_vat` + `effective_date` và tình trạng xác minh. Không tự suy ra `retail_price`, `NET` hay giá riêng cho từng kênh từ một cột mang nhãn `giá bảng VAT 8%`.

### 4.2. Audit lịch sử — master 228 SKU trước khi nhận XNT ngày 28/10/2026 (KHÔNG còn là phạm vi nhập đầy đủ)

File người dùng cung cấp: `Futurebook_MASTER_SAN_PHAM_VA_ANH_2026.xlsx` (**chưa commit vào GitHub hoặc đưa vào database**; chứa giá nguồn). SHA-256 `0e25ae21ae2b0196dcbe7365b7681e9940f63c82b8bdf1246330c0ea128bc562` để đối chiếu lại nếu nhập sau.

| Chỉ số audit file | Đọc trực tiếp từ sheet |
|---|---|
| `SKU - TEN SAN PHAM` | **228 SKU duy nhất**, 49 HS, 20 SV, 159 VPP/giấy. Tất cả có `ten_san_pham`, nhưng đây là tên tổng hợp PDF cần review; tất cả ở `draft` |
| `ANH - SKU` | **212 dòng liên kết SKU–ảnh**, tương ứng 195 ảnh gốc khác nhau, phân loại 178 dòng `MATCHED` và 34 dòng `SHARED_REVIEW` (17 ảnh gốc dùng 2 mã ứng viên) |
| `ANH CHUA KHOP` | **46 ảnh gốc**: 21 `UNLISTED`, 25 `SUPPORT`; tổng ảnh gốc từ bảng là **241** |
| Bao phủ SKU | 61 SKU có `so_anh_da_gan>0`; 11 SKU chỉ có ảnh ở diện cần duyệt; **156 SKU chưa có ảnh liên kết** |
| Khác | **11 SKU** có số 0 đầu; **6 SKU** thiếu `gia_trong_bang_gia_vat_8pct` (P0041, P0042, P0051, P006, P0081, P0082). Không coi giá nguồn là retail/NET chung |

**HỒ SƠ ĐỐI CHIẾU BÊN NGOÀI — KHÔNG TRIỂN KHAI UI RÀ SOÁT:** lịch sử đối chiếu PDF ghi **40 ảnh có mã khớp trực tiếp** và **138 ảnh được suy luận theo tên/dòng/hình**. Trường `MATCHED` trong sheet hiện **không phân biệt hai mức bằng chứng**; `MATCHED` tuyệt đối **không đồng nghĩa đã duyệt**. Dấu vết nguồn/độ tin cậy thuộc **file đối chiếu bên ngoài**, không tạo nút duyệt/loại hoặc bước nhập trong Admin. 17 ảnh shared-review phải được quản lý như asset gốc duy nhất và liên kết SKU ứng viên có phê duyệt; không phát hành mặc định.

**Đầu vào hình ảnh:** XLSX mới chứa **tên file/đường dẫn trong ZIP**, không chứa bytes của 241 ảnh. Muốn upload R2 phải lấy ZIP ảnh gốc/V3 từ Drive hoặc tải ZIP; không tự cho rằng các tệp đã nằm trong R2. Không sửa hoặc ghi đè ảnh gốc trong Drive. **Mẫu Admin 3 hình cũ chỉ là minh họa**, SKU `FB-VHS-200`, `FB-VHS-200-H`, `FB-VHS-200-X` không thuộc bảng giá và bị cấm import làm SKU thật.

### 4.3. Dữ liệu đầu vào mới đã được hợp nhất: XNT 28/10 + hai bảng giá + media (handoff 29/10/2026)

**Đây là nguồn nhập mới nhất cho ADM-02 [#19](https://github.com/alibaba240185/fbmn/issues/19), thay thế việc hiểu nhầm 228 SKU của master cũ là toàn bộ danh mục.** File 228 SKU vẫn là nguồn lịch sử/bổ sung mapping ảnh và tên sản phẩm. **Nguồn thực tế trên Google Drive FBMN đã được xác nhận có đủ 5 tệp** (không sao chép giá NET/XNT vào Git):

- [Thư mục Drive FBMN](https://drive.google.com/drive/folders/1XIDccMfHrJaYgjKUIRQYZv0NV5Fo3ude)
- [Futurebook_Doi_Chieu_XNT_BangGia_Anh_28102026.xlsx](https://docs.google.com/spreadsheets/d/11dGYkh7e0bPgw1h4X6bss0b-dc1VbXGd/edit) — workbook đối chiếu 8 sheet, **613 SKU hợp nhất**.
- [XNT 2810.xlsx](https://docs.google.com/spreadsheets/d/12u0UeWElt4WRUElJxkoovajtmRbTQ8sa/edit) — XNT thời điểm 28/10/2026, **609 mã**; dùng làm nguồn danh sách mã rộng hơn, dữ liệu tồn chỉ là snapshot.
- [BBG Vở HS-SV 10.04.2026.pdf](https://drive.google.com/file/d/18ZwJGqDeQlrb8wA9bqlkPv_yK_bVdPko/view) — nguồn SKU, barcode, tên dòng, quy cách, giá bảng **đã gồm VAT 8%**.
- [BG NET VPP & SP Giấy 05.10.2026 (update).pdf](https://drive.google.com/file/d/1wWrqxNwktPzNMIxde2URs_vdxoway4i6/view) — nguồn SKU, barcode, quy cách và **bảng NET VPP** (PDF ghi giá bao gồm VAT 8%).
- [OneDrive_1_10-29-2026.zip](https://drive.google.com/file/d/1wKP0WmvKt9UvNVCWHm4V6zLXT_qeLvg3/view) — ZIP ảnh gốc khoảng 153 MB, **chưa khẳng định đã upload lên Cloudflare R2**.

**Số liệu kiểm tra tại thời điểm bàn giao:** XNT 609 mã, master bảng giá 228 mã, trùng 224 mã, **385 mã chỉ trong XNT**, **4 mã chỉ trong bảng giá** (`8384`, `C5921`, `C5981`, `C8921`) → **613 SKU duy nhất**. Không tự động coi 385 mã XNT là hàng đang bán/được xuất bản; phải kiểm tra tình trạng, tên, quy cách, sai code. Có **541 SKU chưa liên kết được ảnh** trong dữ liệu hợp nhất; **cho phép để trống ảnh**, không tạo ảnh giả, không bỏ SKU. Kiểm tra hai mã tồn âm và các trường hợp `Sai Code`. Các mã gần giống `C592`/`C5921` không được tự gộp. `M422` có sai khác mô tả dòng kẻ (XNT Caro / bảng giá Kẻ ngang) phải duyệt. Sáu mã refill `P0041`, `P0042`, `P0051`, `P006`, `P0081`, `P0082` có giá dùng chung trong ô PDF gộp, **không phải chứng cứ giá thiếu**; giữ giá, nguồn và trạng thái xác minh đúng tài liệu gốc.

**Hợp đồng dữ liệu lịch sử (đầu vào; UI mới áp dụng mục 4.0):**
1. SKU = **mã công ty dạng chuỗi**, giữ số 0 đầu; UPSERT idempotent theo SKU, không tạo thêm SKU kiểu FB- hoặc SKU ảnh. Barcode không unique; giữ nguồn tên gốc XNT/bảng giá, tên chuẩn và evidence riêng.
2. Import có preview kỹ thuật **tạo mới / cập nhật / không thay đổi / xung đột / lỗi**. Mã lệch, tồn âm và SKU chỉ có XNT được đối chiếu **bên ngoài app** trước khi tạo file chuẩn; trong app chỉ chặn lỗi kỹ thuật và ghi đè xung đột.
3. Ảnh/media là **nullable**: nếu chưa có ảnh, lưu trống và có thể xuất bản với **placeholder chung trung tính** sau khi tên/quy cách được duyệt. Không gán ảnh của SKU khác; khi bổ sung ảnh, liên kết đúng SKU và không tạo lại sản phẩm.
4. Ảnh trùng hoặc tên suy luận từ ZIP phải được đối chiếu ở file nguồn **bên ngoài app**. Có thể giữ provenance nội bộ để truy vết; không đưa review_status hay các liên kết suy luận vào một hàng đợi duyệt của Admin.
5. **Không công bố giá NET hoặc dữ liệu tồn riêng qua public API.** Giá bán lẻ phải có nguồn/phê duyệt riêng; tách giá bảng, giá NET và giá hiển thị.
6. Bước đầu **chỉ nhập vào Neon staging dưới trạng thái draft**, không ghi production, không tự bật bán, không tự đổi/cắt ảnh nguồn. Admin catalogue MVP tiếp theo là [ADM-05 #41](https://github.com/alibaba240185/fbmn/issues/41); nền Admin Auth ở [ADM-01 #11](https://github.com/alibaba240185/fbmn/issues/11).

**Đối chiếu nguồn thực hiện bên ngoài trước khi nhập dữ liệu:** đọc trực tiếp 5 file trên Drive, tái tính counts và so sánh với workbook đối chiếu, kiểm tra schema XNT và câu hỏi tên/sai code; xuất danh sách create/update/conflict/missing-image. Mọi sai lệch so với các số liệu trên phải báo rõ và cập nhật chính roadmap này bằng PR review. Chi tiết bàn giao và PR đầu tiên ở [#19](https://github.com/alibaba240185/fbmn/issues/19).

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


## Owner 11/11/2026 — Website compact header, Policy, Analytics và CEO
Thứ tự mới trước DL8: DL11A (Header một hàng, logo giữa 3+3 tab, tìm kiếm ngắn, khoảng hở, nút tải app footer) → DL11B (Policy độc lập /policy, không link menu/footer) → DL11C (PostHog Website, tracking không PII) → DL12A (Flutter/Dart CEO PWA, Owner, 5 tab, đọc chat/gia công/liên hệ, chưa đọc) → DL12B (Analytics CEO qua API server) → DL12C (Web Push, badge, deep link, thiết bị hỗ trợ) → DL12D (Vercel riêng fbmn-ceo, ceo.fbmn.vn, test thiết bị thật) → DL8. DL11A chỉ Website UI: bảo toàn sáu URL, search SKU, CTA đại lý, mobile hamburger, popup app và store URL chưa có; CI/Codex + browser 1440/1280/768/390/360 trước release. Không sửa backend/DB/Admin. Các lô sau chưa triển khai.

**DL11A polish — Owner 11/11/2026:** giữ nguyên layout một hàng đã duyệt, tăng khoảng hở trên desktop 20px/mobile 14px, kính trong với viền bắt sáng và bóng nhiều lớp, phản hồi hover/press 190–200ms cho tab/search/CTA/mobile controls và nút tải ứng dụng; giữ reduced motion. Website-only, không đổi dữ liệu hoặc lô tiếp theo.

**DL11A correction — Owner 11/11/2026:** fix collapsed top margin by containing it inside the shared painted backdrop (no white strip), keep header inset 20px/14px; mobile search left, official logo center, hamburger right. Verify home and Gia công at all seven viewport widths; preserve glass/motion and routes.

**DL11B — Owner 11/11/2026:** Policy công khai tại /policy (canonical fbmn.vn), chỉ trang này cho phép index, không menu/footer/link quảng bá, không chatbot/app prompt/CMS popup tại Policy. Mô tả dữ liệu đang thu, nhà cung cấp, lưu trữ, quyền và email yêu cầu xóa; Messenger chưa tích hợp, chưa tuyên bố Meta duyệt. Header sticky 12px desktop/8px mobile khi scroll, giữ khoảng hở ban đầu 20/14px, không đổi menu. Browser QA Policy + sticky desktop/mobile; không migration/backend/Admin.


**CEO-UI01 — Owner 11/11/2026:** Tái thiết kế riêng Flutter CEO: nền tảng card, search/filter và responsive; làm lại Tổng quan, Hội thoại, Gia công, Liên hệ; giữ 5 menu, các dữ liệu thật, read receipt/badge, quyền Owner và API hiện có. Không gộp module gửi nhận mail (CEO-MAIL01) hoặc thay DB/Worker vào lô này. Chi tiết và gate tại `docs/web-ceo-ui01.md`.


**CEO-MAIL01 — 11/11/2026, Owner yêu cầu:** App CEO Liên hệ mở tab con Khách liên hệ / Hộp thư đến / Đã gửi; chức năng soạn và trả lời email thực qua CEO Gateway Owner-only + Resend gửi/nhận domain đã xác minh; chữ ký thương hiệu logo trong suốt, thông tin info@fbmn.vn và Facebook chính thức. Không lưu API key vào Git, không đổi API/DL12E báo đã xem hoặc gửi email tự động, không chạy migration vì lịch sử/trạng thái gửi lưu và đọc từ Resend. Test Flutter/Gateway, CI/Codex PR repo phụ → đồng bộ repo chính → Vercel CEO production.

**CEO-MAIL02 — 12/11/2026, owner feedback:** Bổ sung Web Push cho email mới nhận tại info@fbmn.vn; Resend webhook ký Svix, ghi sự kiện mail ID vào private Neon push queue, Cron hiện hữu phát tới Owner đã đăng ký và click mở đúng thư trong Liên hệ → Hộp thư đến. Không chứa tên/tiêu đề/nội dung thư trong push, không đặt unread badge giả. Có migration riêng để mở rộng event kind; chỉ migration/đăng ký webhook/deploy production khi Owner phê duyệt. Xem docs/web-ceo-mail02-push.md.

**CEO-MAIL03 — Owner 12/11/2026:** Giữ trạng thái Web Push đã đồng ý trên thiết bị khi đóng/mở PWA và đăng nhập lại; vẫn thu hồi subscription khi logout và hủy hẳn khi chọn Tắt. App CEO gửi email mới/trả lời với tối đa 5 file tài liệu/ảnh 3MB tổng qua Resend API thực; giới hạn request Vercel 4,5MB, xác thực Owner, giữ chữ ký/idempotency và không lưu file trong DB. Chi tiết và UAT tại `docs/web-ceo-mail03-push-attachments.md`.

**CEO-NOTIFY04 — Owner 12/11/2026:** Audit Web Push / badge toàn bộ luồng: Cron Worker → Vercel dispatcher → Neon receipts → PWA, chẩn đoán secret, giám sát lỗi. Quy tắc chat 1 lần báo Push khi bắt đầu hoặc quay lại sau 30 phút im lặng (không spam từng lượt), nhưng badge Tin mới xuất hiện bất cứ khi nào có chat mới hơn mốc đã đọc, kể cả hội thoại cũ. Email mới mỗi thư 1 Push + badge chưa đọc, liên hệ/gia công theo read receipts. Bộ đếm toàn hệ thống theo Owner thay cho chỉ trang đầu, tự đồng bộ khi mở lại và định kỳ. Thay tiêu đề AppBar CEO bằng logo FBMN transparent, giữ nhãn điều hướng. Đăng nhập CEO rememberMe=true, lỗi mạng hiển thị kết nối lại thay vì đẩy sang login. Phải bảo toàn Owner gate, không lưu PII trong Push, thêm migration cursor read-through và grant cho push DB role; CI/Codex sạch, deploy riêng Owner approved.

**CEO-PUSH05 — Owner phản hồi 12/11/2026:** Badge CEO tăng nhưng thiết bị không hiện Web Push. Xác minh production bootstrap Flutter 3.47.9 vẫn đăng ký `flutter_service_worker.js` cùng scope `/ceo/`, cạnh tranh `push-sw.js` của CEO; Flutter cleanup SW có hành vi unregister nên cần bỏ đăng ký Flutter SW (custom bootstrap + --pwa-strategy=none trong mọi quy trình build). Push SW chủ động skipWaiting/claim để thay đăng ký cũ. Bổ sung hành động "Thử Push thật" từ Owner device: POST same-origin Owner authenticated, giới hạn endpoint đúng thiết bị đã đăng ký, cooldown 60 giây lưu Neon, payload không PII, VAPID urgency high, báo rõ Push provider accepted khác với SW đã gọi showNotification và xác nhận về trang. UI chỉ hiện nút thử khi Push đã bật. CI kiểm tra Flutter build không còn serviceWorkerSettings, thực hiện migration bổ sung last_test_at trước deploy CEO; UAT bằng iPhone PWA Chrome/desktop, kiểm tra banner khi app nền/đóng chứ không chỉ badge.
