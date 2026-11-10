import ContactRequestForm from "@/components/contact-request-form";
import type { Metadata } from "next";
import { ContentShell, ContentBreadcrumb, PageHeading } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";
import { officialContact as contact } from "@/lib/content/official-contact";

export const metadata: Metadata = {
  title: "Liên hệ | Futurebook Miền Nam",
  description: "Liên hệ Futurebook Miền Nam để được tư vấn sản phẩm, báo giá sỉ và hợp tác đại lý.",
};

export default async function ContactPage() {
  const { company } = await getPublicContent();
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Liên hệ" }]}/>
    <PageHeading eyebrow="KẾT NỐI FUTUREBOOK" title="Liên hệ Futurebook Miền Nam" intro="Liên hệ để được tư vấn sản phẩm và hợp tác phân phối."/>
    <section id="thong-tin-lien-he" className="content-intro-grid" aria-label="Thông tin liên hệ, hợp tác đại lý và báo giá sỉ">
      <div className="content-outline-panel">
        <h2>Thông tin liên hệ</h2>
        <address className="content-contact-list">
          {company?.legalName && <p><strong>Đơn vị:</strong> {company.legalName}</p>}
          <p><strong>Địa chỉ:</strong> {contact.address}</p>
          <p><strong>Email:</strong> <a href={contact.emailHref}>{contact.email}</a></p>
          {company?.phone && <p><strong>Điện thoại:</strong> <a href={"tel:" + company.phone.replace(/[^+0-9]/g, "")}>{company.phone}</a></p>}
          {company?.hours && <p><strong>Thời gian làm việc:</strong> {company.hours}</p>}
        </address>
      </div>
      <div className="content-intro-panel">
        <h2>Tư vấn &amp; hợp tác đại lý</h2>
        <ContactRequestForm/>
      </div>
    </section>
  </ContentShell>;
}
