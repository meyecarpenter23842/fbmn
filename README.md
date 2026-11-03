# Futurebook Miền Nam

**Một backend dùng chung cho Website + App Đại lý/NPP + App End-user.** Website đang chạy; app native iOS/Android sẽ phát triển phần frontend về sau. Backend admin đa kênh hiện đang ở giai đoạn lập kế hoạch.

## Quy chuẩn UI bắt buộc cho mọi chat/AI/PR

Trước mọi công việc liên quan đến giao diện Futurebook, đọc [root AGENTS.md](AGENTS.md) và [Futurebook UI Contract](docs/futurebook-ui-contract.md). Đây là quy chuẩn chung cho nút (36px desktop, 44px mobile), input/dropdown (40px), chữ điều khiển (13px), bo góc (8–10px), điểm nhấn tím, header bảng lavender nhạt, toast góc trên phải và popup/drawer cho form tạo/sửa. CI có kiểm thử hợp đồng UI; không tự deploy.

## Kế hoạch & GitHub Issues

- **[Roadmap duy nhất](docs/roadmap.md)** — scope, kênh, phân quyền, ưu tiên, điều kiện nghiệm thu và release.
- **[Master tracking issue #1](https://github.com/alibaba240185/fbmn/issues/1)** — chỉ mục liên kết các issue thực thi, không là roadmap thứ hai.
- Backend/Admin mới: ADM-01 [#11](https://github.com/alibaba240185/fbmn/issues/11), ADM-02 [#19](https://github.com/alibaba240185/fbmn/issues/19), ADM-03 [#20](https://github.com/alibaba240185/fbmn/issues/20), ADM-04 [#40](https://github.com/alibaba240185/fbmn/issues/40), ADM-05 [#41](https://github.com/alibaba240185/fbmn/issues/41).
- [Thiết kế kỹ thuật Admin/CMS](docs/admin-console-roadmap.md) — chỉ tài liệu tham khảo, không sinh PR plan khác.

## Chạy và kiểm thử website

Yêu cầu Node.js 22+:

```sh
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Production Website: https://fbmn-web.vercel.app. Public Worker staging: `futurebook-mien-nam-public-api-staging`; Website production hiện sử dụng API này để đọc **Neon staging**, không phải database production thương mại. Danh mục/sản phẩm công khai hiện chưa có data đã duyệt.

## Nguyên tắc phát hành

- Branch → PR → CI xanh → Codex Review → merge; deploy Vercel **thủ công theo lệnh**, không bật Git auto-deploy. Xem [hướng dẫn release](docs/release.md) và [issue #2](https://github.com/alibaba240185/fbmn/issues/2) cho phần gating còn cần kiểm thử.
- Web mobile không có bottom navigation kiểu native. Không tự tạo giá NET, sản phẩm, khuyến mãi, hình ảnh hoặc claim từ mockup.
- Giá NET/khách hàng/đơn hàng chỉ qua API xác thực đúng kênh và quyền. Repo `order` nằm ngoài phạm vi dự án này.
