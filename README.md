# Futurebook Miền Nam — Website

Website-first: Next.js App Router + TypeScript. Repo `order` đang tạm dừng, không bị thay đổi. Giao diện chuẩn mẫu desktop/mobile được triển khai ở các PR sau.

## Khởi chạy
Yêu cầu Node.js 22+.

```sh
npm install
npm run dev
```

Truy cập http://localhost:3000. Đây chỉ là website foundation, không phải phiên bản thương mại đã duyệt.

## Kiểm thử
```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Quy trình
- [Kế hoạch #1](https://github.com/alibaba240185/fbmn/issues/1)
- [PR 00 issue #2](https://github.com/alibaba240185/fbmn/issues/2)
- CI: `.github/workflows/ci.yml`
- Deploy comment: `.github/workflows/deploy-comment.yml`
- [Hướng dẫn release](docs/release.md)

Vercel `fbmn-web`: không Git auto deploy. Backend dùng Cloudflare Workers / Neon sau; ảnh dùng R2.

Không đăng giá NET, dữ liệu cá nhân hoặc thông tin chưa xác minh. Ảnh mẫu giao diện không phải nguồn giá/hotline chính thức.

**Chú ý:** vì môi trường khởi tạo chưa truy cập npm registry nên chưa có `package-lock.json`; CI dùng `npm install`, cần bổ sung lockfile rồi dùng `npm ci` trước production.
