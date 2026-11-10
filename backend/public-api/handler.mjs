import {projectPublicCms} from "./cms-public.mjs";
const MAX_PUBLIC_PRODUCTS = 10000;
const GROUPS = new Set(["school_notebook", "student_notebook", "memo_book", "stationery"]);
const IDENTIFIER = /^[a-z0-9][a-z0-9_-]*$/i;
const EMPTY_CONTENT = { company: null, articles: [], promotions: [], dealerInformation: null };

function guard(condition) {
  if (!condition) throw new Error("Invalid public read model");
}
function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value, max = 3000) {
  guard(typeof value === "string" && value.length > 0 && value.length <= max);
  return value;
}
function optionalText(value, max = 3000) {
  return value === undefined || value === null ? undefined : text(value, max);
}
function strings(values, maxItems, maxLength) {
  guard(Array.isArray(values) && values.length <= maxItems);
  return values.map(value => text(value, maxLength));
}
function positiveInt(value) {
  guard(Number.isSafeInteger(value) && value > 0);
  return value;
}
function nonnegativeInt(value) {
  guard(Number.isSafeInteger(value) && value >= 0);
  return value;
}
function positiveNumber(value) {
  guard(typeof value === "number" && Number.isFinite(value) && value > 0);
  return value;
}
function copySpecifications(specs) {
  guard(object(specs));
  const result = {};
  for (const name of ["paperSize", "binding", "coverFinish", "ruling"]) {
    if (specs[name] !== undefined) result[name] = text(specs[name], 120);
  }
  for (const name of ["pageCount"]) {
    if (specs[name] !== undefined) result[name] = positiveInt(specs[name]);
  }
  if (specs.paperWeightGsm !== undefined) result.paperWeightGsm = positiveNumber(specs.paperWeightGsm);
  if (specs.packaging !== undefined) {
    guard(object(specs.packaging));
    result.packaging = { saleUnit: text(specs.packaging.saleUnit, 80) };
    for (const name of ["unitsPerPack", "unitsPerCarton"]) {
      if (specs.packaging[name] !== undefined) result.packaging[name] = positiveInt(specs.packaging[name]);
    }
  }
  return result;
}
/**
 * Double allowlist: callers MUST provide an approved public read model,
 * then this HTTP boundary copies only canonical public fields.
 * This code has no DB connection, R2 credentials or customer/price-table access.
 */
export function projectPublicCatalog(raw) {
  guard(object(raw) && Array.isArray(raw.categories) && Array.isArray(raw.products));
  guard(raw.categories.length <= 2000 && raw.products.length <= MAX_PUBLIC_PRODUCTS);
  const categories = raw.categories.map(c => {
    guard(object(c) && GROUPS.has(c.group) && Number.isSafeInteger(c.sortOrder));
    return {
      id: text(c.id, 80), slug: text(c.slug, 80),
      name: text(c.name, 160), group: c.group, sortOrder: c.sortOrder,
    };
  });
  const ids = new Set(categories.map(c => c.id));
  const products = raw.products.map(p => {
    guard(object(p) && ids.has(p.categoryId));
    guard(Array.isArray(p.variants) && p.variants.length <= 100);
    guard(Array.isArray(p.media) && p.media.length <= 2000);
    const variants = p.variants.map(v => {
      guard(object(v));
      let price = null;
      if (v.price !== null && v.price !== undefined) {
        guard(object(v.price) && v.price.kind === "retail" && v.price.currency === "VND");
        price = { kind: "retail", amountVnd: nonnegativeInt(v.price.amountVnd), currency: "VND" };
      }
      return {
        sku: text(v.sku, 100), name: text(v.name, 160),
        ...(v.categoryId === undefined ? {} : {categoryId: (()=>{const id=text(v.categoryId,80);guard(ids.has(id));return id;})()}),
        specifications: copySpecifications(v.specifications), price,
      };
    });
    const allowedSkus = new Set(variants.map(v => v.sku));
    const media = p.media.map(m => {
      guard(object(m) && Number.isSafeInteger(m.position) && m.position >= 0);
      const r2Key = text(m.r2Key, 400);
      guard(/^products\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+-v[1-9]\d*\.(webp|png|jpg|jpeg|avif)$/i.test(r2Key));
      const sku = m.sku == null ? undefined : text(m.sku, 100);
      guard(sku === undefined || allowedSkus.has(sku));
      return { r2Key, alt: text(m.alt, 240), position: m.position,
        ...(sku === undefined ? {} : { sku }) };
    });
    guard(p.priceLabel === null || p.priceLabel === "Liên hệ báo giá");
    const legacySlugs=p.legacySlugs===undefined?undefined:strings(p.legacySlugs,100,80);
    if(legacySlugs)guard(legacySlugs.every(s=>/^sku-[0-9a-f]{32}$/.test(s)));
    return {
      id: text(p.id, 80), categoryId: text(p.categoryId, 80),
      name: text(p.name, 160), slug: text(p.slug, 80),
      ...(legacySlugs?.length ? {legacySlugs}:{}),
      ...(optionalText(p.description, 3000) ? { description: p.description } : {}),
      priceLabel: p.priceLabel, variants, media,
    };
  });
  return { categories, products };
}
export function projectPublicContent(raw) {
  guard(object(raw) && Array.isArray(raw.articles) && Array.isArray(raw.promotions));
  guard(raw.articles.length <= 500 && raw.promotions.length <= 200);
  const company = raw.company === null ? null : (() => {
    guard(object(raw.company));
    const result = {};
    for (const name of ["legalName", "address", "phone", "email", "hours"]) {
      if (raw.company[name] !== undefined) result[name] = text(raw.company[name], 300);
    }
    return result;
  })();
  const articles = raw.articles.map(a => {
    guard(object(a));
    return {
      slug: text(a.slug, 80), title: text(a.title, 160),
      summary: text(a.summary, 400), paragraphs: strings(a.paragraphs, 30, 3000),
      publishedAt: text(a.publishedAt, 50),
    };
  });
  const promotions = raw.promotions.map(p => {
    guard(object(p));
    return {
      slug: text(p.slug, 80), title: text(p.title, 160),
      summary: text(p.summary, 400), detail: text(p.detail, 3000),
      endsAt: text(p.endsAt, 50),
    };
  });
  const dealerInformation = raw.dealerInformation === null ? null : (() => {
    guard(object(raw.dealerInformation));
    return {
      title: text(raw.dealerInformation.title, 160),
      paragraphs: strings(raw.dealerInformation.paragraphs, 25, 3000),
      contactInstructions: text(raw.dealerInformation.contactInstructions, 800),
    };
  })();
  return { company, articles, promotions, dealerInformation };
}
const ROUTES = new Set(["/v1/public/categories", "/v1/public/products", "/v1/public/catalog", "/v1/public/content", "/v1/public/cms", "/v1/public/home-layout", "/v1/public/category-display"]);
const QUERY_KEYS = {
  "/v1/public/categories": new Set(["slug"]),
  "/v1/public/products": new Set(["slug", "categoryId", "page", "limit"]),
  "/v1/public/catalog": new Set(["page", "limit"]),
  "/v1/public/content": new Set(),
  "/v1/public/cms": new Set(),
  "/v1/public/home-layout": new Set(),
  "/v1/public/category-display": new Set(),
};
function integerParam(input, defaultValue, max) {
  if (input === null) return defaultValue;
  if (!/^[1-9]\d{0,4}$/.test(input)) return null;
  const value = Number(input);
  return value <= max ? value : null;
}
function validQuery(url) {
  const keys = QUERY_KEYS[url.pathname];
  for (const key of url.searchParams.keys()) {
    if (!keys.has(key) || url.searchParams.getAll(key).length !== 1) return false;
    const value = url.searchParams.get(key);
    if (key === "slug" || key === "categoryId") {
      if (!value || value.length > 80 || !IDENTIFIER.test(value)) return false;
    }
  }
  if (url.pathname === "/v1/public/products" || url.pathname === "/v1/public/catalog") {
    return integerParam(url.searchParams.get("page"), 1, MAX_PUBLIC_PRODUCTS) !== null &&
      integerParam(url.searchParams.get("limit"), 20, 1000) !== null;
  }
  return true;
}
function response(status, data, origin, cache = "no-store") {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": cache,
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin",
  });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return new Response(JSON.stringify(data), { status, headers });
}
function failure(status, code, origin) {
  return response(status, { error: { code, message: "Yêu cầu không thể xử lý." } }, origin);
}
/**
 * Dependency-injected Worker-compatible handler; no live database fallback.
 * Server code providing getPublicCatalog/getPublicContent is responsible for
 * source verification, publication approvals, isolation and DB permissions.
 * Do NOT deploy before the separate data-source, rate-limit and staging gates.
 */
export function projectPublicHomeLayout(raw) {
  guard(object(raw) && Array.isArray(raw.categoryIds) && Array.isArray(raw.featuredSkus) &&
    raw.categoryIds.length<=6 && raw.featuredSkus.length<=12 &&
    raw.categoryIds.every(id=>typeof id==="string" && /^p5-(?:[0-9a-f-]{36}|uncategorized)$/.test(id)) &&
    raw.featuredSkus.every(s=>typeof s==="string" && s.length>0 && s.length<=100) &&
    new Set(raw.categoryIds).size===raw.categoryIds.length &&
    new Set(raw.featuredSkus).size===raw.featuredSkus.length &&
    Number.isSafeInteger(raw.categoryLimit) && raw.categoryLimit>=1 && raw.categoryLimit<=6 &&
    Number.isSafeInteger(raw.productLimit) && raw.productLimit>=1 && raw.productLimit<=12 &&
    Array.isArray(raw.sectionOrder) && raw.sectionOrder.length===2 &&
    raw.sectionOrder.includes("categories") && raw.sectionOrder.includes("products") &&
    new Set(raw.sectionOrder).size===2 &&
    Number.isSafeInteger(raw.revision) && raw.revision>=1);
  return {categoryIds:[...raw.categoryIds],featuredSkus:[...raw.featuredSkus],
    categoryLimit:raw.categoryLimit,productLimit:raw.productLimit,
    sectionOrder:[...raw.sectionOrder],revision:raw.revision};
}
export function projectPublicCategoryDisplay(raw) {
  guard(object(raw) && Array.isArray(raw.modes) && raw.modes.length<=2000);
  const seen=new Set();
  return {modes:raw.modes.map(item=>{
    guard(object(item) && typeof item.categoryId==="string" &&
      /^p5-(?:[0-9a-f-]{36}|uncategorized)$/.test(item.categoryId) && item.mode==="sku" &&
      !seen.has(item.categoryId));
    seen.add(item.categoryId);
    return {categoryId:item.categoryId,mode:"sku"};
  })};
}
export function createPublicApi({ getPublicCatalog, getPublicContent, getPublicCms, getPublicHomeLayout, getPublicCategoryDisplay, cmsEnabled = false, homeLayoutEnabled = false, categoryDisplayEnabled = false, allowedOrigins = [] }) {
  guard(typeof getPublicCatalog === "function" && typeof getPublicContent === "function");
  guard(Array.isArray(allowedOrigins) && allowedOrigins.every(o => {
    try { const u = new URL(o); return u.protocol === "https:" && u.origin === o; }
    catch { return false; }
  }));
  const allow = new Set(allowedOrigins);
  return {
    async fetch(request) {
      const origin = request.headers.get("Origin");
      const corsOrigin = origin && allow.has(origin) ? origin : null;
      if (origin && !corsOrigin) return failure(403, "origin_forbidden", null);
      const url = new URL(request.url);
      if (!ROUTES.has(url.pathname)) return failure(404, "not_found", corsOrigin);
      if (request.method === "OPTIONS") {
        const headers = new Headers({
          "Allow": "GET, OPTIONS", "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store",
          "Vary": "Origin",
        });
        if (corsOrigin) headers.set("Access-Control-Allow-Origin", corsOrigin);
        return new Response(null, { status: 204, headers });
      }
      if (request.method !== "GET") {
        const result = failure(405, "method_not_allowed", corsOrigin);
        result.headers.set("Allow", "GET, OPTIONS");
        return result;
      }
      if (!validQuery(url)) return failure(400, "invalid_query", corsOrigin);
      try {
        if (url.pathname === "/v1/public/category-display") {
          if(!categoryDisplayEnabled || typeof getPublicCategoryDisplay!=="function")return failure(404,"not_found",corsOrigin);
          return response(200,{data:projectPublicCategoryDisplay(await getPublicCategoryDisplay())},corsOrigin,"no-store");
        }
        if (url.pathname === "/v1/public/home-layout") {
          if(!homeLayoutEnabled || typeof getPublicHomeLayout!=="function")return failure(404,"not_found",corsOrigin);
          const layout=projectPublicHomeLayout(await getPublicHomeLayout());
          return response(200,{data:layout},corsOrigin,"no-store");
        }
        if (url.pathname === "/v1/public/cms") {
          if(!cmsEnabled||typeof getPublicCms!=="function")
            return failure(503,"cms_unavailable",corsOrigin);
          const items=projectPublicCms(await getPublicCms());
          // A hide, published-window change or withdrawal must not persist in an HTTP cache.
          return response(200,{data:{items}},corsOrigin,"no-store");
        }
        if (url.pathname === "/v1/public/content") {
          const content = projectPublicContent(await getPublicContent());
          return response(200, { data: content }, corsOrigin, "public, max-age=60");
        }
        const catalog = projectPublicCatalog(await getPublicCatalog());
        if (url.pathname === "/v1/public/categories") {
          const slug = url.searchParams.get("slug");
          const data = slug ? catalog.categories.filter(c => c.slug === slug) : catalog.categories;
          if (slug && !data.length) return failure(404, "not_found", corsOrigin);
          // Channel visibility can change in Admin without a Website release.
          // Never retain previously published SKUs in shared HTTP caches.
          return response(200, { data }, corsOrigin, "no-store");
        }
        const slug = url.searchParams.get("slug");
        const categoryId = url.searchParams.get("categoryId");
        const page = integerParam(url.searchParams.get("page"), 1, MAX_PUBLIC_PRODUCTS);
        const limit = integerParam(url.searchParams.get("limit"), 20, 1000);
        const items = catalog.products.filter(p =>
          (!slug || p.slug === slug || p.legacySlugs?.includes(slug)) &&
          (!categoryId || p.categoryId === categoryId));
        if (slug && !items.length) return failure(404, "not_found", corsOrigin);
        const total = items.length;
        const pagination = { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
        const batch = items.slice((page - 1) * limit, page * limit);
        if (url.pathname === "/v1/public/catalog") {
          // One allowlisted read model for both categories and published products.
          // Do not cache publication decisions; Admin hide/show remains fresh.
          return response(200, { data: { categories: catalog.categories, products: batch }, pagination },
            corsOrigin, "no-store");
        }
        return response(200, { data: batch, pagination }, corsOrigin, "no-store");
      } catch {
        // Do not include DB, customer identifiers, exceptions or credentials in HTTP errors.
        return failure(503, "read_model_unavailable", corsOrigin);
      }
    },
  };
}
export const EMPTY_PUBLIC_CONTENT = EMPTY_CONTENT;
