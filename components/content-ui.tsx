import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { PublicArticle, PublicPromotion } from "@/lib/content/schema";

export function ContentShell({ children }: { children: ReactNode }) {
  return <>
    <SiteHeader />
    <main className="content-main"><div className="content-wrap">{children}</div></main>
    <SiteFooter />
  </>;
}

export function ContentBreadcrumb({ items }: {
  items: { name: string; href?: string }[];
}) {
  return <nav className="content-breadcrumb" aria-label="Đường dẫn">
    <Link href="/">Trang chủ</Link>
    {items.map((item, index) => <span key={index}>
      <span aria-hidden="true"> / </span>
      {item.href ? <Link href={item.href}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}
    </span>)}
  </nav>;
}

export function PageHeading({ title }: { eyebrow: string; title: string; intro: string }) {
  // The breadcrumb and actual page content establish visible hierarchy.
  // Preserve an H1 for screen readers without a redundant billboard title.
  return <h1 className="sr-only">{title}</h1>;
}

export function WaitingForApproval({ title, children }: { title: string; children: ReactNode }) {
  return <section className="content-waiting" role="status" aria-label={title}>
    <span aria-hidden="true" className="content-waiting__symbol">▤</span>
    <h2>{title}</h2>
    <p>{children}</p>
    <Link className="content-button" href="/san-pham">Xem danh mục sản phẩm</Link>
  </section>;
}

export function ArticlePreview({ article }: { article: PublicArticle }) {
  return <article className="content-article-card">
    <p className="content-eyebrow">
      <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString("vi-VN", { timeZone: "UTC" })}</time>
    </p>
    <h2><Link href={"/tin-tuc/" + article.slug}>{article.title}</Link></h2>
    <p>{article.summary}</p>
    <Link className="content-text-link" href={"/tin-tuc/" + article.slug}>Đọc bài viết</Link>
  </article>;
}

export function PromotionPreview({ promotion }: { promotion: PublicPromotion }) {
  return <article className="content-article-card">
    <p className="content-eyebrow">CHƯƠNG TRÌNH ĐÃ DUYỆT</p>
    <h2><Link href={"/khuyen-mai/" + promotion.slug}>{promotion.title}</Link></h2>
    <p>{promotion.summary}</p>
    <Link className="content-text-link" href={"/khuyen-mai/" + promotion.slug}>Xem chương trình</Link>
  </article>;
}
