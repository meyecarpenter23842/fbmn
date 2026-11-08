import type { Metadata } from "next";
import { CatalogShell, CatalogBreadcrumb, CatalogListing, EmptyState } from "@/components/catalog-ui";
import { getPublicCatalog } from "@/lib/catalog/adapter";
import { getCategoryBySlug, parseCatalogFilters, GROUP_LABELS } from "@/lib/catalog/query";
import { toAllowedParams, type RawSearchParams } from "@/lib/catalog/route";
import {getPublicCms} from "@/lib/content/cms";
import {CmsBannerSlot} from "@/components/cms-web-content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [catalog, { slug }] = await Promise.all([getPublicCatalog(), params]);
  const category = getCategoryBySlug(catalog, slug);
  return category
    ? { title: category.name + " | Futurebook Miền Nam", description: "Danh mục " + category.name + " đã được xác minh." }
    : { title: "Danh mục đang cập nhật | Futurebook Miền Nam", robots: { index: false } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [catalog, { slug }, raw, cms] = await Promise.all([getPublicCatalog(), params, searchParams, getPublicCms()]);
  const category = getCategoryBySlug(catalog, slug);
  if (!category) return <CatalogShell><div className="catalog-wrap">
    <CatalogBreadcrumb trail={[{ label: "Sản phẩm", href: "/san-pham" }, { label: "Danh mục" }]}/>
    <EmptyState heading="Danh mục chưa được công khai"
      message="Danh mục có thể chưa được xác minh, chưa xuất bản hoặc đường dẫn không còn hiệu lực."/>
  </div></CatalogShell>;
  const filters = { ...parseCatalogFilters(toAllowedParams(raw)), categoryId: category.id };
  return <CatalogShell><div className="catalog-wrap">
    <CatalogBreadcrumb trail={[{ label: "Sản phẩm", href: "/san-pham" }, { label: category.name }]}/>
    <CmsBannerSlot items={cms} slot="category.header"/>
    <CatalogListing data={catalog} filters={filters} heading={category.name}
      description={"Nhóm " + GROUP_LABELS[category.group] + ". Dữ liệu hiển thị theo nguồn đã được duyệt."}
      actionPath={"/danh-muc/" + encodeURIComponent(category.slug)}/>
  </div></CatalogShell>;
}
