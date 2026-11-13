import type { Metadata } from "next";
import { CatalogShell, CatalogBreadcrumb, CatalogListing } from "@/components/catalog-ui";
import { getPublicCatalog } from "@/lib/catalog/adapter";
import {getPublicCategoryDisplay} from "@/lib/catalog/category-display";
import { parseCatalogFilters } from "@/lib/catalog/query";
import { toAllowedParams, type RawSearchParams } from "@/lib/catalog/route";

export const dynamic = "force-dynamic";
export async function generateMetadata({searchParams}:{searchParams:Promise<RawSearchParams>}):Promise<Metadata>{
  const params=await searchParams;
  const filtered=["q","nhom","kho","gsm","trang","sap-xep"].some(key=>key in params);
  return {
    title: "Danh mục sản phẩm | Futurebook Miền Nam",
    description: "Tìm kiếm danh mục, tập vở, sổ ghi chép và văn phòng phẩm Futurebook đã được xác minh.",
    alternates:{canonical:"/san-pham"},
    ...(filtered?{robots:{index:false,follow:true}}:{}),
  };
}

export default async function ProductsPage({
  searchParams,
}: { searchParams: Promise<RawSearchParams> }) {
  const [catalog, raw, modes] = await Promise.all([getPublicCatalog(), searchParams, getPublicCategoryDisplay()]);
  const filters = parseCatalogFilters(toAllowedParams(raw));
  return <CatalogShell>
    <div className="catalog-wrap">
      <CatalogBreadcrumb trail={[{ label: "Sản phẩm" }]}/>
      <CatalogListing data={catalog} filters={filters} heading="Sản phẩm Futurebook"
        description="Tra cứu theo nhóm hàng, mã SKU, khổ giấy và định lượng. Chỉ hiển thị dữ liệu chính thức đã được xác nhận." modeByCategory={modes}/>
    </div>
  </CatalogShell>;
}
