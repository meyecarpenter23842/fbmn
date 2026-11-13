import type { Metadata } from "next";
import { ContentShell, ContentBreadcrumb, WaitingForApproval, EditorialCover } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";
import {notFound} from "next/navigation";
import {SeoJsonLd} from "@/lib/seo/json-ld";
import {articleMetadata,articleSchema,breadcrumbSchema} from "@/lib/seo/structured-data";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [content, { slug }] = await Promise.all([getPublicContent(), params]);
  const item = content.articles.find(article => article.slug === slug);
  return item
    ? articleMetadata(item)
    : { title: "Tin chưa công khai | Futurebook Miền Nam", robots: { index: false } };
}
export default async function NewsDetail({ params }: Props) {
  const [content, { slug }] = await Promise.all([getPublicContent(), params]);
  const item = content.articles.find(article => article.slug === slug);
  if(!item)notFound();
  return <ContentShell>
    <SeoJsonLd data={articleSchema(item)}/>
    <SeoJsonLd data={breadcrumbSchema([{name:"Tin tức",path:"/tin-tuc"},
      {name:item.title,path:"/tin-tuc/"+encodeURIComponent(item.slug)}])}/>
    <ContentBreadcrumb items={[{ name: "Tin tức", href: "/tin-tuc" }, { name: item?.title ?? "Chưa công khai" }]}/>
    {item ? <article className="content-story">
      <EditorialCover item={item}/>
      <p className="content-eyebrow"><time dateTime={item.publishedAt}>
        {new Date(item.publishedAt).toLocaleDateString("vi-VN", { timeZone: "UTC" })}</time></p>
      <h1>{item.title}</h1><p className="content-lead">{item.summary}</p>
      {item.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </article> : <WaitingForApproval title="Bài viết chưa được công khai">
      Bài viết có thể chưa được xác minh, chưa được duyệt hoặc không tồn tại.
    </WaitingForApproval>}
  </ContentShell>;
}
