import type { Metadata } from "next";
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
import {productMetadata,productSchema,breadcrumbSchema,productApprovedSeoImages} from "@/lib/seo/structured-data";
import {getPublishedSeo,seoFor,applySeoSetting} from "@/lib/seo/public-settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{sku?:string|string[]}> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const [catalog,{slug},seo]=await Promise.all([getPublicCatalog(),params,getPublishedSeo()]);
 const product=getProductBySlug(catalog,slug);
 return product?applySeoSetting(productMetadata(product),seoFor(seo,"product",product.slug),productApprovedSeoImages(product))
  :{title:"Sản phẩm chưa công khai | Futurebook Miền Nam",robots:{index:false}};
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
    return src?[{src,alt:media.alt,position:media.position,sku:media.sku}]:[];
  });
  const recommendations=relatedProducts(catalog,product);
  // G05: reuse the verified G03 gallery/selector/CTA glass presentation on every product.
  const glass=true;
  const content=<div className="catalog-wrap">
    <SeoJsonLd data={productSchema(product)}/>
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
      initialSku={selectedSku}/>
    <CatalogueRelatedProducts items={recommendations.items} glass={glass}/>
  </div>;
  return <CatalogShell><div className="fb-glass-song-page">{content}</div></CatalogShell>;
}
