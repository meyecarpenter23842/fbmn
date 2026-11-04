import type { Metadata } from "next";
import { CatalogShell, CatalogBreadcrumb, EmptyState } from "@/components/catalog-ui-detail";
import { getPublicCatalog } from "@/lib/catalog/adapter";
import { getProductBySlug } from "@/lib/catalog/query";
import { getPublishedProductImageUrl } from "@/lib/catalog/product-image";
import CatalogueProductOptions from "@/components/catalogue-product-options";
import CatalogueRelatedProducts from "@/components/catalogue-related-products";
import {relatedProducts} from "@/lib/catalog/recommendations";

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
    return src?[{src,alt:media.alt,position:media.position,sku:media.sku}]:[];
  });
  const recommendations=relatedProducts(catalog,product);
  const suggested=recommendations.items.map(item=>{
    // A family card may use a shared published image or its first company's SKU.
    // Never borrow a photo assigned exclusively to another SKU.
    const firstCode=item.variants[0]?.sku;
    const media=item.media.find(m=>m.sku===undefined||m.sku===firstCode);
    const src=media?getPublishedProductImageUrl(media.r2Key,process.env.NEXT_PUBLIC_MEDIA_BASE_URL):null;
    const first=item.variants[0];
    const spec=first?.specifications;
    const detail=item.variants.length>1?item.variants.length+" mã sản phẩm":
      [spec?.pageCount!==undefined?spec.pageCount+" trang":null,spec?.ruling, spec?.paperSize].filter(Boolean).join(" · ");
    return {id:item.id,slug:item.slug,name:item.name,detail,src,alt:media?.alt??item.name};
  });
  return <CatalogShell><div className="catalog-wrap">
    <CatalogBreadcrumb trail={[
      { label: "Sản phẩm", href: "/san-pham" },
      ...(category && category.id!=="p5-uncategorized" && category.name.toLocaleLowerCase("vi")!=="chưa phân loại" ? [{ label: category.name, href: "/danh-muc/" + encodeURIComponent(category.slug) }] : []),
      { label: product.name },
    ]}/>
    <CatalogueProductOptions product={product} photos={images}/>
    <CatalogueRelatedProducts items={suggested} title={recommendations.title}/>
  </div></CatalogShell>;
}
