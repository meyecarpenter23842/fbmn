import type { ProductGroup, PublicCatalog, PublicProduct } from "./schema";

export const GROUP_LABELS: Record<ProductGroup, string> = {
  school_notebook: "Tập học sinh",
  student_notebook: "Tập sinh viên",
  memo_book: "Sổ ghi chép",
  stationery: "Văn phòng phẩm",
};

export const SORT_OPTIONS = {
  name: "Tên A–Z",
  name_desc: "Tên Z–A",
  sku: "Mã SKU A–Z",
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;
export const PAGE_SIZE = 12;

export interface CatalogFilters {
  q: string;
  group: ProductGroup | "";
  size: string;
  gsm: number | null;
  sort: SortKey;
  page: number;
  categoryId?: string;
}

export type ListingProduct = PublicProduct & { listingSku?: string; initialSku?: string };
export interface SearchResult {
  items: ListingProduct[];
  total: number;
  page: number;
  pages: number;
  sizes: string[];
  weights: number[];
}

export function foldVietnamese(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d").toLocaleLowerCase("vi-VN")
    .replace(/\s+/g, " ").trim();
}

function clean(value: string | null, limit: number): string {
  return (value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, limit);
}
function isGroup(value: string): value is ProductGroup {
  return Object.prototype.hasOwnProperty.call(GROUP_LABELS, value);
}
function isSort(value: string): value is SortKey {
  return Object.prototype.hasOwnProperty.call(SORT_OPTIONS, value);
}
export function parseCatalogFilters(params: URLSearchParams): CatalogFilters {
  const rawGroup = clean(params.get("nhom"), 40);
  const rawSort = clean(params.get("sap-xep"), 40);
  const rawGsm = clean(params.get("gsm"), 5);
  const rawPage = clean(params.get("trang"), 6);
  const gsm = /^\d{1,3}$/.test(rawGsm) && Number(rawGsm) > 0 ? Number(rawGsm) : null;
  const page = /^\d{1,5}$/.test(rawPage) ? Math.min(10000, Math.max(1, Number(rawPage))) : 1;
  return {
    q: clean(params.get("q"), 80),
    group: isGroup(rawGroup) ? rawGroup : "",
    size: clean(params.get("kho"), 30),
    gsm,
    sort: isSort(rawSort) ? rawSort : "name",
    page,
  };
}

export function filtersToParams(filters: CatalogFilters, page: number = filters.page): URLSearchParams {
  const qs = new URLSearchParams();
  if (filters.q) qs.set("q", filters.q);
  if (filters.group) qs.set("nhom", filters.group);
  if (filters.size) qs.set("kho", filters.size);
  if (filters.gsm !== null) qs.set("gsm", String(filters.gsm));
  if (filters.sort !== "name") qs.set("sap-xep", filters.sort);
  if (page > 1) qs.set("trang", String(page));
  return qs;
}

/** Pure read-model search; only receives toPublicCatalog() DTO, never raw prices. */
export function searchCatalog(publicCatalog: PublicCatalog, filters: CatalogFilters,
  modeByCategory: Readonly<Record<string,"family"|"sku">> = {}): SearchResult {
  const categoryById = new Map(publicCatalog.categories.map(category => [category.id, category]));
  const tokens = foldVietnamese(filters.q).split(" ").filter(Boolean);
  // Presentation-only cards. Company SKU records and canonical family URLs never change.
  const cards: ListingProduct[] = [];
  for (const product of publicCatalog.products) {
    const skuMode = (variant: PublicProduct["variants"][number]) =>
      modeByCategory[variant.categoryId ?? product.categoryId] === "sku";
    const skuVariants = product.variants.filter(skuMode);
    const familyVariants = product.variants.filter(variant => !skuMode(variant));
    if (familyVariants.length) {
      const familyCategory = skuVariants.length
        ? (familyVariants.find(v => v.categoryId && v.categoryId !== "p5-uncategorized")?.categoryId
          ?? familyVariants[0].categoryId ?? product.categoryId)
        : product.categoryId;
      cards.push(skuVariants.length ? {...product,categoryId:familyCategory,initialSku:familyVariants[0].sku,variants:familyVariants,
        media:product.media.filter(media => media.sku === undefined || familyVariants.some(v => v.sku===media.sku))} : product);
    }
    for (const variant of skuVariants) {
      const categoryId = variant.categoryId ?? product.categoryId;
      // A SKU card may use its own or genuinely shared images, never a sibling SKU cover.
      cards.push({...product,id:product.id+"::"+variant.sku,categoryId,
        variants:[variant],listingSku:variant.sku,
        media:product.media.filter(media => media.sku === undefined || media.sku === variant.sku)});
    }
  }
  const visible = cards.filter(product => {
    const category = categoryById.get(product.categoryId);
    if (!category) return false;
    if (filters.categoryId && product.categoryId !== filters.categoryId) return false;
    if (filters.group && category.group !== filters.group) return false;
    if (tokens.length) {
      const combined = foldVietnamese([
        product.name,product.slug,product.description ?? "",category.name,
        ...product.variants.flatMap(v => [v.name,v.sku]),
      ].join(" "));
      if (!tokens.every(token => combined.includes(token))) return false;
    }
    return true;
  });
  const sizes = [...new Set(visible.flatMap(product => product.variants
    .map(v => v.specifications.paperSize).filter((value): value is string => Boolean(value))))];
  sizes.sort((a,b)=>a.localeCompare(b,"vi"));
  const weights = [...new Set(visible.flatMap(product => product.variants
    .map(v => v.specifications.paperWeightGsm)
    .filter((value): value is number => value !== undefined && Number.isFinite(value))))].sort((a,b)=>a-b);
  const matched = visible.filter(product => product.variants.some(variant =>
    (!filters.size || foldVietnamese(variant.specifications.paperSize ?? "") === foldVietnamese(filters.size)) &&
    (filters.gsm === null || variant.specifications.paperWeightGsm === filters.gsm)));
  matched.sort((a,b)=>{
    if(filters.sort==="sku")return (a.listingSku??a.variants[0]?.sku??"").localeCompare(
      b.listingSku??b.variants[0]?.sku??"","vi")||a.slug.localeCompare(b.slug);
    const first=(a.listingSku?a.variants[0]?.name:a.name)??a.name;
    const second=(b.listingSku?b.variants[0]?.name:b.name)??b.name;
    const compare=first.localeCompare(second,"vi");
    return (filters.sort==="name_desc"?-compare:compare)||a.slug.localeCompare(b.slug)
      ||(a.listingSku??"").localeCompare(b.listingSku??"","vi");
  });
  const pages=Math.max(1,Math.ceil(matched.length/PAGE_SIZE));
  const page=Math.max(1,Math.min(filters.page,pages));
  return {items:matched.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),total:matched.length,
    page,pages,sizes,weights};
}

export function getCategoryBySlug(publicCatalog: PublicCatalog, slug: string) {
  return publicCatalog.categories.find(c => c.slug === slug);
}

export function getProductBySlug(publicCatalog: PublicCatalog, slug: string) {
  return publicCatalog.products.find(p => p.slug === slug || p.legacySlugs?.includes(slug));
}
