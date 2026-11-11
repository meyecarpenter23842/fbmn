# DL10C — Quản lý hội thoại
Nguồn phạm vi: docs/roadmap.md và quyết định Owner 10/11/2026. Chỉ Website Futurebook.
- Admin Worker lưu câu hỏi và câu trả lời thực tế theo session CX đã băm (không lưu visitor, IP, token, Google response payload); lỗi Google lưu câu hỏi với answer null; lỗi ghi không làm mất phản hồi bot. Redact dạng credential/IP phổ biến trong text.
- Migration thêm hai bảng private, khóa ngoại cascade, index thời gian và tìm kiếm full-text. Chỉ DB role Admin có quyền tối thiểu; không grant public. Owner-only như inbox DL9; chưa cấp thêm vai trò mới.
- Admin relay cùng origin, JWT, no-store; Worker kiểm role và rate limit hiện có. Danh sách 30 phiên/trang; chi tiết 25 lượt/trang. Khoảng ngày theo giờ Việt Nam, tìm theo lần tương tác cuối. Xóa vĩnh viễn phiên và các lượt hiện có; khách tiếp tục chat có thể tạo lại phiên với tin nhắn mới.
- Release: migration thử nghiệm và kiểm quyền/cascade trước production; Admin Worker trước Admin/Website. Public Worker không đổi. Không nghiệm thu cho tới khi test Google thật, lưu, tìm, xóa và xem lại trên live. 


## Owner UX follow-up (11/11/2026)
- Admin inbox uses two independently scrolling panes: conversation list on the left, selected read-only transcript on the right. Mobile switches between list and transcript with a back button.
- Existing keyword/date filters, paging, retry, private Owner authorization and deletion confirmation remain. No API, DB, chatbot or website changes. Conversation row is a selection card rather than a standard fixed-height action button; all action controls retain shared primitives.
- Anonymous guests identified only by existing opaque session prefix; full session stays in the detail header. Customer and chatbot bubbles distinguish sender; no fabricated identity or live agent reply composer.
