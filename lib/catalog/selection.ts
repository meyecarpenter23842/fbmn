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

/** Customer-visible filters only use explicit values in the public specifications
 * or product name. "Học sinh" is never treated as a paper format. */
function normalized(value:string):string{
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/đ/gi,"d").toLocaleLowerCase("vi");
}
export function variantAudience(variant:PublicVariant):string{
  const from=normalized([variant.specifications.paperSize??"",variant.name].join(" "));
  if(/\bhoc\s+sinh\b/.test(from))return "Học sinh";
  if(/\bsinh\s+vien\b/.test(from))return "Sinh viên";
  return "";
}
export function variantPaperFormat(variant:PublicVariant):string{
  const raw=variant.specifications.paperSize?.trim().toUpperCase()??"";
  if(/^[AB][3-6]$/.test(raw))return raw;
  // The company name sometimes explicitly contains a real format, e.g. "(A4)".
  const explicit=variant.name.toUpperCase().match(/\b([AB][3-6])\b/);
  return explicit?.[1]??"";
}
export function availableVariantFacets(variants:PublicVariant[]):{audiences:string[];formats:string[]}{
  return {
    audiences:[...new Set(variants.map(variantAudience).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"vi")),
    formats:[...new Set(variants.map(variantPaperFormat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"vi")),
  };
}
export function visibleVariants(variants:PublicVariant[],audience:string,format:string):PublicVariant[]{
  return variants.filter(v=>(!audience||variantAudience(v)===audience)
    &&(!format||variantPaperFormat(v)===format));
}
/** A facet click may reset the incompatible OTHER facet, but never creates a fake SKU. */
export function moveVariantFacet(variants:PublicVariant[],current:PublicVariant,
  facet:"audience"|"format",value:string,audience:string,format:string):{
    audience:string;format:string;sku:string;
  }{
  const nextAudience=facet==="audience"?value:audience;
  const nextFormat=facet==="format"?value:format;
  let filtered=visibleVariants(variants,nextAudience,nextFormat);
  const resolvedAudience=filtered.length||facet!=="format"?nextAudience:"";
  const resolvedFormat=filtered.length||facet!=="audience"?nextFormat:"";
  filtered=visibleVariants(variants,resolvedAudience,resolvedFormat);
  return {audience:resolvedAudience,format:resolvedFormat,
    sku:(filtered.find(v=>v.sku===current.sku)??filtered[0]??current).sku};
}
