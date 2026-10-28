# Quy trình phát hành Futurebook Miền Nam

- Vercel project: **fbmn-web**, ID `prj_PlxssxAIqvTWCgOzX2SAc81dRCGq`.
- GitHub repository: `alibaba240185/fbmn`. Không kết nối Git integration Vercel để tránh tự deploy.
- Repository `order` giữ nguyên.

## Thiết lập một lần
1. Vào GitHub repo `fbmn` → Settings → Secrets and variables → Actions → tạo `VERCEL_TOKEN`. **Không gửi token qua chat hoặc issue**.
2. Settings → Environments: tạo `preview` và `production`, thiết lập required reviewers cho `production`. Nếu GitHub cho phép, giới hạn branch `main` cho `production`.
3. Settings → Rulesets/Branches: bảo vệ `main`, require CI status `quality`, review trước merge, chặn direct push. Các tính năng tùy theo gói GitHub.
4. Chỉ triển khai từ GitHub Actions; Vercel project không bật Git auto deployments.

## Release
- Mỗi thay đổi dùng branch → PR → chờ CI xanh → review → merge.
- Sau khi workflow này được merge vào `main`, owner comment **chính xác** `/deploy preview` trên PR đang mở, được tạo từ chính repo, đã có CI thành công trên SHA đó.
- Sau khi PR merge và CI trên `main` xanh, owner comment `/deploy production` trên PR đã merge. Workflow **chỉ stage** bằng `--skip-domain`, không tự promote domain thật; PR phát hành (#13) sẽ bổ sung promotion sau UAT.
- SHA, môi trường, người gọi và deployment URL được ghi trong GitHub Actions summary.
- Không log JWT, cookie, DB passwords, R2 access keys.

## Hạn chế hiện tại
- Đây là nền tảng PR 00, chưa có UI chính thức.
- Vì môi trường chuẩn bị mã nguồn không truy cập được npm registry, chưa tạo/kiểm chứng `package-lock.json`; CI dùng `npm install` với phiên bản dependencies trực tiếp được pin. Trước release chính thức phải bổ sung lockfile và chuyển sang `npm ci`.
- Để preview chạy, repo phải có `VERCEL_TOKEN` hợp lệ. Không có secret thì deployment sẽ dừng an toàn.
