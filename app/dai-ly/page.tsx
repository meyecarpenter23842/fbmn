import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell, ContentBreadcrumb, PageHeading } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";

export const metadata: Metadata = {
  title: "Hợp tác đại lý tập vở, văn phòng phẩm | Futurebook Miền Nam",
  description: "Tìm hiểu hợp tác đại lý, nhà phân phối tập học sinh, tập sinh viên, sổ ghi chép và văn phòng phẩm Futurebook. Gửi nhu cầu từ TP.HCM và miền Tây.",
  alternates: { canonical: "/dai-ly" },
};

export default async function DealerPage() {
  const { dealerInformation } = await getPublicContent();
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Dành cho đại lý" }]}/>
    <PageHeading eyebrow="HỢP TÁC PHÂN PHỐI" title="Dành cho đại lý"
      intro="Tìm hiểu danh mục tập vở, sổ ghi chép và văn phòng phẩm Futurebook để trao đổi nhu cầu phân phối."/>
    <section className="content-intro-grid" aria-label="Thông tin đại lý">
      <div className="content-intro-panel">
        <h2>Khám phá danh mục Futurebook</h2>
        <p>Tra cứu tập học sinh, tập sinh viên, sổ ghi chép và văn phòng phẩm theo nhóm sản phẩm, mã SKU, khổ giấy và số trang đã công khai.</p>
        <Link href="/san-pham" className="content-button">Xem sản phẩm</Link>
        <p>Muốn tìm nguồn tập vở hoặc nhà phân phối văn phòng phẩm tại TP.HCM và các tỉnh miền Tây?
         Anh/chị có thể gửi khu vực dự kiến, nhóm hàng quan tâm và phương thức liên hệ để được trao đổi trực tiếp.</p>
      </div>
      <div className="content-outline-panel">
        <h2>Chính sách hợp tác</h2>
        {dealerInformation ? <>
          <h3>{dealerInformation.title}</h3>
          {dealerInformation.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <p>{dealerInformation.contactInstructions}</p>
        </> : <p>Liên hệ Futurebook Miền Nam để trao đổi về khu vực phân phối, báo giá sỉ và điều kiện hợp tác.</p>}
        <Link className="content-text-link" href="/lien-he#thong-tin-lien-he">Thông tin liên hệ dành cho đại lý</Link>
        <p>Chính sách giá, chiết khấu, khu vực phân phối và điều kiện hợp tác chỉ được xác nhận trong trao đổi riêng; thông tin trên Website không phải báo giá hoặc cam kết giao hàng.</p>
      </div>
    </section>
  </ContentShell>;
}
