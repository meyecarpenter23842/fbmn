import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell, ContentBreadcrumb, PageHeading, WaitingForApproval, ArticlePreview } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tin tức | Futurebook Miền Nam",
  description: "Tin tức và thông báo Futurebook Miền Nam.",
};

export default async function NewsPage() {
  const { articles } = await getPublicContent();
  // Featured posts remain available in the full category, as the CMS placement promises.
  const listed=articles;
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Tin tức" }]}/>
    <nav className="news-hub-back"><Link href="/bang-tin">← Trở lại Bảng tin</Link></nav>
    <PageHeading eyebrow="THÔNG TIN & CẬP NHẬT" title="Tin tức Futurebook"
      intro="Tin tức và thông báo mới nhất từ Futurebook Miền Nam."/>
    {listed.length ? <section className="content-card-grid" aria-label="Danh sách tin tức">
      {listed.map(article => <ArticlePreview article={article} key={article.slug}/>)}
    </section> : <WaitingForApproval title="Tin tức đang được cập nhật">
      Hiện chưa có bài viết. Tin tức mới sẽ được cập nhật tại đây.
    </WaitingForApproval>}
  </ContentShell>;
}
