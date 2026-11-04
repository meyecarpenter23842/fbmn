import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createPublicApi, projectPublicCatalog, projectPublicContent } from "../backend/public-api/handler.mjs";

const demoCatalog = () => ({
  categories: [{ id: "notebooks", slug: "notebooks", name: "DEMO group", group: "school_notebook", sortOrder: 1, customerList: "PRIVATE" }],
  products: [{
    id: "demo-product", categoryId: "notebooks", slug: "demo-product", name: "DEMO product",
    description: "DEMO only", priceLabel: "Liên hệ báo giá", internalNotes: "PRIVATE_INTERNAL",
    variants: [{
      sku: "DEMO-SKU", name: "DEMO variant", specifications: { paperSize: "A4", pageCount: 96, internalNote: "PRIVATE_SPEC" },
      price: null, prices: [{ kind: "net", amountVnd: 11001 }],
    }],
    media: [], net: 11001, dealer: "PRIVATE_DEALER", customers: ["PRIVATE_CUSTOMER"],
  }],
  customerContacts: ["PRIVATE_PHONE"],
});
const demoContent = () => ({
  company: null,
  articles: [{ slug: "demo-news", title: "DEMO article", summary: "DEMO summary",
    paragraphs: ["DEMO paragraph"], publishedAt: "2026-10-28T00:00:00.000Z",
    secretNote: "PRIVATE_ARTICLE" }],
  promotions: [],
  dealerInformation: null,
  privateContact: "PRIVATE_CONTACT",
});
const instance = (options = {}) => createPublicApi({
  getPublicCatalog: async () => demoCatalog(),
  getPublicContent: async () => demoContent(),
  allowedOrigins: ["https://fbmn-web.vercel.app"],
  ...options,
});
const hit = (api, path, init) => api.fetch(new Request("https://worker.example.invalid" + path, init));
const parse = response => response.json();

test("OpenAPI declares exactly the three public versioned endpoints", () => {
  const doc = JSON.parse(readFileSync(new URL("../backend/public-api/openapi.json", import.meta.url), "utf8"));
  assert.equal(doc.openapi, "3.1.0");
  assert.deepEqual(Object.keys(doc.paths).sort(), [
    "/v1/public/categories", "/v1/public/content", "/v1/public/products",
  ]);
  for (const item of Object.values(doc.paths)) {
    assert.ok(item.get.responses["200"]);
    assert.ok(item.get.responses["400"]);
    assert.ok(item.get.responses["404"]);
  }
});
test("200 categories and products paginate canonical DTO", async () => {
  const api = instance();
  const a = await hit(api, "/v1/public/categories");
  assert.equal(a.status, 200);
  assert.equal((await parse(a)).data[0].slug, "notebooks");
  const b = await hit(api, "/v1/public/products?page=1&limit=1");
  assert.equal(b.status, 200);
  const v = await parse(b);
  assert.equal(v.pagination.total, 1);
  assert.equal(v.data[0].variants[0].sku, "DEMO-SKU");
  assert.equal(b.headers.get("cache-control"), "no-store");
  assert.equal(a.headers.get("cache-control"), "no-store");
});
test("P0 public API emits 613 SKU in one approved response, no NET leakage", async () => {
  const raw=demoCatalog();
  raw.products=Array.from({length:613},(_,i)=>({...raw.products[0],id:"p-"+i,slug:"p-"+i,
    variants:[{...raw.products[0].variants[0],sku:String(i).padStart(4,"0")}]}));
  let reads=0;
  const api=instance({getPublicCatalog:async()=>{reads++;return raw;}});
  const response=await hit(api,"/v1/public/products?page=1&limit=1000");
  assert.equal(response.status,200);
  assert.equal(response.headers.get("cache-control"),"no-store");
  const payload=await response.json();
  assert.equal(payload.data.length,613);
  assert.equal(payload.pagination.totalPages,1);
  assert.equal(payload.data[14].variants[0].sku,"0014");
  assert.equal(reads,1);
  assert.doesNotMatch(JSON.stringify(payload),/PRIVATE|11001|customerContacts|net_price/);
});

test("200 content exposes only approved DTO keys", async () => {
  const r = await hit(instance(), "/v1/public/content");
  assert.equal(r.status, 200);
  assert.equal((await parse(r)).data.articles[0].slug, "demo-news");
});
test("400 query validation rejects unknown, repeated and unsafe fields", async () => {
  const api = instance();
  for (const path of [
    "/v1/public/products?page=0", "/v1/public/products?limit=1001",
    "/v1/public/products?page=1&page=2", "/v1/public/products?net=true",
    "/v1/public/categories?slug=../private", "/v1/public/content?token=1",
  ]) {
    const r = await hit(api, path);
    assert.equal(r.status, 400, path);
    assert.equal((await parse(r)).error.code, "invalid_query");
  }
});
test("404 unknown and missing slug, 405 writes, 204 allowed preflight", async () => {
  const api = instance();
  assert.equal((await hit(api, "/v1/private/prices")).status, 404);
  assert.equal((await hit(api, "/v1/public/products?slug=not-exist")).status, 404);
  assert.equal((await hit(api, "/v1/public/categories?slug=not-exist")).status, 404);
  const denied = await hit(api, "/v1/public/content", { method: "POST" });
  assert.equal(denied.status, 405);
  assert.equal(denied.headers.get("allow"), "GET, OPTIONS");
  const ok = await hit(api, "/v1/public/products", { method: "OPTIONS",
    headers: { Origin: "https://fbmn-web.vercel.app" } });
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get("access-control-allow-origin"), "https://fbmn-web.vercel.app");
});
test("canonical uppercase/underscore identifiers remain filterable", async () => {
  const data = demoCatalog();
  data.categories[0].id = "School_Paper";
  data.categories[0].slug = "School_Paper";
  data.products[0].categoryId = "School_Paper";
  data.products[0].slug = "Demo_Product";
  const api = instance({ getPublicCatalog: async () => data });
  const category = await hit(api, "/v1/public/categories?slug=School_Paper");
  assert.equal(category.status, 200);
  assert.equal((await parse(category)).data.length, 1);
  const products = await hit(api, "/v1/public/products?slug=Demo_Product&categoryId=School_Paper");
  assert.equal(products.status, 200);
  assert.equal((await parse(products)).data.length, 1);
});

test("untrusted browser origin denied; native no-Origin remains public", async () => {
  const api = instance();
  const blocked = await hit(api, "/v1/public/products", {
    headers: { Origin: "https://malicious.example" },
  });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.headers.get("access-control-allow-origin"), null);
  assert.equal((await hit(api, "/v1/public/products")).status, 200);
});
test("private fields including NET and customer metadata never serialize", async () => {
  const api = instance();
  const data = JSON.stringify(await parse(await hit(api, "/v1/public/products")));
  for (const value of ["11001", "PRIVATE", "internalNotes", "customerContacts", "prices", "dealer"]) {
    assert.equal(data.includes(value), false, value);
  }
  const content = JSON.stringify(await parse(await hit(api, "/v1/public/content")));
  assert.equal(content.includes("PRIVATE"), false);
  assert.equal(content.includes("secretNote"), false);
  assert.deepEqual(Object.keys(projectPublicCatalog(demoCatalog())).sort(), ["categories", "products"]);
  assert.deepEqual(Object.keys(projectPublicContent(demoContent())).sort(),
    ["articles", "company", "dealerInformation", "promotions"]);
});
test("canonical fractional GSM and zero approved retail price remain public", async () => {
  const data = demoCatalog();
  data.products[0].variants[0].specifications.paperWeightGsm = 70.5;
  data.products[0].variants[0].price = { kind: "retail", amountVnd: 0, currency: "VND" };
  data.products[0].priceLabel = null;
  const api = instance({ getPublicCatalog: async () => data });
  assert.equal((await hit(api, "/v1/public/categories")).status, 200);
  const products = await hit(api, "/v1/public/products");
  assert.equal(products.status, 200);
  const variant = (await parse(products)).data[0].variants[0];
  assert.equal(variant.specifications.paperWeightGsm, 70.5);
  assert.equal(variant.price.amountVnd, 0);
});

test("malformed or unavailable read models fail closed with no exception leaks", async () => {
  const api = instance({ getPublicCatalog: async () => ({ products: [{}] }) });
  const r = await hit(api, "/v1/public/products");
  assert.equal(r.status, 503);
  const body = await parse(r);
  assert.equal(body.error.code, "read_model_unavailable");
  assert.equal(JSON.stringify(body).includes("products"), false);
});
