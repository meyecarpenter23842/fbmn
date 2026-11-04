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
