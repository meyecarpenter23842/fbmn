import type { PublicCatalog, PublicProduct, PublicVariant, ProductGroup, Specifications } from "../catalog/schema";
import type { PublicContent, PublicArticle, PublicPromotion } from "../content/schema";

/** SSR-only public API consumer. No DB credentials, no browser-facing API proxy. */
const GROUPS = new Set(["school_notebook", "student_notebook", "memo_book", "stationery"]);
type Rec = Record<string, unknown>;
function obj(x: unknown): Rec {
  if (!x || typeof x !== "object" || Array.isArray(x)) throw new Error("Invalid public API payload");
  return x as Rec;
}
function str(x: unknown, max = 3000): string {
  if (typeof x !== "string" || x.length > max || !x.trim()) throw new Error("Invalid public API text");
  return x;
}
function arr(x: unknown, max: number): unknown[] {
  if (!Array.isArray(x) || x.length > max) throw new Error("Invalid public API list");
  return x;
}
function integer(x: unknown, minimum = 0): number {
  if (typeof x !== "number" || !Number.isSafeInteger(x) || x < minimum) throw new Error("Invalid public API number");
  return x;
}
function number(x: unknown): number {
  if (typeof x !== "number" || !Number.isFinite(x) || x <= 0) throw new Error("Invalid public API value");
  return x;
}
function optionalText(x: unknown, max = 3000): string | undefined {
  return x == null ? undefined : str(x, max);
}
function safeSpec(raw: unknown): Specifications {
  const s = obj(raw), result: Specifications = {};
  for (const k of ["paperSize", "binding", "coverFinish", "ruling"] as const) {
    if (s[k] != null) result[k] = str(s[k], 120);
  }
  if (s.pageCount != null) result.pageCount = integer(s.pageCount, 1);
  if (s.paperWeightGsm != null) result.paperWeightGsm = number(s.paperWeightGsm);
  if (s.packaging != null) {
    const p = obj(s.packaging);
    result.packaging = {
      saleUnit: str(p.saleUnit, 80),
      ...(p.unitsPerPack == null ? {} : { unitsPerPack: integer(p.unitsPerPack, 1) }),
      ...(p.unitsPerCarton == null ? {} : { unitsPerCarton: integer(p.unitsPerCarton, 1) }),
    };
  }
  return result;
}
function safeVariant(raw: unknown): PublicVariant {
  const v = obj(raw);
  let price: PublicVariant["price"] = null;
  if (v.price != null) {
    const p = obj(v.price);
    if (p.kind !== "retail" || p.currency !== "VND") throw new Error("Disallowed public price");
    price = { kind: "retail", amountVnd: integer(p.amountVnd), currency: "VND" };
  }
  return { sku: str(v.sku, 100), name: str(v.name, 160), specifications: safeSpec(v.specifications), price };
}
function safeProduct(raw: unknown): PublicProduct {
  const p = obj(raw);
  const variants = arr(p.variants, 100).map(safeVariant);
  const allowedSkus = new Set(variants.map(v => v.sku));
  const media = arr(p.media, 2000).map(item => {
    const m = obj(item), key = str(m.r2Key, 400);
    if (!/^products\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+-v[1-9]\d*\.(webp|png|jpg|jpeg|avif)$/i.test(key)) throw new Error("Unapproved media key");
    const sku = m.sku == null ? undefined : str(m.sku, 100);
    if (sku !== undefined && !allowedSkus.has(sku)) throw new Error("Orphan public media SKU");
    return { r2Key: key, alt: str(m.alt, 240), position: integer(m.position),
      ...(sku === undefined ? {} : { sku }) };
  });
  if (p.priceLabel !== null && p.priceLabel !== "Liên hệ báo giá") throw new Error("Disallowed price label");
  const legacySlugs=p.legacySlugs==null?undefined:arr(p.legacySlugs,100).map(s=>{
    const value=str(s,80);
    if(!/^sku-[0-9a-f]{32}$/.test(value))throw new Error("Invalid legacy slug");
    return value;
  });
  return {
    id: str(p.id, 80), categoryId: str(p.categoryId, 80),
    name: str(p.name, 160), slug: str(p.slug, 80),
    ...(legacySlugs?.length?{legacySlugs}:{}),
    ...(p.description == null ? {} : { description: str(p.description, 3000) }),
    priceLabel: p.priceLabel as PublicProduct["priceLabel"], variants, media,
  };
}
function baseUrl(input: string): string {
  const u = new URL(input);
  if (u.protocol !== "https:" || !u.hostname || u.username || u.password ||
      u.port || u.search || u.hash || u.pathname !== "/" ||
      /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/i.test(u.hostname) ||
      u.hostname.endsWith(".internal") || u.hostname.endsWith(".invalid")) {
    throw new Error("Invalid public API origin");
  }
  return u.origin;
}
async function getData(origin: string, route: string, transport: typeof fetch): Promise<Rec> {
  const res = await transport(origin + route, {
    method: "GET", headers: { Accept: "application/json" }, cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error("Public API unavailable: " + res.status);
  // A bounded 1000-product batch can exceed 2 MB with long Vietnamese descriptions.
  // Content/categories keep the smaller cap; catalogues remain strictly bounded.
  const maxBytes = route.startsWith("/v1/public/catalog?") ? 8_000_000 : 2_000_000;
  const length = res.headers.get("content-length");
  if (length && Number(length) > maxBytes) {
    await res.body?.cancel();
    throw new Error("Public API payload too large");
  }
  if (!res.body) throw new Error("Public API missing body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const chunks: string[] = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new Error("Public API payload too large");
      }
      chunks.push(decoder.decode(part.value, { stream: true }));
    }
    chunks.push(decoder.decode());
  } finally {
    reader.releaseLock();
  }
  return obj(JSON.parse(chunks.join("")) as unknown);
}
// Most catalogues still need one Worker snapshot. Only unusually large, fully
// approved SKU galleries trigger bounded, smaller product pages. Never discard
// a gallery or silently convert publication state into a cached snapshot.
export async function fetchPublicCatalog(input: string, transport: typeof fetch = fetch): Promise<PublicCatalog> {
  const origin = baseUrl(input);
  for (const batchSize of [1000, 100, 20, 5]) {
    try { return await fetchPublicCatalogPageSize(origin, transport, batchSize); }
    catch (error) {
      if (error instanceof Error && error.message === "Public API payload too large" && batchSize !== 5) continue;
      throw error;
    }
  }
  throw new Error("Public API payload too large");
}
async function fetchPublicCatalogPageSize(origin: string, transport: typeof fetch,
  batchSize: number): Promise<PublicCatalog> {
  const firstPage = await getData(origin, "/v1/public/catalog?page=1&limit=" + batchSize, transport);
  const firstData = obj(firstPage.data);
  const categories = arr(firstData.categories, 2000).map(item => {
    const c = obj(item);
    if (!GROUPS.has(c.group as string)) throw new Error("Unknown public category group");
    return { id: str(c.id, 80), slug: str(c.slug, 80), name: str(c.name, 160),
      group: c.group as ProductGroup, sortOrder: integer(c.sortOrder, -2147483648) };
  });
  const ids = new Set(categories.map(c => c.id));
  const products: PublicProduct[] = [];
  const firstPagination = obj(firstPage.pagination);
  const total = integer(firstPagination.total);
  const pages = integer(firstPagination.totalPages, 1);
  if (total > 10000 || pages > Math.ceil(10000 / batchSize) || pages !== Math.max(1, Math.ceil(total / batchSize))) {
    throw new Error("Invalid public API pagination");
  }
  for (let page = 1; page <= pages; page++) {
    const envelope = page === 1
      ? firstPage
      : await getData(origin, "/v1/public/catalog?page=" + page + "&limit=" + batchSize, transport);
    const pagination = obj(envelope.pagination);
    if (integer(pagination.total) !== total ||
        integer(pagination.totalPages, 1) !== pages ||
        integer(pagination.page, 1) !== page ||
        integer(pagination.limit, 1) !== batchSize) {
      throw new Error("Invalid public API pagination");
    }
    const items = arr(obj(envelope.data).products, batchSize).map(safeProduct);
    if (items.length !== Math.min(batchSize, Math.max(0, total - (page - 1) * batchSize))) {
      throw new Error("Incomplete catalogue page");
    }
    for (const p of items) {
      if (!ids.has(p.categoryId)) throw new Error("Orphan public product");
      products.push(p);
    }
  }
  if (products.length !== total) throw new Error("Incomplete catalogue");
  return { categories, products };

}
export async function fetchPublicContent(input: string, transport: typeof fetch = fetch): Promise<PublicContent> {
  const envelope = await getData(baseUrl(input), "/v1/public/content", transport);
  const d = obj(envelope.data);
  let company: PublicContent["company"] = null;
  if (d.company != null) {
    const c = obj(d.company);
    company = {};
    for (const field of ["legalName", "address", "phone", "email", "hours"] as const) {
      const value = optionalText(c[field], 300);
      if (value !== undefined) company[field] = value;
    }
  }
  const articles: PublicArticle[] = arr(d.articles, 500).map(item => {
    const a = obj(item);
    return { slug: str(a.slug, 80), title: str(a.title, 160), summary: str(a.summary, 400),
      paragraphs: arr(a.paragraphs, 30).map(x => str(x)), publishedAt: str(a.publishedAt, 50) };
  });
  const promotions: PublicPromotion[] = arr(d.promotions, 200).map(item => {
    const p = obj(item);
    return { slug: str(p.slug, 80), title: str(p.title, 160), summary: str(p.summary, 400),
      detail: str(p.detail), endsAt: str(p.endsAt, 50) };
  });
  let dealerInformation: PublicContent["dealerInformation"] = null;
  if (d.dealerInformation != null) {
    const p = obj(d.dealerInformation);
    dealerInformation = { title: str(p.title, 160),
      paragraphs: arr(p.paragraphs, 25).map(x => str(x)),
      contactInstructions: str(p.contactInstructions, 800) };
  }
  return { company, articles, promotions, dealerInformation };
}
