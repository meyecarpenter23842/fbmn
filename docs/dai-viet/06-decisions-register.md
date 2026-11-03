# 06 — QUYẾT ĐỊNH / OPEN QUESTIONS / CHANGE LOG
Ngày cập nhật: 03/11/2026. Chỉ cập nhật CHỐT khi có chỉ đạo mới rõ ràng của Owner.

## A. ĐÃ CHỐT
| ID | Quyết định | Ghi chú |
|---|---|---|
| D01 | Đại Việt là website bán lẻ/web app riêng | Không sao chép Fahasa/Phương Nam |
| D02 | Phong cách hiện đại + sinh động | Modern & Playful |
| D03 | Đỏ chủ đạo thương hiệu Đại Việt | Không dùng navy/coral làm màu chính |
| D04 | Chung repo alibaba240185/fbmn | Mỗi app build/deploy độc lập |
| D05 | Dùng chung Futurebook Admin hiện có | Tuyệt đối không xây Admin thứ hai |
| D06 | Bộ quy tắc Core dùng chung, theme brand riêng | Futurebook tím giữ nguyên, Đại Việt đỏ |
| D07 | Chat/Project mới bắt buộc đọc master + scoped AGENTS trước khi làm | Chưa đọc thì không code |
| D08 | Không sửa giao diện/giá/logic Futurebook do thêm Đại Việt | Scope isolation |
| D09 | Toast nhỏ cố định góc trên phải và component/motion theo contract | Lỗi validation sát trường nhập |

## B. ĐỀ XUẤT, CHƯA DUYỆT
| ID | Chủ đề | Tạm đề xuất / blocker |
|---|---|---|
| O01 | Mã đỏ chính xác | #C62828 chỉ là draft, lấy màu chính xác từ logo/file gốc |
| O02 | Logo, chữ thương hiệu, slogan | Chưa có asset chính thức được xác nhận |
| O03 | Domain Đại Việt và Vercel project name | Chưa xác minh |
| O04 | Mobile bottom nav | Chưa chốt; mặc định không thêm |
| O05 | Giá bán lẻ Đại Việt, VAT, chương trình giảm | Chờ bảng giá và chính sách được phê duyệt |
| O06 | Kho chung hay riêng và dữ liệu tồn | Chưa chốt |
| O07 | Giao hàng, COD, bank, cổng thanh toán, phạm vi giao | Chưa chốt; không code checkout thật khi thiếu |
| O08 | Khách đăng nhập/guest, địa chỉ, thông báo đơn | Chưa chốt |
| O09 | Phạm vi sách, ISBN, publisher data và ảnh | Chưa được cung cấp đầy đủ |
| O10 | Liên kết Fanpage Simple Life, Shopee, đồng bộ đa sàn | Quan hệ sở hữu và quyền API chưa được xác minh kỹ thuật |
| O11 | Loyalty/PWA/voucher/đánh giá | Giai đoạn sau, cần Owner duyệt riêng |

## C. KỶ LUẬT THAY ĐỔI
Mọi quyết định mới phải thêm ngày, nội dung, phạm vi UI/API/DB, người duyệt và tác động đến lô; cập nhật 00-master-plan, docs tương ứng và kiểm thử. Không để chat cũ và chat mới có hai “bản chuẩn” song song. Nếu thay quyết định về giá/checkout/security, chặn release cho đến khi test xong.

## D. TIẾN ĐỘ
DV-00: tài liệu đang xây dựng trên branch chuyên biệt, chỉ gọi đã merge sau khi PR/CI/review thật xác nhận.
DV-01..DV-08: chưa thực hiện ở thời điểm khởi tạo tài liệu này; phải được cập nhật bằng link PR/commit có thật.
