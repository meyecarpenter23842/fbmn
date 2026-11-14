import ContactRequestForm from "@/components/contact-request-form";
import type { Metadata } from "next";
import { ContentShell, ContentBreadcrumb, PageHeading } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";
import { officialContact as contact } from "@/lib/content/official-contact";

export const metadata: Metadata = {
  title: "Liên hệ | Futurebook Miền Nam",
  description: "Liên hệ Futurebook Miền Nam để được tư vấn sản phẩm, báo giá sỉ và hợp tác đại lý.",
  alternates: { canonical: "/lien-he" },
};

export default async function ContactPage() {
  const { company } = await getPublicContent();
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Liên hệ" }]}/>
    <PageHeading eyebrow="KẾT NỐI FUTUREBOOK" title="Liên hệ Futurebook Miền Nam" intro="Liên hệ để được tư vấn sản phẩm và hợp tác phân phối."/>
    <section id="thong-tin-lien-he" className="content-intro-grid" aria-label="Thông tin liên hệ, hợp tác đại lý và báo giá sỉ">
      <div className="content-outline-panel content-outline-panel--contact">
        <h2>Thông tin liên hệ</h2>
        <address className="content-contact-list">
          {company?.legalName && <p><strong>Đơn vị:</strong> {company.legalName}</p>}
          <p><strong>Địa chỉ:</strong> {contact.address}</p>
          <p><strong>Email:</strong> <a href={contact.emailHref}>{contact.email}</a></p>
          <p><strong>Điện thoại:</strong> <a href={contact.phoneHref}>{contact.phone}</a></p>
          {company?.hours && <p><strong>Thời gian làm việc:</strong> {company.hours}</p>}
        </address>
        <div className="content-location-map" aria-label="Bản đồ vị trí Futurebook Miền Nam">
          <iframe
            title="Bản đồ tìm kiếm địa chỉ Futurebook Miền Nam"
            src={`https://www.google.com/maps?q=${encodeURIComponent(contact.address)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer"
            allowFullScreen
          />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
            target="_blank"
            rel="noopener noreferrer"
          >Xem địa chỉ trên Google Maps <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <div className="content-intro-panel">
        <h2>Tư vấn &amp; hợp tác đại lý</h2>
        <ContactRequestForm/>
      </div>
    </section>
  </ContentShell>;
}
