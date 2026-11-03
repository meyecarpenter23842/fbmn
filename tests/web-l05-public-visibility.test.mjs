import test from "node:test";
import assert from "node:assert/strict";
import { createReadModel, PUBLIC_READ_QUERIES } from "../backend/public-api/read-model.mjs";
import { createPublicApi } from "../backend/public-api/handler.mjs";

// Synthetic DB-view rows: never real Owner pricing, inventory or image bytes.
test("L05 public_web publish, edit and hide are visible without a Website rebuild", async () => {
  let visible = false;
  let title = "Tên ban đầu (test)";
  let size = "A5";
  let image = true;
  const uuid = "9e9c4137-2c6e-4c0f-80ff-1fbd64ae36fe";
  const query = async sql => {
    if (sql === PUBLIC_READ_QUERIES.p5Skus) return visible ? [{
      sku_cong_ty: "0114", name: title, paper_size: size,
      product_spec: { pages: "96 trang", gsm: "70", unit: "Quyển" },
      category_id: null, category_label: null, family_id: null, family_label: null,
    }] : [];
    if (sql === PUBLIC_READ_QUERIES.p5Media) return visible && image ? [{
      sku_cong_ty: "0114", asset_id: uuid, media_role: "cover", sort_order: 0,
    }] : [];
    return [];
  };
  const api = createPublicApi({
    getPublicCatalog: () => createReadModel(query, { enableP5: true }).getPublicCatalog(),
    getPublicContent: async () => ({
      company: null, articles: [], promotions: [], dealerInformation: null,
    }),
  });
  const fetchJson = async path => {
    const response = await api.fetch(new Request("https://worker.example.test" + path));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    return response.json();
  };
  const list = () => fetchJson("/v1/public/products?page=1&limit=50");
  assert.equal((await list()).pagination.total, 0);

  visible = true;
  let result = await list();
  assert.equal(result.pagination.total, 1);
  assert.equal(result.data[0].variants[0].sku, "0114");
  assert.equal(result.data[0].variants[0].specifications.pageCount, 96);
  assert.equal(result.data[0].variants[0].specifications.paperSize, "A5");
  assert.equal(result.data[0].media[0].r2Key, "products/catalogue/" + uuid + "-v1.webp");
  assert.ok(!JSON.stringify(result).includes("private/catalogue"));
  for (const field of ["source_price_vnd", "net_price", "inventory", "customer"]) {
    assert.ok(!JSON.stringify(result).includes(field), field);
  }

  title = "Tên đã sửa (test)";
  size = "B5";
  image = false;
  result = await list();
  assert.equal(result.data[0].name, title);
  assert.equal(result.data[0].variants[0].specifications.paperSize, "B5");
  assert.deepEqual(result.data[0].media, []);
  assert.equal((await fetchJson("/v1/public/categories")).data.length, 1);

  visible = false;
  assert.equal((await list()).pagination.total, 0);
  assert.deepEqual((await fetchJson("/v1/public/categories")).data, []);
});
