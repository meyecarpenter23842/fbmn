import type { PublicCatalog, PublicProduct } from "./schema";

export interface HomeLayout {
  categoryIds: string[];
  featuredSkus: string[];
  categoryLimit: number;
  productLimit: number;
  sectionOrder: ("categories" | "products")[];
  revision: number;
}
export const DEFAULT_HOME_LAYOUT: HomeLayout = {
  categoryIds: [], featuredSkus: [], categoryLimit: 6, productLimit: 4,
  sectionOrder: ["categories","products"], revision: 1
};
/**
 * Homepage selects from the already allowlisted public_web catalogue only.
 * Owner curation only orders/limits products already approved for public_web.
 * Never infer popularity, insert demo entries or manufacture SKU/media/price.
 */
export const HOME_CATEGORY_LIMIT = 6;
export const HOME_PRODUCT_LIMIT = 4;

export interface HomeCategory {
  id: string;
  slug: string;
  name: string;
  productCount: number;
  /** A genuine approved cover from a product IN this category, if available. */
  representativeMedia: PublicProduct["media"][number] | null;
}

export function selectHomeCatalog(catalog: PublicCatalog, layout: HomeLayout = DEFAULT_HOME_LAYOUT): {
  categories: HomeCategory[];
  products: PublicProduct[];
} {
  const byCategory = new Map<string, PublicProduct[]>(
    catalog.categories.map(category => [category.id, []])
  );
  // Public API and local production projection have already enforced publication
  // and field allowlists. Ignore products not attached to a public category.
  for (const product of catalog.products) {
    if (product.variants.length) byCategory.get(product.categoryId)?.push(product);
  }
  // "Chưa phân loại" is an internal holding category, never a public
  // navigation tile or an SEO landing page.
  const isNamedCategory = (category:PublicCatalog["categories"][number]) =>
    category.id !== "p5-uncategorized" && category.slug !== "chua-phan-loai" &&
    category.name.trim().toLocaleLowerCase("vi") !== "chưa phân loại";
  const ordered = catalog.categories
    .filter(category => isNamedCategory(category) && (byCategory.get(category.id)?.length ?? 0) > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder
      || a.name.localeCompare(b.name, "vi")
      || a.id.localeCompare(b.id));
  for (const group of byCategory.values()) {
    group.sort((a, b) => a.name.localeCompare(b.name, "vi")
      || a.slug.localeCompare(b.slug)
      || a.id.localeCompare(b.id));
  }

  const allowed=new Set(ordered.map(category=>category.id));
  const requested=layout.categoryIds.filter(id=>allowed.has(id))
    .map(id=>ordered.find(c=>c.id===id)!);
  // Stale Owner curation can still reference only the internal holding
  // category. Do not let that hide every published product/category.
  const curated=requested.length?requested:ordered;
  const visible = curated.slice(0, layout.categoryLimit);
  const categories = visible.map(category => {
    const list = byCategory.get(category.id)!;
    const representativeMedia = list.find(product => product.media.length > 0)?.media[0] ?? null;
    return {
      id: category.id, slug: category.slug, name: category.name,
      productCount: list.length, representativeMedia,
    };
  });

  // Take one product from each available category first (variety, NOT a
  // fabricated "best-seller" rank), then fill remaining slots deterministically.
  // When only the internal holding category exists, keep REAL published
  // products visible without inventing or advertising a category. Respect
  // explicit Owner curation whenever named categories are available.
  const all=ordered.length===0
    ? catalog.products.filter(product=>product.variants.length>0 && byCategory.has(product.categoryId))
      .sort((a,b)=>a.name.localeCompare(b.name,"vi") || a.id.localeCompare(b.id))
    : visible.flatMap(category=>byCategory.get(category.id)!);
  const selected:PublicProduct[]=[];
  const seen=new Set<string>();
  const add=(item:PublicProduct|undefined)=>{
    if(item && !seen.has(item.id)){seen.add(item.id);selected.push(item);}
  };
  for(const sku of layout.featuredSkus)
    add(all.find(item=>item.variants.some(v=>v.sku===sku)));
  for(const category of visible)add(byCategory.get(category.id)![0]);
  for(const item of all)add(item);
  return { categories, products: selected.slice(0,layout.productLimit) };
}
