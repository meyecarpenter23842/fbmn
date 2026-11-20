import type { Metadata } from "next";
import Image from "next/image";
import { CatalogShell, CatalogBreadcrumb, CatalogListing } from "@/components/catalog-ui";
import { getPublicCatalog } from "@/lib/catalog/adapter";
import {getPublicCategoryDisplay} from "@/lib/catalog/category-display";
import { parseCatalogFilters, searchCatalog } from "@/lib/catalog/query";
import {paginatedCatalogMetadata} from "@/lib/seo/catalogue-pagination";
import { toAllowedParams, type RawSearchParams } from "@/lib/catalog/route";

export const dynamic = "force-dynamic";
/** SEO: independent canonical for each UNFILTERED listing page.
 * Search/filters remain noindex; invalid/overflow pages canonicalize to a
 * real listing page rather than fabricating hundreds of crawlable URLs.
 */
export async function generateMetadata({searchParams}:{searchParams:Promise<RawSearchParams>}):Promise<Metadata>{
  const params=await searchParams;
  const filtered=["q","nhom","kho","gsm","sap-xep"].some(key=>key in params);
  const filters=parseCatalogFilters(toAllowedParams(params));
  let page=1;
  if(!filtered){
    const [catalog,modes]=await Promise.all([getPublicCatalog(),getPublicCategoryDisplay()]);
    const results=searchCatalog(catalog,{...filters,page:filters.page},modes);
    page=results.page;
  }
  return paginatedCatalogMetadata({requested:filters.page,actual:page,filtered});
}

export default async function ProductsPage({
  searchParams,
}: { searchParams: Promise<RawSearchParams> }) {
  const [catalog, raw, modes] = await Promise.all([getPublicCatalog(), searchParams, getPublicCategoryDisplay()]);
  const filters = parseCatalogFilters(toAllowedParams(raw));
  return <CatalogShell>
    <div className="catalog-wrap">
      <CatalogBreadcrumb trail={[{ label: "Sản phẩm" }]}/>
      <section className="catalog-product-banner" aria-label="Danh mục sản phẩm Futurebook">
        <div className="catalog-product-banner__copy">
          <span className="catalog-product-banner__eyebrow">FUTUREBOOK MIỀN NAM</span>
          <strong>Sản phẩm Futurebook</strong>
          <span className="catalog-product-banner__categories">Tập vở · Sổ tay · Giấy · Văn phòng phẩm</span>
        </div>
        <Image className="catalog-product-banner__logo"
          src="/brand/fbmn-transparent-logo.webp"
          alt="Logo Futurebook Miền Nam" width={300} height={84} sizes="(max-width: 700px) 130px, 250px"/>
      </section>
      <CatalogListing data={catalog} filters={filters} heading="Sản phẩm Futurebook"
        description="Danh mục tập học sinh, tập sinh viên, sổ ghi chép và văn phòng phẩm Futurebook. Tìm theo mã sản phẩm, khổ giấy, số trang và định lượng có trong dữ liệu đã công khai. Liên hệ để được tư vấn lựa chọn quy cách." modeByCategory={modes} showIntro={false}/>
    </div>
  </CatalogShell>;
}
