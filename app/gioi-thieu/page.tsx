import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell, ContentBreadcrumb, PageHeading } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";

export const metadata: Metadata = {
  title: "Giới thiệu | Futurebook Miền Nam",
  description: "Khám phá định hướng danh mục Futurebook Miền Nam và các nhóm sản phẩm đang được xác minh.",
};

const groups = [
  { title: "Tập học sinh", description: "Thông tin tập học sinh theo khổ, số trang và loại bìa khi nguồn được xác minh." },
  { title: "Tập sinh viên", description: "Các biến thể phục vụ nhu cầu ghi chép, trình bày theo thông số được duyệt." },
  { title: "Sổ ghi chép", description: "Sổ và dòng sản phẩm giấy được sắp xếp theo danh mục công khai." },
  { title: "Văn phòng phẩm", description: "Nhóm văn phòng phẩm được bổ sung từng SKU sau khi phê duyệt." },
];

export default async function AboutPage() {
  const { company } = await getPublicContent();
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Giới thiệu" }]}/>
    <PageHeading eyebrow="FUTUREBOOK MIỀN NAM" title="Giới thiệu Futurebook Miền Nam"
      intro="Không gian giới thiệu các nhóm tập vở, sổ và văn phòng phẩm. Thông tin sản phẩm chính thức được bổ sung theo nguồn đã xác minh." />
    <section className="content-intro-grid" aria-label="Giới thiệu danh mục">
      <div className="content-intro-panel">
        <h2>Danh mục minh bạch, cập nhật theo nguồn</h2>
        <p>Website ưu tiên thông tin quy cách, hình ảnh và trạng thái sản phẩm được phê duyệt. Các dữ liệu chưa xác minh không được dùng làm thông số bán hàng.</p>
        <Link href="/san-pham" className="content-button">Khám phá sản phẩm</Link>
      </div>
      <div className="content-outline-panel">
        <h2>Thông tin doanh nghiệp</h2>
        {company ? <>
          {company.legalName && <p><strong>Đơn vị:</strong> {company.legalName}</p>}
          {company.address && <p><strong>Địa chỉ:</strong> {company.address}</p>}
        </> : <p>Thông tin pháp lý, địa chỉ và các dữ kiện doanh nghiệp đang chờ đối chiếu tài liệu chính thức.</p>}
      </div>
    </section>
    <section className="content-section" aria-labelledby="groups-heading">
      <h2 id="groups-heading">Các nhóm sản phẩm định hướng</h2>
      <div className="content-card-grid">
        {groups.map(group => <article className="content-information-card" key={group.title}>
          <h3>{group.title}</h3><p>{group.description}</p>
        </article>)}
      </div>
      <p className="content-small-note">Danh mục giới thiệu mang tính phân nhóm; SKU và hình ảnh chỉ hiển thị trên trang sản phẩm sau khi được duyệt.</p>
    </section>
  </ContentShell>;
}
