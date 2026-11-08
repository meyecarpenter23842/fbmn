import type { Metadata } from "next";
import { ContentShell, ContentBreadcrumb, PageHeading, WaitingForApproval, PromotionPreview } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Khuyến mãi | Futurebook Miền Nam",
  description: "Thông tin chương trình Futurebook Miền Nam được phê duyệt và còn hiệu lực.",
};

export default async function PromotionsPage() {
  const { promotions } = await getPublicContent();
  const listed=promotions.filter(promotion=>!promotion.slot||promotion.slot==="promotions.list");
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Khuyến mãi" }]}/>
    <PageHeading eyebrow="CHƯƠNG TRÌNH" title="Khuyến mãi"
      intro="Các chương trình chỉ hiển thị sau khi được duyệt, trong thời gian có hiệu lực và có đầy đủ nội dung xác minh."/>
    {listed.length ? <section className="content-card-grid" aria-label="Danh sách chương trình">
      {listed.map(promotion => <PromotionPreview promotion={promotion} key={promotion.slug}/>)}
    </section> : <WaitingForApproval title="Chưa có chương trình được công bố">
      Thông tin ưu đãi, mức giảm và thời gian áp dụng sẽ được đăng khi có chính sách chính thức. Không sử dụng giá hoặc chương trình từ bản thiết kế minh họa.
    </WaitingForApproval>}
  </ContentShell>;
}
