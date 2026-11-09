import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell, ContentBreadcrumb, PageHeading } from "@/components/content-ui";

export const metadata: Metadata = {
  title: "Gia công theo yêu cầu | Futurebook Miền Nam",
  description: "Liên hệ Futurebook Miền Nam để trao đổi nhu cầu sản xuất, gia công tập vở, sổ theo quy cách riêng. Phạm vi và điều kiện sẽ được xác nhận khi tư vấn.",
};

export default function OutsourcingPage() {
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Gia công" }]}/>
    <PageHeading eyebrow="TRAO ĐỔI NHU CẦU" title="Gia công theo yêu cầu"
      intro="Trao đổi nhu cầu gia công và nhận tư vấn theo phạm vi được xác nhận."/>
    <section className="content-intro-grid" aria-label="Liên hệ về gia công">
      <div className="content-intro-panel">
        <h2>Trao đổi yêu cầu gia công</h2>
        <p>Nếu cần sản phẩm theo mẫu bìa, quy cách hoặc số lượng riêng, anh/chị có thể gửi nhu cầu để trao đổi. Khả năng đáp ứng, số lượng tối thiểu, tiến độ và báo giá chỉ được xác nhận khi có thông tin chính thức.</p>
        <Link className="content-button" href="/lien-he#thong-tin-lien-he">
          Xem kênh liên hệ
        </Link>
      </div>
      <div className="content-outline-panel">
        <h2>Chuẩn bị thông tin để được tư vấn</h2>
        <p>Loại sản phẩm mong muốn, khổ, số trang, chất liệu bìa, số lượng dự kiến và yêu cầu riêng (nếu có).</p>
        <p className="content-small-note">Website chưa nhận yêu cầu gia công trực tuyến. Phạm vi dịch vụ, MOQ và thời gian giao hàng chưa được công bố khi chưa có nguồn xác minh.</p>
        <Link className="content-text-link" href="/san-pham">Tham khảo các sản phẩm công khai</Link>
      </div>
    </section>
  </ContentShell>;
}
