import type {
  Article, CompanyDetails, ContentBase, ContentStore, PublicContent, PublicCompanyDetails,
  Promotion, DealerInformation,
} from "./schema";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function safeDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function verified(evidence: ContentBase["evidence"]): boolean {
  return Boolean(evidence && evidence.source.trim() && evidence.verifiedBy.trim()
    && safeDate(evidence.verifiedAt));
}
function released(item: Pick<ContentBase, "status" | "evidence" | "approvedBy" | "approvedAt">): boolean {
  return item.status === "published" && verified(item.evidence)
    && Boolean(item.approvedBy?.trim() && item.approvedAt && safeDate(item.approvedAt));
}
function validText(value: string, max: number): boolean {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max
    && !/<\s*\/?\s*(script|style|iframe|img|a)\b/i.test(value);
}
function safeArticle(item: Article, now: Date): boolean {
  const published = Date.parse(item.publishedAt);
  return released(item) && SLUG.test(item.slug) && validText(item.title, 160)
    && validText(item.summary, 400) && item.paragraphs.length > 0 && item.paragraphs.length <= 30
    && item.paragraphs.every(p => validText(p, 3000))
    && Number.isFinite(published) && published <= now.getTime();
}
function safePromotion(item: Promotion, now: Date): boolean {
  const start = Date.parse(item.startsAt), end = Date.parse(item.endsAt);
  return released(item) && SLUG.test(item.slug) && validText(item.title, 160)
    && validText(item.summary, 400) && validText(item.detail, 3000)
    && Number.isFinite(start) && Number.isFinite(end) && start <= end
    && start <= now.getTime() && now.getTime() <= end;
}
function safeCompany(item: CompanyDetails | null): item is CompanyDetails {
  return Boolean(item && released(item) && [
    item.legalName, item.address, item.phone, item.email, item.hours,
  ].some(value => typeof value === "string" && value.trim()) &&
    // The only public hyperlinks created from company data will use mailto/tel.
    (!item.email || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(item.email)) &&
    (!item.phone || /^[+0-9()\s.-]{8,25}$/.test(item.phone)));
}
function safeDealer(item: DealerInformation | null): item is DealerInformation {
  return Boolean(item && released(item) && SLUG.test(item.slug)
    && validText(item.title, 160) && item.paragraphs.length > 0
    && item.paragraphs.length <= 25 && item.paragraphs.every(p => validText(p, 3000))
    && validText(item.contactInstructions, 800));
}
/** Field-by-field public projection. Never spread raw content/database rows. */
export function toPublicContent(store: ContentStore, now: Date = new Date()): PublicContent {
  const empty: PublicContent = { company: null, articles: [], promotions: [], dealerInformation: null };
  if (store.mode !== "production" || Number.isNaN(now.getTime())) return empty;
  let company: PublicCompanyDetails | null = null;
  if (safeCompany(store.company)) {
    const c = store.company;
    company = {
      ...(c.legalName ? { legalName: c.legalName.trim() } : {}),
      ...(c.address ? { address: c.address.trim() } : {}),
      ...(c.phone ? { phone: c.phone.trim() } : {}),
      ...(c.email ? { email: c.email.trim() } : {}),
      ...(c.hours ? { hours: c.hours.trim() } : {}),
    };
  }
  const seenArticles = new Set<string>();
  const articles = store.articles.filter(item => {
    if (!safeArticle(item, now) || seenArticles.has(item.slug)) return false;
    seenArticles.add(item.slug);
    return true;
  }).map(item => ({
    slug: item.slug, title: item.title, summary: item.summary,
    paragraphs: [...item.paragraphs], publishedAt: item.publishedAt,
  })).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
  const seenOffers = new Set<string>();
  const promotions = store.promotions.filter(item => {
    if (!safePromotion(item, now) || seenOffers.has(item.slug)) return false;
    seenOffers.add(item.slug);
    return true;
  }).map(item => ({
    slug: item.slug, title: item.title, summary: item.summary,
    detail: item.detail, endsAt: item.endsAt,
  }));
  const dealerInformation = safeDealer(store.dealerInformation) ? {
    title: store.dealerInformation.title,
    paragraphs: [...store.dealerInformation.paragraphs],
    contactInstructions: store.dealerInformation.contactInstructions,
  } : null;
  return { company, articles, promotions, dealerInformation };
}
