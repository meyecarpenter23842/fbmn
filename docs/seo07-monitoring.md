# SEO07 — Giám sát biến động Google Search Console

Phạm vi: CEO Gateway + Flutter SEO tab và UI filter/sticky tab; không đổi OAuth, PostHog, Neon, Website, Admin hoặc Worker.

- Dùng GSC Web Search dữ liệu **final**, kỳ 7/30/90 ngày PT kết thúc cách hiện tại 3 ngày, đối chiếu **kỳ liền trước cùng số ngày, không chồng lấn**. API hiện hành /api/ceo/search-console Owner-only truy vấn 4 lần kỳ hiện tại và 3 lần kỳ trước, dựa trên refresh token đang có, không cần kết nối lại.
- KPI tăng/giảm: số click, impression, thay đổi CTR theo điểm phần trăm, cải thiện thứ hạng = vị trí kỳ trước - vị trí kỳ hiện tại (dương tốt). Không chia cho 0 hoặc giả tăng/giảm khi Google không trả dữ liệu.
- Từ khóa / trang: chỉ so sánh các mục có trong **cả hai top 10** đã lọc bảo mật; có trong một kỳ được ghi 'Mới trong top 10' / 'Không còn trong top 10', không coi mục vắng là 0 và không tuyên bố từ khóa mới xuất hiện trên Google. Không log/công khai PII, token, URL Admin/CEO hoặc querystring.
- UI sticky: ngày và refresh cuộn đi, **thanh tab con** pinned trong vùng scroll Thống kê khi cuộn tới, bên dưới header CEO, giữ đúng 36/44px, tab màu lavender + underline tím. Lọc ngày thấp hơn 2-row card trước, không giảm vùng bấm 44px trên mobile. Có chú giải về tính không đầy đủ của top GSC.
- Nghiệm thu: Node tests 7/30/90 previous windows, schema/PII, zero denominator; Flutter model & widget, sliver pinned scroll tại 360/390/1280; CI/Codex review sạch; đồng bộ Git tree repo chính và deploy CEO theo Owner đã yêu cầu. Dữ liệu thật đối chiếu trực tiếp trong Search Console mới được xem là UAT hoàn thành.
