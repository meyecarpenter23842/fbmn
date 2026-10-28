import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateCatalog } from "../lib/catalog/validate.ts";
import { toPublicCatalog } from "../lib/catalog/public.ts";
import { catalog as liveCatalog } from "../lib/catalog/data.ts";

// Synthetic DEMO-only fixture. No real Futurebook SKU, price or commercial policy.
const verified = (fileName = "DEMO-only-document.pdf") => ({
  fileName, issuedOn: "2026-10-01", status: "confirmed",
  verifiedBy: "DEMO QA", verifiedAt: "2026-10-02", page: 1,
});
const seed = () => ({
  mode: "production",
  categories: [
    { id: "student-paper", name: "DEMO category", group: "student_notebook", publication: "published", sortOrder: 1 },
  ],
  products: [{
    id: "product-demo-01", categoryId: "student-paper", name: "DEMO product",
    slug: "demo-product", description: "DEMO testing only", publication: "published",
    publicPriceMode: "contact", evidence: verified(),
    internalNotes: "SENSITIVE_INTERNAL_DEMO",
    media: [{
      r2Key: "products/demo/photo.webp", alt: "DEMO cover", position: 0,
      approval: "approved", evidence: verified(),
    }],
    variants: [{
      id: "variant-demo-01", sku: "DEMO-ONLY-001", name: "DEMO B5",
      publication: "published", evidence: verified(),
      specifications: {
        paperSize: "B5", pageCount: 96, paperWeightGsm: 70, binding: "staple",
        coverFinish: "DEMO UV", packaging: { saleUnit: "quyển", unitsPerPack: 10, unitsPerCarton: 100 },
      },
      prices: [
        { kind: "net", amountVnd: 11001, effectiveFrom: "2026-10-01", approval: "approved", evidence: verified() },
        { kind: "dealer", amountVnd: 12002, effectiveFrom: "2026-10-01", approval: "approved", evidence: verified() },
        { kind: "contract", amountVnd: 13003, effectiveFrom: "2026-10-01", approval: "approved", evidence: verified() },
        { kind: "retail", amountVnd: 14004, effectiveFrom: "2026-10-01", approval: "approved", evidence: verified() },
      ],
    }],
  }],
});
const date = new Date("2026-10-28T00:00:00.000Z");

test("canonical catalogue validation accepts complete synthetic DEMO source", () => {
  assert.deepEqual(validateCatalog(seed()), []);
});

test("case-insensitive duplicate SKU across different products is rejected", () => {
  const c = seed();
  const duplicate = structuredClone(c.products[0]);
  duplicate.id = "product-demo-02";
  duplicate.slug = "demo-product-two";
  duplicate.variants[0].id = "variant-demo-02";
  duplicate.variants[0].sku = "demo-only-001";
  c.products.push(duplicate);
  assert.ok(validateCatalog(c).some(e => /duplicate SKU/.test(e.message)));
});

test("published paper variants need valid specifications and packaging", () => {
  const c = seed();
  c.products[0].variants[0].specifications.pageCount = -10;
  c.products[0].variants[0].specifications.paperWeightGsm = 0;
  c.products[0].variants[0].specifications.packaging.unitsPerCarton = 5;
  const errors = validateCatalog(c).map(e => e.message).join(" ");
  assert.match(errors, /pageCount/);
  assert.match(errors, /GSM/);
  assert.match(errors, /Carton/);
});

test("confirmed evidence and approved prices require traceable source", () => {
  const c = seed();
  c.products[0].evidence.verifiedBy = "";
  c.products[0].variants[0].prices[0].evidence.status = "estimated";
  assert.ok(validateCatalog(c).some(e => /verifier/.test(e.message)));
  assert.ok(validateCatalog(c).some(e => /Approved prices require confirmed source/.test(e.message)));
});

test("invalid effective ranges and media storage keys are rejected", () => {
  const c = seed();
  c.products[0].variants[0].prices[0].effectiveTo = "2026-09-01";
  c.products[0].media[0].r2Key = "../secrets/image.webp";
  const problems = validateCatalog(c).map(e => e.message).join(" ");
  assert.match(problems, /expiry precedes start/);
  assert.match(problems, /Invalid R2/);
});

test("public price mode defaults to contact and internal prices never escape", () => {
  const c = seed();
  const output = toPublicCatalog(c, date);
  assert.equal(output.products[0].priceLabel, "Liên hệ báo giá");
  assert.equal(output.products[0].variants[0].price, null);
  const json = JSON.stringify(output);
  for (const hidden of ["SENSITIVE_INTERNAL_DEMO", "11001", "12002", "13003", "14004",
    "internalNotes", "dealer", "contract", '"net"', "verifiedBy", "fileName"]) {
    assert.equal(json.includes(hidden), false, "Leaked private data: " + hidden);
  }
});

test("only explicitly approved confirmed retail prices become public", () => {
  const c = seed();
  c.products[0].publicPriceMode = "retail";
  const listed = toPublicCatalog(c, date);
  assert.deepEqual(listed.products[0].variants[0].price,
    { kind: "retail", amountVnd: 14004, currency: "VND" });
  assert.ok(!JSON.stringify(listed).includes("11001"));
  c.products[0].variants[0].prices[3].approval = "pending";
  assert.equal(toPublicCatalog(c, date).products[0].variants[0].price, null);
});

test("time-window enforcement prevents expired and future retail prices", () => {
  const c = seed();
  c.products[0].publicPriceMode = "retail";
  c.products[0].variants[0].prices[3].effectiveTo = "2026-10-27";
  assert.equal(toPublicCatalog(c, date).products[0].variants[0].price, null);
  c.products[0].variants[0].prices[3].effectiveTo = "2026-11-30";
  c.products[0].variants[0].prices[3].effectiveFrom = "2026-10-29";
  assert.equal(toPublicCatalog(c, date).products[0].variants[0].price, null);
});

test("unconfirmed product/variant and unapproved media never appear", () => {
  const c = seed();
  c.products[0].media[0].approval = "pending";
  assert.equal(toPublicCatalog(c, date).products[0].media.length, 0);
  c.products[0].variants[0].evidence.status = "pending";
  assert.equal(toPublicCatalog(c, date).products.length, 0);
  c.products[0].variants[0].evidence = verified();
  c.products[0].publication = "draft";
  assert.equal(toPublicCatalog(c, date).products.length, 0);
});

test("demo fixture mode and actual catalogue are never public", () => {
  const c = seed();
  c.mode = "demo";
  assert.deepEqual(toPublicCatalog(c, date), { categories: [], products: [] });
  assert.deepEqual(toPublicCatalog(liveCatalog, date), { categories: [], products: [] });
  const productionAdapter = readFileSync(new URL("../lib/catalog/data.ts", import.meta.url), "utf8");
  assert.doesNotMatch(productionAdapter, /DEMO-ONLY|tests\/fixtures/);
  assert.equal(liveCatalog.mode, "production");
});
