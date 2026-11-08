import type { Metadata } from "next";
import { ContentShell, ContentBreadcrumb, PageHeading, WaitingForApproval, ArticlePreview } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tin tức | Futurebook Miền Nam",
  description: "Tin tức và thông báo Futurebook Miền Nam đã được xác minh và duyệt xuất bản.",
};

export default async function NewsPage() {
  const { articles } = await getPublicContent();
  const listed=articles.filter(article=>!article.slot||article.slot==="news.list");
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Tin tức" }]}/>
    <PageHeading eyebrow="THÔNG TIN & CẬP NHẬT" title="Tin tức Futurebook"
      intro="Chỉ đăng tải bài viết có nguồn rõ ràng, đã được kiểm tra và phê duyệt trước khi công khai."/>
    {listed.length ? <section className="content-card-grid" aria-label="Danh sách tin tức">
      {listed.map(article => <ArticlePreview article={article} key={article.slug}/>)}
    </section> : <WaitingForApproval title="Tin tức đang được cập nhật">
      Chưa có bài viết nào đã được duyệt xuất bản. Website không hiển thị bài đăng hoặc ngày tháng giả lập.
    </WaitingForApproval>}
  </ContentShell>;
}
