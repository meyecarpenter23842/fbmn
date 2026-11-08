# Futurebook Website — quy tắc UI bắt buộc

**Áp dụng:** Website Futurebook trong `app/**` và các component Website; không áp theme tím sang Admin hoặc storefront khác.

## READ FIRST — trước mọi PR UI
1. [Root AGENTS.md](../AGENTS.md).
2. [UI Contract chung](../docs/futurebook-ui-contract.md) — geometry, controls, modal, toast, motion, accessibility.
3. [Website Premium Purple Glass V2.0](../docs/web-component-design-system.md) — **nguồn chuẩn visual Website hiện hành theo quyết định Owner 08/11/2026**.
4. [Tài liệu bố cục đã duyệt](../docs/ui-system.md) và [roadmap duy nhất](../docs/roadmap.md).

## Website UI-only
- **Visual V2 chủ đạo là glassmorphism trong suốt** trên lớp ảnh nền decorative được cấu hình từ Cloudflare R2 (khi có URL hợp lệ), fallback lavender gradient khi không có ảnh.
- Chỉ sửa skin/card/button/chip/typography/spacing/shadow/border/blur/motion, không đổi business logic, SKU, variant, giá, routing, SEO, API, DB, auth, nội dung hoặc cấu trúc navigation đã duyệt.
- Không dùng ảnh AI/mockup làm ảnh sản phẩm. SKU/ảnh/quy cách phải lấy từ public data hợp lệ.
- Một bộ token và primitive dùng chung. **Không vá CSS rải rác, không đè !important tràn lan, không thêm framework UI tùy hứng**.
- Card glass dùng radius 20–28px; CTA/chip riêng của Website có thể dạng pill. Button thường 36px desktop / 44px mobile; input 40px; chữ control >=13px; radius field/control thường 8–10px. Giữ màu tím Futurebook và ngoại lệ CTA đỏ trang chủ đã duyệt.
- Motion: button 180–200ms; menu 180–220ms; hover card translateY 2–4px; focus/active/disabled rõ; `prefers-reduced-motion`. Không làm blur animate liên tục.
- Blur chỉ khi hữu ích, có fallback nếu `backdrop-filter` không hỗ trợ; chữ WCAG AA, không nền rối phía sau thông tin quan trọng. Ảnh sản phẩm phải sắc nét, đúng màu.
- Website mobile **không có bottom dock/navigation**; giữ responsive và các chức năng hiện hành, không dùng hiệu ứng đè CTA/selector/footer.
- Background URL phải đến từ cấu hình public đã có; nếu thiếu contract API thì báo thiếu và dùng fallback, **không tự sửa schema DB/API**.

## Chất lượng và phát hành
- Thực hiện trang Song Natural trước, chốt UI bằng screenshot desktop/mobile thực (1440, 1280, 768, 390, 360px) và test gallery/SKU/CTA; sau đó rollout các trang khác.
- Kiểm npm lint/typecheck/test/build; không lỗi hydration, keyboard focus, overflows hoặc suy giảm LCP/CLS đáng kể.
- Branch → PR repo phát triển → CI xanh → Codex review sạch → squash merge → đồng bộ local và repo chính theo quy trình; **không deploy production nếu Owner chưa cho phép**.
- PR tài liệu chỉ thay quy chuẩn; không tuyên bố UI runtime đã được sửa nếu chưa có PR code và screenshot nghiệm thu.
