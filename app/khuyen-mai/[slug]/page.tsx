import type { Metadata } from "next";
import { ContentShell, ContentBreadcrumb, WaitingForApproval, EditorialCover } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";
import {notFound} from "next/navigation";
import {SeoJsonLd} from "@/lib/seo/json-ld";
import {breadcrumbSchema} from "@/lib/seo/structured-data";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [content, { slug }] = await Promise.all([getPublicContent(), params]);
  const item = content.promotions.find(promotion => promotion.slug === slug);
  return item
    ? { title: item.title + " | Futurebook Miền Nam", description: item.summary,
        alternates:{canonical:"/khuyen-mai/"+encodeURIComponent(item.slug)} }
    : { title: "Chương trình chưa công khai | Futurebook Miền Nam", robots: { index: false } };
}
export default async function PromotionDetail({ params }: Props) {
  const [content, { slug }] = await Promise.all([getPublicContent(), params]);
  const item = content.promotions.find(promotion => promotion.slug === slug);
  if(!item)notFound();
  return <ContentShell>
    <SeoJsonLd data={breadcrumbSchema([{name:"Khuyến mãi",path:"/khuyen-mai"},
      {name:item.title,path:"/khuyen-mai/"+encodeURIComponent(item.slug)}])}/>
    <ContentBreadcrumb items={[{ name: "Khuyến mãi", href: "/khuyen-mai" }, { name: item?.title ?? "Chưa công khai" }]}/>
    {item ? <article className="content-story">
      <EditorialCover item={item}/>
      <p className="content-eyebrow">CHƯƠNG TRÌNH ĐÃ PHÊ DUYỆT</p>
      <h1>{item.title}</h1><p className="content-lead">{item.summary}</p>
      <p>{item.detail}</p>
      <p className="content-small-note">Kết thúc: <time dateTime={item.endsAt}>
        {new Date(item.endsAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
      </time></p>
    </article> : <WaitingForApproval title="Chương trình chưa được công khai">
      Chương trình có thể chưa được phê duyệt, chưa đến thời gian diễn ra, đã kết thúc hoặc không tồn tại.
    </WaitingForApproval>}
  </ContentShell>;
}
