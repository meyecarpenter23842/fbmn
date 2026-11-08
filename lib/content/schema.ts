/**
 * Content-CMS read contract for Futurebook Miền Nam.
 * All marketing facts, contacts, campaigns and third-party links MUST have
 * traceable evidence and publisher approval before entering public pages.
 * PR08/19/20 can replace this adapter without changing the Next.js UI.
 */
export interface ContentEvidence {
  source: string;
  verifiedBy: string;
  verifiedAt: string; // YYYY-MM-DD
}
export type ContentStatus = "draft" | "review" | "published" | "archived";
export interface ContentBase {
  id: string;
  slug: string;
  status: ContentStatus;
  title: string;
  evidence: ContentEvidence | null;
  approvedBy?: string;
  approvedAt?: string;
}
export interface Article extends ContentBase {
  summary: string;
  paragraphs: string[]; // plain text only; no untrusted HTML
  publishedAt: string; // ISO-8601 timestamp
}
export interface Promotion extends ContentBase {
  summary: string;
  startsAt: string;
  endsAt: string;
  detail: string;
}
export interface CompanyDetails {
  status: ContentStatus;
  evidence: ContentEvidence | null;
  approvedBy?: string;
  approvedAt?: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
}
export interface DealerInformation extends ContentBase {
  paragraphs: string[];
  contactInstructions: string;
}
export interface ContentStore {
  mode: "production" | "demo";
  company: CompanyDetails | null;
  articles: Article[];
  promotions: Promotion[];
  dealerInformation: DealerInformation | null;
}
export interface PublicCompanyDetails {
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
}
export interface PublicArticle {
  slug: string;
  title: string;
  summary: string;
  paragraphs: string[];
  publishedAt: string;
  slot?: "news.list" | "home.news_featured";
}
export interface PublicPromotion {
  slug: string;
  title: string;
  summary: string;
  detail: string;
  endsAt: string;
  slot?: "promotions.list" | "home.promotion_featured";
}
export interface PublicDealerInformation {
  title: string;
  paragraphs: string[];
  contactInstructions: string;
}
export interface PublicContent {
  company: PublicCompanyDetails | null;
  articles: PublicArticle[];
  promotions: PublicPromotion[];
  dealerInformation: PublicDealerInformation | null;
}
