import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  foldVietnamese, parseCatalogFilters, filtersToParams,
  searchCatalog, getCategoryBySlug, getProductBySlug, PAGE_SIZE,
} from "../lib/catalog/query.ts";
import { toAllowedParams } from "../lib/catalog/route.ts";
import { getPublishedProductImageUrl } from "../lib/catalog/product-image.ts";
import { catalog as productionData } from "../lib/catalog/data.ts";
import { toPublicCatalog } from "../lib/catalog/public.ts";
import { validateCatalog } from "../lib/catalog/validate.ts";

const category = { id: "school", slug: "vo-hoc-sinh", name: "Vở học sinh",
  group: "school_notebook", sortOrder: 1 };
const product = (index, overrides = {}) => ({
  id: "id-" + index, slug: "demo-slug-" + index,
  name: index === 1 ? "Vở kẻ ngang Hạnh Phúc" : "Vở trưng bày " + index,
  categoryId: "school", priceLabel: "Liên hệ báo giá", media: [],
  variants: [{ sku: "DEMO-TEST-" + index, name: "Vở B5 thử nghiệm",
    price: null, specifications: { paperSize: index % 2 ? "B5" : "A4",
      paperWeightGsm: index % 2 ? 70 : 80, pageCount: 96 } }],
  ...overrides,
});
const data = { categories: [category], products: Array.from({ length: 15 }, (_, i) => product(i + 1)) };
const filters = values => ({ q: "", group: "", size: "", gsm: null,
  sort: "name", page: 1, ...values });

test("Vietnamese Unicode search handles diacritics, đ and whitespace", () => {
  assert.equal(foldVietnamese(" VỞ   Hạnh  PHÚC Đẹp "), "vo hanh phuc dep");
  assert.equal(searchCatalog(data, filters({ q: "vo ke ngang hanh phuc" })).total, 1);
  assert.equal(searchCatalog(data, filters({ q: "hanh phuc" })).items[0].slug, "demo-slug-1");
  assert.equal(searchCatalog(data, filters({ q: "demo-test-7" })).total, 1);
  assert.equal(searchCatalog(data, filters({ q: "KhÔNG Có" })).total, 0);
});

test("group, size and GSM filters are based on verified public variant data", () => {
  assert.equal(searchCatalog(data, filters({ group: "stationery" })).total, 0);
  assert.equal(searchCatalog(data, filters({ group: "school_notebook" })).total, 15);
  assert.equal(searchCatalog(data, filters({ size: "B5", gsm: 70 })).total, 8);
  assert.equal(searchCatalog(data, filters({ size: "A4", gsm: 70 })).total, 0);
  assert.deepEqual(searchCatalog(data, filters({})).sizes, ["A4", "B5"]);
  assert.deepEqual(searchCatalog(data, filters({})).weights, [70, 80]);
  assert.equal(searchCatalog(data, filters({ categoryId: "other" })).total, 0);
});

test("pagination is deterministic, clamped and never leaks past page boundaries", () => {
  const first = searchCatalog(data, filters({}));
  const second = searchCatalog(data, filters({ page: 2 }));
  const afterEnd = searchCatalog(data, filters({ page: 99999 }));
  assert.equal(PAGE_SIZE, 12);
  assert.equal(first.items.length, 12);
  assert.equal(second.items.length, 3);
  assert.equal(second.page, 2);
  assert.deepEqual(afterEnd.items, second.items);
  assert.equal(afterEnd.page, 2);
  assert.equal(new Set([...first.items, ...second.items].map(i => i.id)).size, 15);
  assert.deepEqual(searchCatalog({ categories: [], products: [] }, filters({})),
    { items: [], total: 0, page: 1, pages: 1, sizes: [], weights: [] });
});

test("sorting and route resolution are stable", () => {
  const asc = searchCatalog(data, filters({ sort: "name" }));
  const desc = searchCatalog(data, filters({ sort: "name_desc" }));
  assert.notEqual(asc.items[0].id, desc.items[0].id);
  assert.equal(searchCatalog(data, filters({ sort: "sku" })).items[0].id, "id-1");
  assert.equal(getCategoryBySlug(data, "vo-hoc-sinh")?.id, "school");
  assert.equal(getCategoryBySlug(data, "unknown"), undefined);
  assert.equal(getProductBySlug(data, "demo-slug-5")?.id, "id-5");
  assert.equal(getProductBySlug(data, "DEMO-slug-5"), undefined);
});

test("deep-link parsing preserves only approved keys and clamps hostile input", () => {
  const qs = toAllowedParams({ q: ["Vở Đẹp", "unwanted"], nhom: "school_notebook",
    "sap-xep": "sku", trang: "999999", secret: "NET internal" });
  assert.equal(qs.get("secret"), null);
  assert.equal(qs.get("q"), "Vở Đẹp");
  const parsed = parseCatalogFilters(qs);
  assert.equal(parsed.q, "Vở Đẹp");
  assert.equal(parsed.group, "school_notebook");
  assert.equal(parsed.sort, "sku");
  assert.equal(parsed.page, 1); // oversize page rejected
  const url = filtersToParams({ ...parsed, page: 2 }, 2);
  assert.equal(url.get("q"), "Vở Đẹp");
  assert.equal(url.get("trang"), "2");
  assert.equal(url.get("secret"), null);
  assert.equal(parseCatalogFilters(new URLSearchParams("nhom=invalid&gsm=-1&sap-xep=unknown&trang=0")).group, "");
  assert.equal(parseCatalogFilters(new URLSearchParams("nhom=invalid&gsm=-1&sap-xep=unknown&trang=0")).sort, "name");
  assert.equal(parseCatalogFilters(new URLSearchParams("q=" + "z".repeat(300))).q.length, 80);
});

test("untrusted R2 keys and origins never become product image URLs", () => {
  const base = "https://media.example.test";
  assert.equal(getPublishedProductImageUrl("products/DEMO-SKU/cover-v2.webp", base),
    base + "/products/DEMO-SKU/cover-v2.webp");
  for (const key of ["../secret-v1.webp", "private/net-v1.webp",
    "products/SKU/cover.webp", "products/SKU/../../price-v1.webp",
    "products/SKU/script-v1.svg", "products/SKU/cover-v1.webp?token=a"]) {
    assert.equal(getPublishedProductImageUrl(key, base), null, key);
  }
  for (const bad of ["http://media.example.test", "https://abc.r2.dev",
    "https://media.example.test/nested", "https://media.example.test?token=foo",
    "https://user:password@media.example.test", "invalid url", ""]) {
    assert.equal(getPublishedProductImageUrl("products/DEMO-SKU/cover-v2.webp", bad), null, bad);
  }
});

test("category slugs reject duplicates and maintain stable route identity", () => {
  const cat = { id: "one", slug: "same", name: "DEMO category",
    group: "school_notebook", publication: "draft", sortOrder: 1 };
  const duplicate = { ...cat, id: "two" };
  const catalog = { mode: "production", categories: [cat, duplicate], products: [] };
  assert.ok(validateCatalog(catalog).some(e => e.message.includes("duplicate category slug")));
  duplicate.slug = "other";
  assert.deepEqual(validateCatalog(catalog), []);
});

test("public catalogue stays empty until source approval, not UI mockups", () => {
  assert.equal(productionData.products.length, 0);
  assert.deepEqual(toPublicCatalog(productionData), { categories: [], products: [] });
  const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
  const routes = ["app/san-pham/page.tsx", "app/san-pham/[slug]/page.tsx", "app/danh-muc/[slug]/page.tsx"];
  for (const route of routes) {
    const source = read(route);
    assert.match(source, /getPublicCatalog/);
    assert.doesNotMatch(source, /previewProducts|DEMO-SKU|DATABASE_URL|R2_SECRET/);
    assert.match(source, /CatalogShell/);
  }
  assert.match(read("components/catalog-ui.tsx"), /Liên hệ báo giá/);
  assert.match(read("app/san-pham/[slug]/page.tsx"), /variant\.price\?\.kind === "retail"/);
  assert.match(read("app/page.tsx"), /\/san-pham\?q=/);
  assert.match(read("components/site-header.tsx"), /action="\/san-pham" method="get"/);
});
