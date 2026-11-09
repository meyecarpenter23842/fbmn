import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell, ContentBreadcrumb, PageHeading } from "@/components/content-ui";

export const metadata: Metadata = {
  title: "Bảng tin | Futurebook Miền Nam",
  description: "Đi tới tin tức, thông báo và chương trình Futurebook Miền Nam đã được xác minh và xuất bản.",
};

export default function NewsHubPage() {
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Bảng tin" }]}/>
    <PageHeading eyebrow="CẬP NHẬT FUTUREBOOK" title="Bảng tin Futurebook Miền Nam"
      intro="Xem các thông tin và chương trình đã được công bố."/>
    <section className="content-intro-grid" aria-label="Các nhóm nội dung Bảng tin">
      <div className="content-intro-panel">
        <h2>Tin tức & thông báo</h2>
        <p>Thông tin sản phẩm, bài viết và các cập nhật đã được xác minh, phê duyệt xuất bản.</p>
        <Link className="content-button" href="/tin-tuc">Xem tin tức</Link>
      </div>
      <div className="content-outline-panel">
        <h2>Chương trình khuyến mãi</h2>
        <p>Các chương trình đã được công bố và còn hiệu lực. Không hiển thị mức ưu đãi hoặc chính sách chưa được duyệt.</p>
        <Link className="content-button" href="/khuyen-mai">Xem chương trình</Link>
      </div>
    </section>
  </ContentShell>;
}
