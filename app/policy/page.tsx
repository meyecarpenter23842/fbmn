import type { Metadata } from "next";
import { officialContact as contact } from "@/lib/content/official-contact";
import { GlassPanel } from "@/components/glass-ui";
import "./policy.css";

export const metadata: Metadata = {
  title: "Chính sách bảo mật | Futurebook Miền Nam",
  description: "Chính sách bảo mật và hướng dẫn yêu cầu xóa dữ liệu của Futurebook Miền Nam.",
  alternates: { canonical: "https://fbmn.vn/policy" },
  robots: { index: true, follow: true },
};

export default function PolicyPage() {
  return <main className="fb-policy">
    <GlassPanel className="fb-policy__document">
      <p className="fb-policy__brand">FUTUREBOOK MIỀN NAM</p>
      <h1>Chính sách bảo mật</h1>
      <p>Cập nhật: <time dateTime="2026-11-11">11/11/2026</time></p>
      <p>Chính sách này giải thích cách Futurebook Miền Nam xử lý thông tin khi anh/chị sử dụng website fbmn.vn, gửi yêu cầu liên hệ hoặc gia công, trò chuyện với chatbot Website và tương tác với dịch vụ hỗ trợ của Futurebook trên Facebook/Messenger khi dịch vụ đó được kết nối.</p>
      <h2>1. Đơn vị phụ trách và phạm vi</h2>
      <p>Futurebook Miền Nam phụ trách việc tiếp nhận và xử lý thông tin khách hàng nhằm hỗ trợ sản phẩm, hợp tác đại lý và báo giá gia công. Địa chỉ: {contact.address}. Email: <a href={contact.emailHref}>{contact.email}</a>.</p>
      <h2>2. Thông tin được thu thập</h2>
      <ul>
        <li>Liên hệ: tên, doanh nghiệp (nếu cung cấp), email hoặc số điện thoại, tỉnh/thành, nhóm khách hàng, sản phẩm quan tâm và nội dung yêu cầu.</li>
        <li>Gia công: tên, email, số điện thoại (nếu cung cấp), loại sản phẩm, quy cách, số lượng, thời gian mong muốn và nội dung cần báo giá.</li>
        <li>Chatbot Website: câu hỏi, câu trả lời, thời điểm và mã phiên kỹ thuật. Lịch sử được lưu với mã phiên đã băm để người quản lý đọc và hỗ trợ khách hàng. Không cần đăng nhập để trò chuyện.</li>
        <li>Thông tin kỹ thuật: địa chỉ IP và thông tin yêu cầu mạng có thể được xử lý để vận hành, bảo mật và chống lạm dụng. Website sử dụng bộ nhớ trình duyệt để ghi nhận thời điểm thông báo tải ứng dụng và giới hạn hiển thị popup.</li>
        <li>Facebook/Messenger: khi tích hợp được kích hoạt và anh/chị chủ động nhắn tin, Futurebook có thể nhận mã định danh người dùng theo Trang, nội dung tin nhắn, thời gian và thông tin hồ sơ mà Meta cho phép cung cấp. Futurebook không yêu cầu mật khẩu Facebook. Kết nối chatbot Messenger chưa được kích hoạt tại thời điểm cập nhật chính sách này.</li>
      </ul>
      <h2>3. Mục đích và căn cứ xử lý</h2>
      <p>Thông tin được sử dụng để trả lời câu hỏi, tư vấn sản phẩm, tiếp nhận và theo dõi yêu cầu báo giá/gia công, liên hệ hợp tác, chăm sóc khách hàng, vận hành an toàn và giải quyết khiếu nại. Biểu mẫu yêu cầu xác nhận đồng ý trước khi gửi. Việc xử lý dựa trên sự đồng ý, yêu cầu của anh/chị và các căn cứ hợp pháp khác theo quy định áp dụng. Futurebook không bán dữ liệu cá nhân hoặc sử dụng dữ liệu Messenger cho mục đích không liên quan đến hỗ trợ đã nêu.</p>
      <h2>4. Chia sẻ và lưu trữ</h2>
      <p>Thông tin được lưu trong hệ thống quản lý Futurebook (Neon). Nhà cung cấp hạ tầng như Vercel và Cloudflare hỗ trợ vận hành website và API; nội dung câu hỏi chatbot Website được chuyển đến Google Dialogflow CX để tạo phản hồi. Meta xử lý thông tin trên Facebook/Messenger theo chính sách của Meta. Dữ liệu có thể được xử lý trên hạ tầng ngoài Việt Nam; Futurebook thực hiện các biện pháp bảo vệ và nghĩa vụ pháp luật áp dụng.</p>
      <p>Chỉ người quản lý được phân quyền và nhà cung cấp cần thiết để vận hành dịch vụ được tiếp cận thông tin theo phạm vi công việc. Futurebook có thể cung cấp thông tin khi pháp luật yêu cầu. Không công khai nội dung hội thoại hoặc thông tin liên hệ của khách hàng trên website.</p>
      <h2>5. Thời gian lưu và bảo mật</h2>
      <p>Thông tin được giữ trong thời gian cần thiết để xử lý yêu cầu, duy trì quan hệ khách hàng, giải quyết tranh chấp hoặc đáp ứng nghĩa vụ pháp lý. Không có thời hạn lưu tự động cố định cho mọi loại hồ sơ; khi không còn cần thiết, Futurebook sẽ xóa hoặc loại bỏ khả năng nhận dạng theo quy định. Hệ thống sử dụng HTTPS, phân quyền quản trị, giới hạn yêu cầu và cơ chế bảo vệ dữ liệu. Không gửi mật khẩu, thông tin thanh toán hoặc giấy tờ định danh qua chatbot.</p>
      <h2>6. Quyền của anh/chị</h2>
      <p>Anh/chị có thể yêu cầu biết, truy cập, sửa, xóa hoặc hạn chế xử lý thông tin cá nhân, rút lại sự đồng ý, phản đối xử lý hoặc thực hiện các quyền khác theo pháp luật áp dụng. Việc rút lại đồng ý không ảnh hưởng đến tính hợp pháp của xử lý trước đó. Futurebook sẽ xác minh yêu cầu và phản hồi theo quy định; một số dữ liệu có thể phải giữ lại khi có nghĩa vụ pháp lý.</p>
      <h2 id="data-deletion">7. Hướng dẫn yêu cầu xóa dữ liệu (User Data Deletion)</h2>
      <ol>
        <li>Gửi email tới <a href="mailto:info@fbmn.vn?subject=Yeu%20cau%20xoa%20du%20lieu">info@fbmn.vn</a> với tiêu đề “Yêu cầu xóa dữ liệu cá nhân”.</li>
        <li>Nêu kênh đã liên hệ (Website hoặc Facebook/Messenger), tên hoặc thông tin liên hệ đã dùng, thời điểm gần đúng và dữ liệu muốn xóa. Không gửi mật khẩu hoặc mã OTP.</li>
        <li>Futurebook xác minh quyền yêu cầu bằng thông tin tối thiểu cần thiết, xử lý xóa dữ liệu thuộc phạm vi quản lý và thông báo kết quả. Nếu cần giữ một phần dữ liệu theo luật, Futurebook giải thích lý do và phạm vi lưu.</li>
      </ol>
      <p>Yêu cầu xóa có thể gửi ngay cả khi không có tài khoản Website. Với Messenger, xóa dữ liệu tại Futurebook không đồng nghĩa xóa mọi bản sao do Meta lưu; anh/chị có thể quản lý tin nhắn và dữ liệu Meta qua cài đặt tài khoản Facebook của mình.</p>
      <h2>8. Thay đổi chính sách</h2>
      <p>Futurebook cập nhật chính sách khi thay đổi cách xử lý dữ liệu, bao gồm trước khi triển khai tích hợp Messenger hoặc thống kê hành vi Website mới. Phiên bản hiện hành được công bố tại địa chỉ này. Mọi câu hỏi về quyền riêng tư vui lòng gửi email <a href={contact.emailHref}>{contact.email}</a>.</p>
    </GlassPanel>
  </main>;
}
