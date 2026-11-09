import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell, ContentBreadcrumb, PageHeading } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";

export const metadata: Metadata = {
  title: "Dành cho đại lý | Futurebook Miền Nam",
  description: "Thông tin tham khảo và hướng dẫn liên hệ về hợp tác phân phối Futurebook Miền Nam.",
};

export default async function DealerPage() {
  const { dealerInformation } = await getPublicContent();
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Dành cho đại lý" }]}/>
    <PageHeading eyebrow="HỢP TÁC PHÂN PHỐI" title="Dành cho đại lý"
      intro="Tìm hiểu cách tra cứu sản phẩm và quy trình tiếp nhận thông tin hợp tác khi kênh liên hệ chính thức được xác minh."/>
    <section className="content-intro-grid" aria-label="Thông tin đại lý">
      <div className="content-intro-panel">
        <h2>Khám phá danh mục Futurebook</h2>
        <p>Tra cứu nhóm sản phẩm và quy cách đã được xác minh trên website. Giá NET, giá đại lý, chiết khấu và chính sách theo hợp đồng không được công khai.</p>
        <Link href="/san-pham" className="content-button">Xem sản phẩm</Link>
      </div>
      <div className="content-outline-panel">
        <h2>Chính sách hợp tác</h2>
        {dealerInformation ? <>
          <h3>{dealerInformation.title}</h3>
          {dealerInformation.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <p>{dealerInformation.contactInstructions}</p>
        </> : <p>Chính sách đại lý, khu vực phân phối, điều kiện hợp tác và kênh đăng ký đang chờ phê duyệt. Website chưa công bố mức chiết khấu hoặc cam kết kinh doanh.</p>}
        <Link className="content-text-link" href="/lien-he#thong-tin-lien-he">Thông tin liên hệ dành cho đại lý</Link>
      </div>
    </section>
  </ContentShell>;
}
