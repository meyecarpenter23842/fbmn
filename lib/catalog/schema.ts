/**
 * Futurebook canonical catalogue contract (no database or network dependency).
 * Internal prices must NEVER be returned by public projections.
 * This schema is shared conceptually by web, future admin, and native clients.
 */
export type ProductGroup = "school_notebook" | "student_notebook" | "memo_book" | "stationery";
export type Publication = "draft" | "published" | "archived";
export type SourceStatus = "confirmed" | "estimated" | "pending";
export type PriceKind = "net" | "dealer" | "retail" | "contract";
export type PublicPriceMode = "contact" | "retail";

export interface Evidence {
  fileName: string;
  issuedOn: string; // YYYY-MM-DD, source document's date, not upload date
  page?: number;
  status: SourceStatus;
  verifiedBy?: string;
  verifiedAt?: string; // YYYY-MM-DD
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  group: ProductGroup;
  publication: Publication;
  sortOrder: number;
}

export interface Packaging {
  saleUnit: string; // e.g. quyển, cây, hộp; sourced, never inferred
  unitsPerPack?: number;
  unitsPerCarton?: number;
}

export interface Specifications {
  paperSize?: string;
  pageCount?: number;
  paperWeightGsm?: number;
  binding?: string;
  coverFinish?: string;
  packaging?: Packaging;
  details?: Record<string, string>;
}

export interface PriceRecord {
  kind: PriceKind;
  amountVnd: number; // integer VND, stored only in internal/admin domain
  effectiveFrom: string;
  effectiveTo?: string;
  approval: "pending" | "approved";
  evidence: Evidence;
}

export interface ProductVariant {
  id: string;
  sku: string; // case-insensitive global uniqueness across all variants
  name: string;
  publication: Publication;
  specifications: Specifications;
  evidence: Evidence;
  prices: PriceRecord[];
}

export interface ProductMedia {
  r2Key: string; // storage key only; URL issued by media service
  alt: string;
  position: number;
  approval: "pending" | "approved";
  evidence: Evidence;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  publication: Publication;
  publicPriceMode: PublicPriceMode;
  evidence: Evidence;
  variants: ProductVariant[];
  media: ProductMedia[];
  internalNotes?: string;
}

export interface Catalog {
  mode: "production" | "demo";
  categories: Category[];
  products: Product[];
}

export interface PublicVariant {
  sku: string;
  name: string;
  specifications: Specifications;
  price: { kind: "retail"; amountVnd: number; currency: "VND" } | null;
}

export interface PublicProduct {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  priceLabel: "Liên hệ báo giá" | null;
  variants: PublicVariant[];
  media: Array<{ r2Key: string; alt: string; position: number }>;
}

export interface PublicCatalog {
  categories: Array<{ id: string; name: string; group: ProductGroup; sortOrder: number }>;
  products: PublicProduct[];
}
