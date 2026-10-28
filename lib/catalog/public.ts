import type { Catalog, PriceRecord, PublicCatalog, PublicProduct, PublicVariant } from "./schema";
import { validateCatalog } from "./validate.ts";

function isConfirmed(source: { status: string; verifiedBy?: string; verifiedAt?: string }): boolean {
  return source.status === "confirmed" && Boolean(source.verifiedBy && source.verifiedAt);
}

function approvedRetail(prices: PriceRecord[], today: string): PublicVariant["price"] {
  const candidates = prices.filter(price =>
    price.kind === "retail" && price.approval === "approved" &&
    isConfirmed(price.evidence) && price.effectiveFrom <= today &&
    (!price.effectiveTo || price.effectiveTo >= today)
  ).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return candidates.length ? { kind: "retail", amountVnd: candidates[0].amountVnd, currency: "VND" } : null;
}

/**
 * Closed-by-default public DTO: explicit allowlist prevents NET/dealer/contract
 * prices, internal notes and verification metadata from reaching browser/native.
 * Demo catalogues are NEVER exposed, including in production builds.
 */
export function toPublicCatalog(catalog: Catalog, now: Date = new Date()): PublicCatalog {
  if (catalog.mode !== "production") return { categories: [], products: [] };
  const issues = validateCatalog(catalog);
  if (issues.length) throw new Error("Invalid catalogue: " + issues.map(x => x.path + ": " + x.message).join("; "));
  if (Number.isNaN(now.getTime())) throw new Error("Invalid date for catalogue projection");
  const today = now.toISOString().slice(0, 10);
  const categories = catalog.categories.filter(c => c.publication === "published")
    .map(c => ({ id: c.id, slug: c.slug ?? c.id, name: c.name, group: c.group, sortOrder: c.sortOrder }));
  const visibleIds = new Set(categories.map(c => c.id));
  const products: PublicProduct[] = [];
  for (const product of catalog.products) {
    if (product.publication !== "published" || !visibleIds.has(product.categoryId) ||
        !isConfirmed(product.evidence)) continue;
    const variants: PublicVariant[] = product.variants
      .filter(v => v.publication === "published" && isConfirmed(v.evidence))
      .map(v => ({
        sku: v.sku,
        name: v.name,
        specifications: {
          ...(v.specifications.paperSize ? { paperSize: v.specifications.paperSize } : {}),
          ...(v.specifications.pageCount !== undefined ? { pageCount: v.specifications.pageCount } : {}),
          ...(v.specifications.paperWeightGsm !== undefined ? { paperWeightGsm: v.specifications.paperWeightGsm } : {}),
          ...(v.specifications.binding ? { binding: v.specifications.binding } : {}),
          ...(v.specifications.coverFinish ? { coverFinish: v.specifications.coverFinish } : {}),
          ...(v.specifications.packaging ? { packaging: {
            saleUnit: v.specifications.packaging.saleUnit,
            ...(v.specifications.packaging.unitsPerPack ? { unitsPerPack: v.specifications.packaging.unitsPerPack } : {}),
            ...(v.specifications.packaging.unitsPerCarton ? { unitsPerCarton: v.specifications.packaging.unitsPerCarton } : {}),
          } } : {}),
        },
        price: product.publicPriceMode === "retail" ? approvedRetail(v.prices, today) : null,
      }));
    if (!variants.length) continue;
    products.push({
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      slug: product.slug,
      ...(product.description ? { description: product.description } : {}),
      priceLabel: variants.every(v => v.price === null) ? "Liên hệ báo giá" : null,
      variants,
      media: product.media.filter(m => m.approval === "approved" && isConfirmed(m.evidence))
        .sort((a, b) => a.position - b.position)
        .map(m => ({ r2Key: m.r2Key, alt: m.alt, position: m.position })),
    });
  }
  return { categories, products };
}
