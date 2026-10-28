import type { Metadata } from "next";
import { CatalogShell, CatalogBreadcrumb, CatalogListing } from "@/components/catalog-ui";
import { getPublicCatalog } from "@/lib/catalog/adapter";
import { parseCatalogFilters } from "@/lib/catalog/query";
import { toAllowedParams, type RawSearchParams } from "@/lib/catalog/route";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Danh mục sản phẩm | Futurebook Miền Nam",
  description: "Tìm kiếm danh mục, tập vở, sổ ghi chép và văn phòng phẩm Futurebook đã được xác minh.",
};

export default async function ProductsPage({
  searchParams,
}: { searchParams: Promise<RawSearchParams> }) {
  const [catalog, raw] = await Promise.all([getPublicCatalog(), searchParams]);
  const filters = parseCatalogFilters(toAllowedParams(raw));
  return <CatalogShell>
    <div className="catalog-wrap">
      <CatalogBreadcrumb trail={[{ label: "Sản phẩm" }]}/>
      <CatalogListing data={catalog} filters={filters} heading="Sản phẩm Futurebook"
        description="Tra cứu theo nhóm hàng, mã SKU, khổ giấy và định lượng. Chỉ hiển thị dữ liệu chính thức đã được xác nhận."/>
    </div>
  </CatalogShell>;
}
