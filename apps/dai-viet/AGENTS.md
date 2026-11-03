# AGENTS — NHÀ SÁCH ĐẠI VIỆT (phạm vi apps/dai-viet/**)
TRẠNG THÁI: tài liệu chỉ dẫn, chưa có runtime app ở DV-00.

## MỆNH LỆNH READ-FIRST CHO MỌI CHAT / AI
TUYỆT ĐỐI KHÔNG CODE/THIẾT KẾ/ĐỔI RULE TRƯỚC KHI ĐỌC:
1. ../../AGENTS.md (global, bảo mật/release).
2. ../../docs/dai-viet/README.md (điểm vào).
3. ../../docs/dai-viet/00-master-plan.md (ROADMAP DUY NHẤT — BẮT BUỘC).
4. ../../docs/dai-viet/01-design-system.md (đỏ, token, UI/UX).
5. ../../docs/dai-viet/02-architecture-data.md (Admin chung, data isolation).
6. ../../docs/dai-viet/03-delivery-workflow.md (CI/PR/review/UAT).
7. ../../docs/dai-viet/04-page-specifications.md, 05-acceptance-security.md, 06-decisions-register.md và 07-new-project-handoff.md.
8. ../../docs/futurebook-ui-contract.md chỉ để kế thừa phần CORE hành vi/kích thước; không kế thừa màu tím cho Đại Việt.

Sau khi đọc, kiểm main/PR/Issue thật rồi báo lô DV-xx, acceptance và rủi ro. Không tin rằng nội dung từ một chat cũ là phiên bản mới nhất.

## BRAND & UI KHÔNG THỂ NHẦM
- Đại Việt là theme ĐỎ hiện đại + sinh động, mặc định token đỏ đề xuất #C62828 chờ logo xác nhận. Không dùng purple #6D249E làm primary Đại Việt.
- Futurebook/Admin giữ tím hoàn toàn, không sửa UI hiện tại để “đồng bộ” Đại Việt.
- Core shared: nút desktop 36px, mobile 44px; field 40px, font control 13px, radius 8–10px; toast nhỏ trên phải, form drawer/modal, nút/menu/modal/drawer motion 180–200/180–220/280 mở/220 đóng/300ms; toast riêng 220/190ms.
- Không copy root website CSS/Admin CSS; dùng scoped tokens semantic theo brand; không patch bằng file override.
- Trạng thái đầy đủ, keyboard, reduced motion, ảnh thật và screenshot runtime; giữ quyết định bottom nav Đại Việt ở trạng thái CHƯA CHỐT.

## DATA / ADMIN
- Cùng một Admin apps/admin/**, không tạo Admin thứ hai.
- SKU, media có thể chia sẻ; giá retail, channel visibility, publish, đơn hàng và RBAC phân biệt Đại Việt.
- Không hiển thị NET, dealer price, personal data hoặc đưa giá từ PDF thành retail nếu chưa có phê duyệt.
- Không tự sinh mã danh mục/nhóm mẫu; SKU là TEXT giữ 0 đầu.

## GIAO HÀNG
- Mọi PR phải nêu lô từ master, CI xanh, Codex review sạch, screenshot thật nếu UI, security regression và Owner UAT.
- Merge squash khi gate đạt, không auto deploy; production chỉ khi Owner yêu cầu.
- Cập nhật master + decisions và bàn giao chat mới bằng file 07.
