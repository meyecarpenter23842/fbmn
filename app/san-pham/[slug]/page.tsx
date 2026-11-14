import type { Metadata } from "next";
import Link from "next/link";
import { CatalogShell, CatalogBreadcrumb } from "@/components/catalog-ui-detail";
import { getPublicCatalog } from "@/lib/catalog/adapter";
import { getProductBySlug } from "@/lib/catalog/query";
import { getPublishedProductImageUrl } from "@/lib/catalog/product-image";
import CatalogueProductOptions from "@/components/catalogue-product-options";
import CatalogueRelatedProducts from "@/components/catalogue-related-products";
import {relatedProducts} from "@/lib/catalog/recommendations";
import WebInterestView from "@/components/web-interest-view";
import {notFound,permanentRedirect} from "next/navigation";
import {SeoJsonLd} from "@/lib/seo/json-ld";
import {productMetadata,productSeoDescription,productLandingPageSchema,breadcrumbSchema,productApprovedSeoImages} from "@/lib/seo/structured-data";
import {productSeoImageAlt} from "@/lib/seo/content-strategy";
import {getPublishedSeo,seoFor,applySeoSetting} from "@/lib/seo/public-settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{sku?:string|string[]}> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const [catalog,{slug},seo]=await Promise.all([getPublicCatalog(),params,getPublishedSeo()]);
 const product=getProductBySlug(catalog,slug);
 // Resolve missing public products before metadata streams a 200 response.
 if(!product)notFound();
 return applySeoSetting(productMetadata(product,catalog.categories.find(c=>c.id===product.categoryId)),
  seoFor(seo,"product",product.slug),productApprovedSeoImages(product));
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [catalog, { slug }, query] = await Promise.all([getPublicCatalog(), params, searchParams]);
  const product = getProductBySlug(catalog, slug);
  if(!product)notFound();
  const selectedSku=typeof query.sku==="string" && query.sku.length<=100 &&
    product.variants.some(v=>v.sku===query.sku)?query.sku:undefined;
  if(slug!==product.slug)permanentRedirect("/san-pham/"+encodeURIComponent(product.slug)+
    (selectedSku?"?sku="+encodeURIComponent(selectedSku):""));
  const category = catalog.categories.find(item => item.id === product.categoryId);
  const images=product.media.flatMap(media=>{
    const src=getPublishedProductImageUrl(media.r2Key,process.env.NEXT_PUBLIC_MEDIA_BASE_URL);
    return src?[{src,alt:productSeoImageAlt(product,media.alt,media.sku),position:media.position,sku:media.sku}]:[];
  });
  const recommendations=relatedProducts(catalog,product);
  // G05: reuse the verified G03 gallery/selector/CTA glass presentation on every product.
  const glass=true;
  const content=<div className="catalog-wrap">
    <SeoJsonLd data={productLandingPageSchema(product,category)}/>
    <SeoJsonLd data={breadcrumbSchema([
      {name:"Sản phẩm",path:"/san-pham"},
      ...(category&&category.id!=="p5-uncategorized"?[{name:category.name,path:"/danh-muc/"+encodeURIComponent(category.slug)}]:[]),
      {name:product.name,path:"/san-pham/"+encodeURIComponent(product.slug)}
    ])}/>
    <WebInterestView kind="product" slug={product.slug}/>
    <CatalogBreadcrumb trail={[
      { label: "Sản phẩm", href: "/san-pham" },
      ...(category && category.id!=="p5-uncategorized" && category.name.toLocaleLowerCase("vi")!=="chưa phân loại" ? [{ label: category.name, href: "/danh-muc/" + encodeURIComponent(category.slug) }] : []),
      { label: product.name },
    ]}/>
    <CatalogueProductOptions product={product} photos={images} glass={glass}
      seoIntro={product.description?undefined:productSeoDescription(product,category)}
      initialSku={selectedSku}/>
    <CatalogueRelatedProducts items={recommendations.items} glass={glass}/>
    <nav className="catalog-seo-links" aria-label="Tìm hiểu thêm về sản phẩm">
      <Link href="/san-pham">Xem thêm danh mục tập vở và văn phòng phẩm</Link>
      <Link href="/dai-ly">Hợp tác đại lý, nhà phân phối</Link>
      <Link href="/gia-cong">Tìm hiểu tư vấn gia công theo quy cách</Link>
    </nav>
  </div>;
  return <CatalogShell><div className="fb-glass-song-page">{content}</div></CatalogShell>;
}
