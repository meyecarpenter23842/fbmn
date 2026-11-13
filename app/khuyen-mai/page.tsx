import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell, ContentBreadcrumb, PageHeading, WaitingForApproval, PromotionPreview } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Khuyến mãi | Futurebook Miền Nam",
  description: "Các chương trình khuyến mãi Futurebook Miền Nam.",
  alternates: { canonical: "/khuyen-mai" },
};

export default async function PromotionsPage() {
  const { promotions } = await getPublicContent();
  // Featured campaigns also belong to the public promotions category.
  const listed=promotions;
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Khuyến mãi" }]}/>
    <nav className="news-hub-back"><Link href="/bang-tin">← Trở lại Bảng tin</Link></nav>
    <PageHeading eyebrow="CHƯƠNG TRÌNH" title="Khuyến mãi"
      intro="Các chương trình khuyến mãi hiện hành của Futurebook Miền Nam."/>
    {listed.length ? <section className="content-card-grid" aria-label="Danh sách chương trình">
      {listed.map(promotion => <PromotionPreview promotion={promotion} key={promotion.slug}/>)}
    </section> : <WaitingForApproval title="Chưa có chương trình được công bố">
      Thông tin ưu đãi, mức giảm và thời gian áp dụng sẽ được đăng khi có chính sách chính thức. Không sử dụng giá hoặc chương trình từ bản thiết kế minh họa.
    </WaitingForApproval>}
  </ContentShell>;
}
