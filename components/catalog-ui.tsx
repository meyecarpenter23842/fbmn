import Link from "next/link";
import type { ReactNode } from "react";
import type { ProductGroup, PublicCatalog, PublicProduct } from "@/lib/catalog/schema";
import type { CatalogFilters } from "@/lib/catalog/query";
import { GROUP_LABELS, SORT_OPTIONS, filtersToParams, searchCatalog } from "@/lib/catalog/query";
import { getPublishedProductImageUrl } from "@/lib/catalog/product-image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CatalogProductImage } from "@/components/catalog-product-image";
import { GlassCard, GlassButtonLink } from "@/components/glass-ui";

export function CatalogShell({ children }: { children: ReactNode }) {
  return <>
    <SiteHeader/>
    <main className="catalog-main">{children}</main>
    <SiteFooter />
  </>;
}

export function CatalogBreadcrumb({ trail }: { trail: Array<{ label: string; href?: string }> }) {
  return <nav className="catalog-breadcrumb" aria-label="Đường dẫn">
    <Link href="/">Trang chủ</Link>
    {trail.map(item => <span key={item.label}>
      <span aria-hidden="true"> / </span>
      {item.href ? <Link href={item.href} prefetch={false}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
    </span>)}
  </nav>;
}

export function ProductCard({ product, glass = false }: { product: PublicProduct; glass?: boolean }) {
  const media = product.media[0];
  const image = media ? getPublishedProductImageUrl(media.r2Key, process.env.NEXT_PUBLIC_MEDIA_BASE_URL) : null;
  const label = product.priceLabel ?? (
    product.variants.find(v => v.price)?.price
      ? formatRetail(product.variants.find(v => v.price)!.price!.amountVnd)
      : "Liên hệ báo giá"
  );
  const href = "/san-pham/" + encodeURIComponent(product.slug);
  const content = <>
    <Link className={glass ? "fb-song-related-image" : "catalog-product__image"}
      href={href} prefetch={false} aria-label={"Xem sản phẩm " + product.name}>
      <CatalogProductImage src={image} alt={media?.alt ?? product.name}/>
    </Link>
    <div className={glass ? "fb-song-related-body" : "catalog-product__body"}>
      <h3><Link href={href} prefetch={false}>{product.name}</Link></h3>
      <p>{product.variants.length} quy cách đã xác minh</p>
      <strong className={glass ? "fb-song-related-price" : "catalog-price"}>{label}</strong>
      {glass
        ? <GlassButtonLink variant="secondary" className="fb-song-related-link"
            href={href} prefetch={false}>Xem chi tiết</GlassButtonLink>
        : <Link className="catalog-button catalog-button--small"
            href={href} prefetch={false}>Xem chi tiết</Link>}
    </div>
  </>;
  return glass
    ? <GlassCard hover className="fb-song-related-card">{content}</GlassCard>
    : <article className="catalog-product">{content}</article>;
}

export function formatRetail(amountVnd: number): string {
  return new Intl.NumberFormat("vi-VN").format(amountVnd) + " đ";
}

export function EmptyState({ heading, message, link = "/san-pham" }: {
  heading: string; message: string; link?: string;
}) {
  return <div className="catalog-empty-state" role="status">
    <div className="catalog-empty-state__mark" aria-hidden="true">▤</div>
    <h2>{heading}</h2>
    <p>{message}</p>
    <Link className="catalog-button" href={link}>Xem danh mục sản phẩm</Link>
  </div>;
}

export function CatalogListing({ data, heading, description, filters, actionPath = "/san-pham" }: {
  data: PublicCatalog; heading: string; description: string;
  filters: CatalogFilters; actionPath?: string;
}) {
  const results = searchCatalog(data, filters);
  return <>
    <div className="catalog-page-heading">
      <p className="catalog-overline">DANH MỤC FUTUREBOOK</p>
      <h1>{heading}</h1>
      <p>{description}</p>
    </div>
    <div className="catalog-layout">
      <aside className="catalog-sidebar">
        <form action={actionPath} method="get" className="catalog-filters" role="search" aria-label="Tìm kiếm và lọc sản phẩm">
          <h2>Lọc sản phẩm</h2>
          <label htmlFor="catalog-q">Tìm theo tên hoặc SKU</label>
          <input id="catalog-q" name="q" type="search" defaultValue={filters.q}
            maxLength={80} placeholder="VD: tập A4, vở B5..." />
          <label htmlFor="catalog-group">Nhóm sản phẩm</label>
          <select id="catalog-group" name="nhom" defaultValue={filters.group}>
            <option value="">Tất cả nhóm</option>
            {(Object.entries(GROUP_LABELS) as Array<[ProductGroup, string]>)
              .map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <label htmlFor="catalog-size">Khổ giấy</label>
          <select id="catalog-size" name="kho" defaultValue={results.sizes.includes(filters.size) ? filters.size : ""}>
            <option value="">Tất cả khổ</option>
            {results.sizes.map(size => <option key={size} value={size}>{size}</option>)}
          </select>
          <label htmlFor="catalog-gsm">Định lượng giấy (gsm)</label>
          <select id="catalog-gsm" name="gsm" defaultValue={results.weights.includes(filters.gsm ?? -1) ? String(filters.gsm) : ""}>
            <option value="">Tất cả định lượng</option>
            {results.weights.map(weight => <option key={weight} value={weight}>{weight} gsm</option>)}
          </select>
          <label htmlFor="catalog-sort">Sắp xếp</label>
          <select id="catalog-sort" name="sap-xep" defaultValue={filters.sort}>
            {(Object.entries(SORT_OPTIONS) as Array<[keyof typeof SORT_OPTIONS, string]>)
              .map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <button className="catalog-button" type="submit">Áp dụng bộ lọc</button>
          <Link className="catalog-clear" href={actionPath}>Xóa bộ lọc</Link>
        </form>
      </aside>
      <div className="catalog-results">
        <div className="catalog-results__heading"><h2>Sản phẩm đã xác minh</h2>
          <span>{results.total} sản phẩm</span></div>
        {results.total ? <>
          <div className="catalog-grid">{results.items.map(product => <ProductCard key={product.id} product={product}/>)}</div>
          {results.pages > 1 && <nav aria-label="Phân trang sản phẩm" className="catalog-pagination">
            {results.page > 1 && <Link href={actionPath + "?" + filtersToParams(filters, results.page - 1)} prefetch={false}>Trang trước</Link>}
            <span>Trang {results.page}/{results.pages}</span>
            {results.page < results.pages && <Link href={actionPath + "?" + filtersToParams(filters, results.page + 1)} prefetch={false}>Trang sau</Link>}
          </nav>}
        </> : <EmptyState
          heading={filters.q || filters.size || filters.gsm || filters.group ? "Chưa tìm thấy sản phẩm phù hợp" : "Catalogue đang được cập nhật"}
          message="Chỉ sản phẩm, SKU và hình ảnh có nguồn xác minh mới được hiển thị. Anh/chị có thể thử bộ lọc khác hoặc quay lại sau."
          link="/san-pham" />}
      </div>
    </div>
  </>;
}
