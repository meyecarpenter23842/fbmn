import type { PublicVariant } from "./schema";

export interface ProductPhoto { src: string; alt: string; position: number; sku?: string; }
type Dimension = "paperSize" | "paperWeightGsm";

export function paperSizes(variants: PublicVariant[]): string[] {
  return [...new Set(variants.map(v => v.specifications.paperSize)
    .filter((v): v is string => Boolean(v)))].sort((a,b)=>a.localeCompare(b,"vi"));
}
export function paperWeights(variants: PublicVariant[], size: string | undefined): number[] {
  return [...new Set(variants.filter(v=>v.specifications.paperSize===size)
    .map(v=>v.specifications.paperWeightGsm)
    .filter((v): v is number => v!==undefined && Number.isFinite(v)))].sort((a,b)=>a-b);
}
/** Choose only real company SKUs, preferring the current other dimension. */
export function chooseVariant(variants: PublicVariant[], selected: PublicVariant,
  dimension: Dimension, value: string | number): PublicVariant {
  const matches=variants.filter(v=>v.specifications[dimension]===value);
  const other: Dimension=dimension==="paperSize"?"paperWeightGsm":"paperSize";
  return matches.find(v=>v.specifications[other]===selected.specifications[other])??matches[0]??selected;
}
export function samePaperOptions(variants: PublicVariant[], selected: PublicVariant): PublicVariant[] {
  return variants.filter(v=>v.specifications.paperSize===selected.specifications.paperSize &&
    v.specifications.paperWeightGsm===selected.specifications.paperWeightGsm);
}
/** SKU-scoped images and legacy shared images; never borrow a different SKU's cover. */
export function photosForSku(photos: ProductPhoto[], sku: string): ProductPhoto[] {
  const seen=new Set<string>();
  return photos.filter(p=>p.sku===undefined||p.sku===sku).filter(p=>{
    if(seen.has(p.src))return false;
    seen.add(p.src);return true;
  }).sort((a,b)=>a.position-b.position);
}

/** Paper-size data sometimes contains customer-facing groups (e.g. Học Sinh).
 * Use it only as an existing grouping value; do not call every value a paper size. */
export function productType(variant: PublicVariant): string {
  return variant.specifications.paperSize?.trim() ?? "";
}
export function groupedProductTypes(variants: PublicVariant[]): string[] {
  return [...new Set(variants.map(productType))];
}
/** Compact, source-backed customer label. Keep the original code separate to
 * disambiguate distinct company products with identical public specifications. */
export function shortVariantLabel(variant: PublicVariant): string {
  const s=variant.specifications;
  const parts=[
    s.pageCount!==undefined?String(s.pageCount)+" trang":null,
    s.ruling||null,
    s.paperWeightGsm!==undefined?String(s.paperWeightGsm)+" gsm":null,
    s.coverFinish||null,
  ].filter((v):v is string=>v!==null);
  return parts.join(" · ")||"Quy cách khác";
}
