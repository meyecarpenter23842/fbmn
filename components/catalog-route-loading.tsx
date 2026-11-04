import { CatalogShell } from "./catalog-ui";

const Skeleton = ({ className }: { className: string }) =>
  <span aria-hidden="true" className={"catalog-skeleton " + className} />;

export function CatalogListLoading() {
  return <CatalogShell><div className="catalog-wrap catalog-route-loading"
      role="status" aria-label="Đang tải danh mục sản phẩm" aria-busy="true">
    <Skeleton className="catalog-loading-breadcrumb"/>
    <div className="catalog-loading-heading">
      <Skeleton className="catalog-loading-title"/>
      <Skeleton className="catalog-loading-subtitle"/>
    </div>
    <div className="catalog-layout">
      <aside className="catalog-sidebar"><div className="catalog-loading-filters">
        <Skeleton className="catalog-loading-filter-title"/>
        {Array.from({length:4},(_,i)=><Skeleton key={i} className="catalog-loading-field"/>)}
      </div></aside>
      <div className="catalog-results">
        <div className="catalog-results__heading"><Skeleton className="catalog-loading-title"/></div>
        <div className="catalog-grid">
          {Array.from({length:6},(_,i)=><div className="catalog-product catalog-loading-card" key={i}>
            <Skeleton className="catalog-loading-card__photo"/>
            <Skeleton className="catalog-loading-card__text"/>
            <Skeleton className="catalog-loading-card__subtext"/>
            <Skeleton className="catalog-loading-card__button"/>
          </div>)}
        </div>
      </div>
    </div>
  </div></CatalogShell>;
}

export function CatalogDetailLoading() {
  return <CatalogShell><div className="catalog-wrap catalog-route-loading"
      role="status" aria-label="Đang tải chi tiết sản phẩm" aria-busy="true">
    <Skeleton className="catalog-loading-breadcrumb"/>
    <div className="catalog-detail">
      <Skeleton className="catalog-loading-detail-photo"/>
      <div className="catalog-loading-detail-copy">
        <Skeleton className="catalog-loading-title"/>
        <Skeleton className="catalog-loading-subtitle"/>
        <Skeleton className="catalog-loading-subtitle"/>
        <Skeleton className="catalog-loading-detail-cta"/>
      </div>
    </div>
  </div></CatalogShell>;
}
