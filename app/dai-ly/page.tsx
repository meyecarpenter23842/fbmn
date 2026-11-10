import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell, ContentBreadcrumb, PageHeading } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";

export const metadata: Metadata = {
  title: "Dành cho đại lý | Futurebook Miền Nam",
  description: "Liên hệ hợp tác phân phối Futurebook Miền Nam.",
};

export default async function DealerPage() {
  const { dealerInformation } = await getPublicContent();
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Dành cho đại lý" }]}/>
    <PageHeading eyebrow="HỢP TÁC PHÂN PHỐI" title="Dành cho đại lý"
      intro="Khám phá sản phẩm và liên hệ hợp tác phân phối."/>
    <section className="content-intro-grid" aria-label="Thông tin đại lý">
      <div className="content-intro-panel">
        <h2>Khám phá danh mục Futurebook</h2>
        <p>Tra cứu nhóm sản phẩm và quy cách để chọn hàng phù hợp nhu cầu kinh doanh.</p>
        <Link href="/san-pham" className="content-button">Xem sản phẩm</Link>
      </div>
      <div className="content-outline-panel">
        <h2>Chính sách hợp tác</h2>
        {dealerInformation ? <>
          <h3>{dealerInformation.title}</h3>
          {dealerInformation.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <p>{dealerInformation.contactInstructions}</p>
        </> : <p>Liên hệ Futurebook Miền Nam để trao đổi về khu vực phân phối, báo giá sỉ và điều kiện hợp tác.</p>}
        <Link className="content-text-link" href="/lien-he#thong-tin-lien-he">Thông tin liên hệ dành cho đại lý</Link>
      </div>
    </section>
  </ContentShell>;
}
