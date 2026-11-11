# DL12D — CEO deploy qua comment trên GitHub Issue #72

Đường dẫn Issue điều khiển: https://github.com/meyecarpenter23842/fbmn/issues/72

Lệnh chính xác (comment một dòng):
- /deploy ceo preview
- /deploy ceo production

GitHub Actions: DL12D CEO deploy by Owner issue comment.

Cần comment vào Issue #72 của repo phát triển, KHÔNG comment ở PR. Chỉ hai tài khoản Owner alibaba240185 và meyecarpenter23842 được phép khởi động.

Bảo vệ: workflow trên main kiểm tra đúng issue, người ra lệnh, dev/main là squash merge PR được CI bắt buộc và Codex review sạch, dev/main CI push xanh, mã cây Git của hai repo main trùng nhau. Chỉ checkout commit được duyệt; kiểm tra lại trước dùng token và trước deploy. Vercel project cố định fbmn-ceo.

Build Flutter Web, lint/test gateway, ghép cả hai trong một origin, dùng Vercel CLI từ thư mục GỐC repo. Không deploy Website/Admin/Worker, không chạy migration hay PostHog.

Điều kiện: GitHub Actions secret VERCEL_TOKEN phải có trong repo phát triển; nếu không, workflow dừng rõ lỗi. Không copy token vào issue hay chat. Kết quả URL của release nằm ở Actions job summary. Domain ceo.fbmn.vn do Owner thêm trên Vercel.

Sau khi workflow merge vào main, có thể dùng comment thật để test. CI/unit test không thay thế được kiểm chứng việc nhận event và quyền truy cập secret thật.

Nếu GITHUB_TOKEN của repo phát triển không đọc được repo chính (HTTP 404), workflow chỉ chấp nhận biên nhận đồng bộ qua comment của chủ repo phụ trên Issue #72. Biên nhận gắn chính xác SHA dev/main, SHA upstream/main và tree SHA giống nhau, do trợ lý ghi sau khi trực tiếp kiểm tra cả hai repo. Không có biên nhận tương ứng thì dừng; biên nhận là bằng chứng đối soát tại thời điểm tạo, không thay thế kiểm tra live nếu quyền đọc upstream đã có.
