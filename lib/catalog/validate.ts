import type { Catalog, Evidence, PriceRecord, ProductGroup, Specifications } from "./schema";

export interface CatalogProblem {
  path: string;
  message: string;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9][a-z0-9_-]*$/i;
const SKU = /^[a-z0-9][a-z0-9._/-]*$/i;
const SAFE_KEY = /^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.(?:jpg|jpeg|png|webp|avif)$/i;
const PAPER_GROUPS: ReadonlySet<ProductGroup> = new Set([
  "school_notebook", "student_notebook", "memo_book",
]);

function goodDate(value: string | undefined): boolean {
  if (!value || !DAY.test(value)) return false;
  const time = Date.parse(value + "T00:00:00.000Z");
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

function nonempty(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function positiveInteger(value: number | undefined): boolean {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function checkEvidence(e: Evidence, path: string, errors: CatalogProblem[]): void {
  if (!e || !nonempty(e.fileName)) errors.push({ path, message: "Missing source document name" });
  if (!e || !goodDate(e.issuedOn)) errors.push({ path, message: "Missing/invalid source document date" });
  if (!e || !["confirmed", "estimated", "pending"].includes(e.status)) {
    errors.push({ path, message: "Unknown verification status" });
  }
  if (e?.page !== undefined && !positiveInteger(e.page)) {
    errors.push({ path, message: "Source page must be a positive integer" });
  }
  if (e?.status === "confirmed" && (!nonempty(e.verifiedBy) || !goodDate(e.verifiedAt))) {
    errors.push({ path, message: "Confirmed source needs verifier and verification date" });
  }
}

function checkSpecs(spec: Specifications, group: ProductGroup, published: boolean, path: string, errors: CatalogProblem[]): void {
  if (!spec || typeof spec !== "object") {
    errors.push({ path, message: "Specifications are required" });
    return;
  }
  if (spec.pageCount !== undefined && !positiveInteger(spec.pageCount)) {
    errors.push({ path, message: "pageCount must be a positive integer" });
  }
  if (spec.paperWeightGsm !== undefined && (!Number.isFinite(spec.paperWeightGsm) || spec.paperWeightGsm <= 0)) {
    errors.push({ path, message: "paperWeightGsm must be positive" });
  }
  if (published && PAPER_GROUPS.has(group)) {
    if (!nonempty(spec.paperSize) || !positiveInteger(spec.pageCount) || !Number.isFinite(spec.paperWeightGsm) || (spec.paperWeightGsm as number) <= 0) {
      errors.push({ path, message: "Published paper product needs paper size, page count and GSM" });
    }
  }
  const pack = spec.packaging;
  if (pack) {
    if (!nonempty(pack.saleUnit)) errors.push({ path, message: "Packaging sale unit required" });
    if (pack.unitsPerPack !== undefined && !positiveInteger(pack.unitsPerPack)) {
      errors.push({ path, message: "unitsPerPack must be positive integer" });
    }
    if (pack.unitsPerCarton !== undefined && !positiveInteger(pack.unitsPerCarton)) {
      errors.push({ path, message: "unitsPerCarton must be positive integer" });
    }
    if (positiveInteger(pack.unitsPerPack) && positiveInteger(pack.unitsPerCarton) &&
        (pack.unitsPerCarton as number) < (pack.unitsPerPack as number)) {
      errors.push({ path, message: "Carton cannot contain fewer units than pack" });
    }
  }
}

function checkPrice(price: PriceRecord, path: string, errors: CatalogProblem[]): void {
  if (!["net", "dealer", "retail", "contract"].includes(price.kind)) {
    errors.push({ path, message: "Unknown price kind" });
  }
  if (!Number.isSafeInteger(price.amountVnd) || price.amountVnd < 0) {
    errors.push({ path, message: "Price must be nonnegative integer VND" });
  }
  if (!goodDate(price.effectiveFrom) || (price.effectiveTo && !goodDate(price.effectiveTo))) {
    errors.push({ path, message: "Price effective dates must be valid YYYY-MM-DD" });
  }
  if (price.effectiveTo && price.effectiveTo < price.effectiveFrom) {
    errors.push({ path, message: "Price expiry precedes start" });
  }
  if (!["pending", "approved"].includes(price.approval)) {
    errors.push({ path, message: "Unknown price approval" });
  }
  checkEvidence(price.evidence, path + ".evidence", errors);
  if (price.approval === "approved" && price.evidence?.status !== "confirmed") {
    errors.push({ path, message: "Approved prices require confirmed source" });
  }
}

export function validateCatalog(catalog: Catalog): CatalogProblem[] {
  const errors: CatalogProblem[] = [];
  if (!catalog || !["production", "demo"].includes(catalog.mode) ||
      !Array.isArray(catalog.categories) || !Array.isArray(catalog.products)) {
    return [{ path: "catalog", message: "Invalid catalogue envelope" }];
  }
  const categoryIds = new Set<string>();
  const categorySlugs = new Set<string>();
  const productIds = new Set<string>();
  const slugs = new Set<string>();
  const skus = new Set<string>();
  const variantIds = new Set<string>();
  for (const [i, category] of catalog.categories.entries()) {
    const path = "categories[" + i + "]";
    if (!ID.test(category.id) || categoryIds.has(category.id)) errors.push({ path, message: "Invalid/duplicate category ID" });
    categoryIds.add(category.id);
    const slug = (category.slug ?? category.id).toLowerCase();
    if (!ID.test(slug) || categorySlugs.has(slug)) errors.push({ path, message: "Invalid/duplicate category slug" });
    categorySlugs.add(slug);
    if (!nonempty(category.name) || !["school_notebook", "student_notebook", "memo_book", "stationery"].includes(category.group) ||
        !Number.isSafeInteger(category.sortOrder) || !["draft", "published", "archived"].includes(category.publication)) {
      errors.push({ path, message: "Invalid category fields" });
    }
  }
  for (const [i, product] of catalog.products.entries()) {
    const path = "products[" + i + "]";
    if (!ID.test(product.id) || productIds.has(product.id)) errors.push({ path, message: "Invalid/duplicate product ID" });
    productIds.add(product.id);
    if (!ID.test(product.slug) || slugs.has(product.slug.toLowerCase())) errors.push({ path, message: "Invalid/duplicate product slug" });
    slugs.add(product.slug.toLowerCase());
    if (!nonempty(product.name) || !categoryIds.has(product.categoryId)) errors.push({ path, message: "Missing name or category" });
    if (!["draft", "published", "archived"].includes(product.publication) ||
        !["contact", "retail"].includes(product.publicPriceMode)) errors.push({ path, message: "Invalid publication/price mode" });
    checkEvidence(product.evidence, path + ".evidence", errors);
    if (!Array.isArray(product.variants) || !Array.isArray(product.media)) {
      errors.push({ path, message: "Missing variants/media arrays" });
      continue;
    }
    if (product.publication === "published" && !product.variants.some(v => v.publication === "published")) {
      errors.push({ path, message: "Published product needs at least one published variant" });
    }
    const group = catalog.categories.find(c => c.id === product.categoryId)?.group ?? "stationery";
    for (const [j, variant] of product.variants.entries()) {
      const p = path + ".variants[" + j + "]";
      const sku = typeof variant.sku === "string" ? variant.sku.trim().toUpperCase() : "";
      if (!SKU.test(sku) || skus.has(sku)) errors.push({ path: p, message: "Invalid/duplicate SKU (global case-insensitive)" });
      skus.add(sku);
      if (!ID.test(variant.id) || variantIds.has(variant.id)) errors.push({ path: p, message: "Invalid/duplicate variant ID" });
      variantIds.add(variant.id);
      if (!nonempty(variant.name) || !["draft", "published", "archived"].includes(variant.publication)) {
        errors.push({ path: p, message: "Invalid variant name/publication" });
      }
      checkEvidence(variant.evidence, p + ".evidence", errors);
      checkSpecs(variant.specifications, group, variant.publication === "published", p + ".specifications", errors);
      if (!Array.isArray(variant.prices)) {
        errors.push({ path: p, message: "Prices must be an array" });
      } else {
        for (const [k, price] of variant.prices.entries()) {
          checkPrice(price, p + ".prices[" + k + "]", errors);
        }
      }
    }
    for (const [j, media] of product.media.entries()) {
      const p = path + ".media[" + j + "]";
      if (!SAFE_KEY.test(media.r2Key) || media.r2Key.includes("..") ||
          !nonempty(media.alt) || !Number.isSafeInteger(media.position) || media.position < 0 ||
          !["pending", "approved"].includes(media.approval)) {
        errors.push({ path: p, message: "Invalid R2 media key, alt, position or approval" });
      }
      checkEvidence(media.evidence, p + ".evidence", errors);
      if (media.approval === "approved" && media.evidence?.status !== "confirmed") {
        errors.push({ path: p, message: "Approved image needs confirmed source" });
      }
    }
  }
  return errors;
}
