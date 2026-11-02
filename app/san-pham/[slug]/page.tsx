import Link from "next/link";
import type { Metadata } from "next";
import { CatalogShell, CatalogBreadcrumb, EmptyState, formatRetail } from "@/components/catalog-ui-detail";
import { getPublicCatalog } from "@/lib/catalog/adapter";
import { getProductBySlug } from "@/lib/catalog/query";
import { getPublishedProductImageUrl } from "@/lib/catalog/product-image";
import PublishedImageGallery from "@/components/published-image-gallery";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [catalog, { slug }] = await Promise.all([getPublicCatalog(), params]);
  const product = getProductBySlug(catalog, slug);
  return product
    ? { title: product.name + " | Futurebook Miền Nam",
      description: product.description ?? "Thông tin sản phẩm Futurebook đã được xác minh." }
    : { title: "Sản phẩm chưa công khai | Futurebook Miền Nam", robots: { index: false } };
}

export default async function ProductPage({ params }: Props) {
  const [catalog, { slug }] = await Promise.all([getPublicCatalog(), params]);
  const product = getProductBySlug(catalog, slug);
  if (!product) return <CatalogShell><div className="catalog-wrap">
    <CatalogBreadcrumb trail={[{ label: "Sản phẩm", href: "/san-pham" }, { label: "Chi tiết" }]}/>
    <EmptyState heading="Sản phẩm chưa được công khai"
      message="Sản phẩm này chưa được xác minh hoặc chưa được xuất bản. Không có dữ liệu hay giá mẫu được hiển thị."/>
  </div></CatalogShell>;
  const category = catalog.categories.find(item => item.id === product.categoryId);
  const images=product.media.flatMap(media=>{
    const src=getPublishedProductImageUrl(media.r2Key,process.env.NEXT_PUBLIC_MEDIA_BASE_URL);
    return src?[{src,alt:media.alt}]:[];
  });
  return <CatalogShell><div className="catalog-wrap">
    <CatalogBreadcrumb trail={[
      { label: "Sản phẩm", href: "/san-pham" },
      ...(category ? [{ label: category.name, href: "/danh-muc/" + encodeURIComponent(category.slug) }] : []),
      { label: product.name },
    ]}/>
    <div className="catalog-detail">
      <PublishedImageGallery items={images}/>
      <div className="catalog-detail__info">
        <p className="catalog-overline">THÔNG TIN SẢN PHẨM ĐÃ XÁC MINH</p>
        <h1>{product.name}</h1>
        {product.description && <p className="catalog-detail__description">{product.description}</p>}
        <p className="catalog-detail__count">Có {product.variants.length} quy cách đã xác minh</p>
        <p className="catalog-detail__price">{product.priceLabel ?? "Giá bán lẻ theo quy cách bên dưới"}</p>
        <Link href="/#contact" className="catalog-button">Liên hệ báo giá</Link>
        <p className="catalog-detail__policy">Giá NET, giá đại lý và giá theo hợp đồng không công khai trên website.</p>
      </div>
    </div>
    <section className="catalog-variants" aria-labelledby="variant-heading">
      <h2 id="variant-heading">Thông số và biến thể</h2>
      <div className="catalog-variant-list">
        {product.variants.map(variant => <article className="catalog-variant" key={variant.sku}>
          <h3>{variant.name}</h3>
          <p className="catalog-variant__sku">Mã SKU: <strong>{variant.sku}</strong></p>
          <dl>
            {variant.specifications.paperSize && <><dt>Khổ</dt><dd>{variant.specifications.paperSize}</dd></>}
            {variant.specifications.pageCount !== undefined && <><dt>Số trang</dt><dd>{variant.specifications.pageCount}</dd></>}
            {variant.specifications.paperWeightGsm !== undefined && <><dt>Định lượng</dt><dd>{variant.specifications.paperWeightGsm} gsm</dd></>}
            {variant.specifications.coverFinish && <><dt>Bìa</dt><dd>{variant.specifications.coverFinish}</dd></>}
            {variant.specifications.binding && <><dt>Đóng gáy</dt><dd>{variant.specifications.binding}</dd></>}
            {variant.specifications.packaging && <>
              <dt>Đơn vị bán</dt><dd>{variant.specifications.packaging.saleUnit}</dd>
              {variant.specifications.packaging.unitsPerPack !== undefined && <><dt>Đơn vị/gói</dt><dd>{variant.specifications.packaging.unitsPerPack}</dd></>}
              {variant.specifications.packaging.unitsPerCarton !== undefined && <><dt>Đơn vị/thùng</dt><dd>{variant.specifications.packaging.unitsPerCarton}</dd></>}
            </>}
          </dl>
          <p className="catalog-variant__price">
            {variant.price?.kind === "retail" ? formatRetail(variant.price.amountVnd) : "Liên hệ báo giá"}
          </p>
        </article>)}
      </div>
    </section>
  </div></CatalogShell>;
}
