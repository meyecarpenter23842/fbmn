# SEO06-OAUTH — Kết nối Google Search Console ngay trong CEO

Ngày: 14/11/2026 — Thay cơ chế file Service Account JSON bị chặn bởi Google Cloud policy `iam.disableServiceAccountKeyCreation` bằng OAuth 2.0 web server; không yêu cầu tắt policy.

## Trải nghiệm Owner
1. CEO → **Thống kê → SEO → Kết nối Google**.
2. CEO Gateway xác thực Owner với Worker; trả đường dẫn Google consent sau khi phát cookie OAuth ngắn hạn HttpOnly + Secure + SameSite=Lax.
3. Trình duyệt chuyển đến Google OAuth, Owner chọn tài khoản có quyền Search Console của `fbmn.vn`, chấp nhận **chỉ quyền đọc Search Console**.
4. Google trả authorization code về callback **https://ceo.fbmn.vn/api/ceo/gsc/oauth/callback**. Gateway xác thực lại Owner dựa vào session cookie, giải mã và đối chiếu state/PKCE/Owner/TTL 10 phút; trao đổi code ở phía server và xác minh property.
5. Mã refresh token được lưu **AES-256-GCM ciphertext** trong Neon private table, theo từng Owner subject. Không gửi token hoặc JSON credentials xuống Flutter. Callback chỉ redirect về CEO → tab Thống kê → SEO với status đơn giản; không lộ code hay token.
6. Sau đó Google Search Console API trả các số liệu SEO06 7/30/90 ngày như trước. Khi access token hết hạn, Gateway xin token mới bằng refresh token; tất cả vẫn Owner-only. Nút **Ngắt kết nối** yêu cầu xác nhận, xóa grant trong Neon và yêu cầu Google revoke; không ảnh hưởng PostHog/PH01/PH02.

## Việc Owner cần làm trên Google Cloud
- Project đã bật **Google Search Console API**, không cần thêm API key và không cần tải Service Account JSON.
- Google Auth Platform (hoặc APIs & Services) → **Branding**: tạo OAuth consent screen. Chọn External nếu tài khoản Gmail cá nhân; cấu hình tên ứng dụng **Futurebook Miền Nam**, email hỗ trợ và email liên hệ. Khi app ở Testing, thêm Gmail Owner vào Test users; Google refresh token ở Testing có thể hết hạn sau 7 ngày. Chọn production/publish khi đáp ứng yêu cầu Google.
- **Clients → Create client → Application type Web application**, tên `Futurebook CEO Search Console`.
- Authorized JavaScript origins: **https://ceo.fbmn.vn**
- Authorized redirect URIs: **https://ceo.fbmn.vn/api/ceo/gsc/oauth/callback** (**phải trùng chính xác**, không thêm dấu / cuối).
- Scope `https://www.googleapis.com/auth/webmasters.readonly` (không dùng scope webmasters đầy đủ).
- Property Search Console đã có quyền truy cập Google Owner: `sc-domain:fbmn.vn` hoặc `https://www.fbmn.vn/`, chọn đúng property khi cấu hình.
- Google cấp **OAuth Client ID** và **OAuth Client Secret** (khác với Service Account). Không gửi secret vào chat, không lưu GitHub.

## Vercel production (project `fbmn-ceo`)
Tạo biến server-only bằng Vercel Settings → Environment Variables → Production:
- `FBMN_CEO_GSC_SITE_URL` = `sc-domain:fbmn.vn` (nếu đúng Domain property; hoặc `https://www.fbmn.vn/` nếu đúng URL-prefix).
- `FBMN_CEO_GSC_OAUTH_CLIENT_ID` = OAuth Web client ID (Google).
- `FBMN_CEO_GSC_OAUTH_CLIENT_SECRET` = OAuth Web client secret (Sensitive).
- `FBMN_CEO_GSC_OAUTH_ENCRYPTION_KEY` = 32 bytes ngẫu nhiên, dạng **64 ký tự hex**. Tạo offline an toàn (ví dụ `node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"` chạy trên máy cá nhân), chỉ lưu ở Vercel; **không đưa giá trị vào chat hoặc repo**.
- Tiếp tục sử dụng `FBMN_CEO_PUSH_DATABASE_URL` hiện có, role `fbmn_ceo_push_login`; không dùng credentials owner DB.
- Không tạo `FBMN_CEO_GSC_SERVICE_ACCOUNT_JSON`, code mới không còn phụ thuộc JSON.

## Neon migration (phê duyệt Owner riêng)
- `backend/neon/migrations/20261114_seo06_gsc_oauth.up.sql`: tạo `fbmn_catalog_private.ceo_gsc_oauth_grants` chỉ `owner_subject`, `ciphertext` AES-GCM, `updated_at`; grant DML cho role đã có; revoke PUBLIC. Không ghi email Search Console, query/PII, access token.
- `...down.sql`: xóa bảng **và grant**, không chạy nếu chưa có phê duyệt. Kiểm thử migration trên nhánh Neon phụ trước production; kiểm tra quyền truy cập đúng.
- Kết nối chỉ hoạt động sau **migration approved + Vercel env saved + CEO production deployed**, không tự thực hiện bất kỳ thay đổi production nào trong lô lập trình này.

## Kiểm soát
- Cổng Owner guard phía server ở start/status/callback/report; POST start và DELETE disconnect check Origin. Không nhận callback token từ Flutter, code/secret không vào URL redirect CEO.
- OAuth state PKCE S256, nonce ngẫu nhiên, state-cookie mã hóa ràng buộc Owner và 10 phút; callback kiểm tra chủ thể đăng nhập lại với Neon Owner.
- Scope chỉ `webmasters.readonly`, xác nhận quyền property qua Google `GET /webmasters/v3/sites`; callback từ chối nếu sai property hoặc thiếu refresh token.
- Refresh token mã hóa AES-GCM, private Neon; lỗi Google hoặc DB hiển thị lỗi kết nối, không làm chết tab PostHog.
- Session và Google token không được ghi log, querystring URL hoặc PostHog.
- Redirect `https://ceo.fbmn.vn/ceo/index.html?tab=4&gsc=connected|error|permission|login|cancelled`, cố định, không open redirect.
- Cần xác nhận Google OAuth cookie Better Auth hoạt động trên trình duyệt thật sau khi deploy, **chưa có kiểm chứng với tài khoản Google của Owner**.

## Test & bàn giao
- Node: client config/property whitelist; state nonce + PKCE + expires + Owner binding; encrypt/decrypt & tamper detection; exchange/refresh scope readonly; property check; status, origin và callback guard; DB migration permission.
- Flutter: 360/390/1280px, OAuth button ở chưa kết nối, không nhầm GSC với PostHog, disconnect xác nhận, OAuth start URL domain pinned, callback tự mở Thống kê → SEO.
- PR CI/Gateway/Flutter + Codex xanh, squash merge repo phụ, đồng bộ repo chính bằng fast-forward sau kiểm tra Git tree. Không deploy hay migrate production khi chưa được Owner cho phép.
