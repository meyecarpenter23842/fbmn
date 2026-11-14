import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell, ContentBreadcrumb, PageHeading } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";
import { officialContact as contact } from "@/lib/content/official-contact";

export const metadata: Metadata = { title: "Giới thiệu | Futurebook Miền Nam", description: "Giới thiệu tập vở, sổ và văn phòng phẩm Futurebook Miền Nam.", alternates: { canonical: "/gioi-thieu" },
};
const groups = [
  { title: "Tập học sinh", description: "Tập học sinh theo khổ, số trang và loại bìa." },
  { title: "Tập sinh viên", description: "Các dòng tập phục vụ học tập và ghi chép." },
  { title: "Sổ ghi chép", description: "Sổ ghi chép và các sản phẩm giấy." },
  { title: "Văn phòng phẩm", description: "Văn phòng phẩm phục vụ học tập và công việc." },
];
export default async function AboutPage() {
  const { company } = await getPublicContent();
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Giới thiệu" }]}/>
    <PageHeading eyebrow="FUTUREBOOK MIỀN NAM" title="Giới thiệu Futurebook Miền Nam" intro="Tập vở, sổ và văn phòng phẩm Futurebook Miền Nam."/>
    <section className="content-intro-grid" aria-label="Giới thiệu danh mục">
      <div className="content-intro-panel"><h2>Sản phẩm Futurebook</h2><p>Khám phá danh mục tập vở, sổ và văn phòng phẩm theo nhu cầu học tập, ghi chép và công việc.</p><Link href="/san-pham" className="content-button">Khám phá sản phẩm</Link></div>
      <div className="content-outline-panel"><h2>Thông tin doanh nghiệp</h2>
        {company?.legalName && <p><strong>Đơn vị:</strong> {company.legalName}</p>}
        <p><strong>Địa chỉ:</strong> {contact.address}</p><p><strong>Email:</strong> <a href={contact.emailHref}>{contact.email}</a></p><p><strong>Điện thoại:</strong> <a href={contact.phoneHref}>{contact.phone}</a></p>
      </div>
    </section>
    <section className="content-section" aria-labelledby="groups-heading"><h2 id="groups-heading">Các nhóm sản phẩm</h2><div className="content-card-grid">{groups.map(group => <article className="content-information-card" key={group.title}><h3>{group.title}</h3><p>{group.description}</p></article>)}</div></section>
  </ContentShell>;
}
