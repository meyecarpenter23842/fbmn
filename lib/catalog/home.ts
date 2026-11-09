import type { PublicCatalog, PublicProduct } from "./schema";

/**
 * Homepage selects from the already allowlisted public_web catalogue only.
 * This is a deterministic default until DL4 adds Owner-curated placement.
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

export function selectHomeCatalog(catalog: PublicCatalog): {
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
  const ordered = catalog.categories
    .filter(category => (byCategory.get(category.id)?.length ?? 0) > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder
      || a.name.localeCompare(b.name, "vi")
      || a.id.localeCompare(b.id));
  for (const group of byCategory.values()) {
    group.sort((a, b) => a.name.localeCompare(b.name, "vi")
      || a.slug.localeCompare(b.slug)
      || a.id.localeCompare(b.id));
  }

  const visible = ordered.slice(0, HOME_CATEGORY_LIMIT);
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
  const picks = visible.map(category => byCategory.get(category.id)![0]);
  const rest = visible.flatMap(category => byCategory.get(category.id)!.slice(1));
  return { categories, products: [...picks, ...rest].slice(0, HOME_PRODUCT_LIMIT) };
}
