# 03 — QUY TRÌNH LÀM VIỆC / CI / PR / HANDOFF

## 1. BẮT BUỘC VỚI MỌI CHAT MỚI
Trước khi sửa, trợ lý phải:
1. Đọc AGENTS.md, apps/dai-viet/AGENTS.md và toàn bộ tài liệu 00..07 trong docs/dai-viet/.
2. Đọc nguồn hiện tại của main, xác định version, PR/Issue đang mở và phụ thuộc API/Admin.
3. Tóm tắt trong 5–10 dòng: lô đang làm, đã có/chưa có, tài liệu/rule nào áp dụng, files dự kiến chạm, rủi ro Futurebook, test/release.
4. Không đoán là Owner đã duyệt màu hex/logo/domain/cách bán chỉ vì có bản mockup.
5. Không hỏi lại các quyết định đã chốt tại decision log; điều chưa chốt mà không chặn việc lập plan thì ghi giả định và tiếp tục.

## 2. Vòng đời một lô
- SPEC: chọn đúng mã DV-xx từ master; kiểm tra issue/PR hiện hữu, không lập issue trùng.
- DESIGN: xác định responsive, states, acceptance, token/component, API/security, ảnh và nội dung có nguồn.
- BRANCH: từ main mới nhất, branch chuyên biệt. Không push thẳng main; tránh đụng đồng thời các file Admin có PR khác.
- IMPLEMENT: mỗi PR một mục tiêu có thể review; thay primitive chung khi cần và test mọi consumer.
- TEST: lint/typecheck/unit/integration/contract/build, UI 360/390/768/1280/1440, test keyboard, reduced motion, dữ liệu/permission.
- REVIEW: mở PR có scope, screenshots thật với thay đổi UI, rủi ro data, CI green, yêu cầu Codex review sạch tại exact HEAD.
- MERGE: chỉ squash merge khi CI+review đạt, branch không stale/conflict, phạm vi rõ.
- RELEASE: Vercel deploy *thủ công theo yêu cầu Owner*, dùng project phù hợp. Chỉ chạy migration/Worker khi thay đổi thật và có hướng dẫn backup/rollback.
- UAT: Owner test bằng sản phẩm và tài khoản hợp lệ; ghi công việc còn lại. Không coi CI xanh là UAT xong.
- HANDOFF: cập nhật 06-decisions-register.md, master progress, link issue/PR/commit/run, môi trường deploy, UAT pending, việc tiếp.

## 3. Checklist PR bắt buộc
- [ ] Có link DV-xx và tài liệu spec; chặn scope creep.
- [ ] Đã đọc AGENTS gốc, scoped và master plan; nêu trường hợp ngoại lệ.
- [ ] Không ảnh hưởng layout/brand Futurebook; không tạo Admin thứ hai.
- [ ] Screenshot runtime trước/sau desktop/mobile nếu có UI.
- [ ] Component đúng kích thước, màu theo brand, motion, toast, modal/drawer.
- [ ] Skeleton/empty/error/offline/disabled/no-results/long-text.
- [ ] Không có giá NET/PII/token trong frontend, logs, source map công khai và PostHog.
- [ ] SKU dạng string, barcode duplicate safe, giá từ channel + price list đúng quyền.
- [ ] Tests thực chạy và CI xanh; Codex review sạch đúng HEAD, no unresolved.
- [ ] Release plan, rollback, owner UAT chưa/đã (có bằng chứng).
- [ ] Không tự sửa workflow production/deploy/cấu hình Admin ngoài scope.

## 4. Nguyên tắc cập nhật docs
- 00 master là roadmap duy nhất của Đại Việt, không tạo nhiều bản kế hoạch rời rạc trái nhau.
- 06 decision log là nơi theo dõi chốt/chưa chốt; chỉ đánh dấu CHỐT khi user đã quyết.
- Mỗi PR thay nghiệp vụ/UX phải cập nhật doc cùng PR; thông tin thực tế đã merge phải mang link bằng chứng.
- Nếu Owner đổi quy tắc: sửa nguồn gốc phù hợp trước, cập nhật tests và consumers; không thêm lớp CSS override cuối file.
- New ChatGPT Project không tự được đồng bộ AGENTS GitHub vào hướng dẫn của ChatGPT: Owner cần dán nội dung 07 handoff vào Project instructions; mỗi chat phải đọc repo thực bằng GitHub.

## 5. Bàn giao cuối mỗi lượt
Báo theo form: mục tiêu | branch/PR | commit SHA | CI | review | merge | deploy môi trường | Owner UAT | blocker | kế tiếp. Không báo “xong” nếu chưa có evidence. Không giả vờ đã thử trên thiết bị hoặc đã chạy production nếu chưa làm.

## 6. Không làm các hành động sau khi chưa được duyệt
- Deploy production, migration DB thật, cập nhật giá hoặc đơn thật.
- Kết nối với Facebook/Shopee/đơn vị vận chuyển, mở quyền OAuth/API hoặc nhập dữ liệu khách.
- Tự bật payment gateway, analytics recording nội dung nhạy cảm.
- Đổi logo, giá, địa chỉ, hotline hay hình ảnh theo phỏng đoán.
