import type { Metadata } from "next";
import { CatalogShell, CatalogBreadcrumb, CatalogListing } from "@/components/catalog-ui";
import { getPublicCatalog } from "@/lib/catalog/adapter";
import {getPublicCategoryDisplay} from "@/lib/catalog/category-display";
import { getCategoryBySlug, parseCatalogFilters } from "@/lib/catalog/query";
import { toAllowedParams, type RawSearchParams } from "@/lib/catalog/route";
import {getOptionalPublicCms} from "@/lib/content/cms";
import {CmsBannerSlot} from "@/components/cms-web-content";
import WebInterestView from "@/components/web-interest-view";
import {notFound} from "next/navigation";
import {SeoJsonLd} from "@/lib/seo/json-ld";
import {categoryMetadata,breadcrumbSchema} from "@/lib/seo/structured-data";
import {categorySeoSummary,matchingPublishedVariants} from "@/lib/seo/content-strategy";
import Link from "next/link";
import {getPublishedSeo,seoFor,applySeoSetting} from "@/lib/seo/public-settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params,searchParams }: Props): Promise<Metadata> {
  const [catalog, { slug }, raw, seo] = await Promise.all([getPublicCatalog(), params,searchParams,getPublishedSeo()]);
  const filtered=["q","nhom","kho","gsm","trang","sap-xep"].some(key=>key in raw);
  const category = getCategoryBySlug(catalog, slug);
  return category?{...applySeoSetting(categoryMetadata(category,catalog),seoFor(seo,"category",category.slug)),
    ...(filtered?{robots:{index:false,follow:true}}:{})}
    :{title:"Danh mục đang cập nhật | Futurebook Miền Nam",robots:{index:false}};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [catalog, { slug }, raw, cms, modes] = await Promise.all([getPublicCatalog(), params, searchParams, getOptionalPublicCms(), getPublicCategoryDisplay()]);
  const category = getCategoryBySlug(catalog, slug);
  if(!category)notFound();
  const filters = { ...parseCatalogFilters(toAllowedParams(raw)), categoryId: category.id };
  const related=catalog.categories.filter(item=>item.id!==category.id&&item.group===category.group&&
   matchingPublishedVariants(catalog,item).length>0).slice(0,3);
  return <CatalogShell><div className="catalog-wrap">
    <SeoJsonLd data={breadcrumbSchema([
      {name:"Sản phẩm",path:"/san-pham"},
      {name:category.name,path:"/danh-muc/"+encodeURIComponent(category.slug)}
    ])}/>
    <WebInterestView kind="category" slug={category.slug}/>
    <CatalogBreadcrumb trail={[{ label: "Sản phẩm", href: "/san-pham" }, { label: category.name }]}/>
    <CmsBannerSlot items={cms} slot="category.header"/>
    <CatalogListing data={catalog} filters={filters} heading={category.name}
      description={categorySeoSummary(category,catalog)}
      actionPath={"/danh-muc/" + encodeURIComponent(category.slug)} modeByCategory={modes}/>
    <nav className="catalog-seo-links" aria-label="Danh mục và hợp tác liên quan">
      {related.map(item=><Link key={item.id} href={"/danh-muc/"+encodeURIComponent(item.slug)}>{item.name}</Link>)}
      <Link href="/dai-ly">Thông tin hợp tác đại lý và nhà phân phối</Link>
      <Link href="/gia-cong">Tư vấn gia công tập vở, sổ theo yêu cầu</Link>
    </nav>
  </div></CatalogShell>;
}
