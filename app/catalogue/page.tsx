import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell, ContentBreadcrumb, PageHeading } from "@/components/content-ui";

export const metadata: Metadata = {
  title: "Catalogue | Futurebook Miền Nam",
  description: "Tra cứu sản phẩm Futurebook Miền Nam; tài liệu catalogue PDF chính thức sẽ được đăng khi có phiên bản được duyệt.",
};

export default function CatalogueDocumentsPage() {
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Catalogue" }]}/>
    <PageHeading eyebrow="TÀI LIỆU SẢN PHẨM" title="Catalogue Futurebook Miền Nam"
      intro="Tài liệu tham khảo và các nhóm sản phẩm công khai."/>
    <section className="content-intro-grid" aria-label="Catalogue Futurebook">
      <div className="content-intro-panel">
        <h2>Tra cứu danh mục sản phẩm</h2>
        <p>Xem sản phẩm, mã hàng và quy cách được Futurebook công khai. Thông tin được cập nhật theo catalogue sản phẩm đã xuất bản.</p>
        <Link className="content-button" href="/san-pham">Xem sản phẩm</Link>
      </div>
      <div className="content-outline-panel">
        <h2>Catalogue PDF</h2>
        <p>Chưa có tài liệu PDF chính thức được cấu hình để tải trên Website. Phiên bản đã được phê duyệt sẽ được bổ sung tại đây.</p>
        <p className="content-small-note">Không phát hành bảng giá NET, chính sách riêng hoặc file chưa được kiểm tra.</p>
        <Link className="content-text-link" href="/lien-he#thong-tin-lien-he">Liên hệ nhận tư vấn tài liệu</Link>
      </div>
    </section>
  </ContentShell>;
}
