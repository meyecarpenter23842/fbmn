import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fetchPublicCatalog, fetchPublicContent } from "../lib/public-api/client.ts";
import { createReadModel, PUBLIC_READ_QUERIES } from "../backend/public-api/read-model.mjs";

const fetchMock = pages => async url => {
  const path = new URL(url).pathname;
  const v = pages[path];
  if (!v) return new Response("{}", { status:503 });
  return new Response(JSON.stringify(v), { status:200 });
};
const empty = {
  "/v1/public/categories": { data:[] },
  "/v1/public/products": { data:[],pagination:{page:1,limit:50,total:0,totalPages:1} },
  "/v1/public/content": { data:{company:null,articles:[],promotions:[],dealerInformation:null} },
};
test("remote SSR adapters handle empty verified read models", async () => {
  assert.deepEqual(await fetchPublicCatalog("https://api.example.com", fetchMock(empty)),{categories:[],products:[]});
  assert.deepEqual(await fetchPublicContent("https://api.example.com", fetchMock(empty)),empty["/v1/public/content"].data);
});
test("remote API cannot fetch loopback, HTTP, credentials or query URLs", async () => {
  for (const url of ["http://api.example.com","https://localhost","https://127.0.0.1",
    "https://u:p@api.example.com","https://api.example.com/v1","https://api.example.com/?x=1"]) {
    await assert.rejects(fetchPublicCatalog(url, fetchMock(empty)));
  }
});
test("missing or broken remote endpoint fails closed, never mock fallback", async () => {
  await assert.rejects(fetchPublicCatalog("https://api.example.com",fetchMock({})),/unavailable/);
  await assert.rejects(fetchPublicContent("https://api.example.com",fetchMock({
    "/v1/public/content":{data:{company:null,articles:[{slug:"x",title:"x",summary:"x",paragraphs:["x"],publishedAt:"t",net:99220}],promotions:null,dealerInformation:null}},
  })));
});
test("unknown private fields are dropped from remote DTO", async () => {
  const data = structuredClone(empty);
  data["/v1/public/categories"].data=[{id:"c1",slug:"c1",name:"DEMO",group:"stationery",sortOrder:1,privateNote:"PRIVATE"}];
  data["/v1/public/products"].data=[{id:"p1",categoryId:"c1",name:"DEMO",slug:"p1",
    variants:[{sku:"D01",name:"DEMO",specifications:{paperSize:"A4",secret:"PRIVATE"},price:null,net:23456}],
    media:[],priceLabel:"Liên hệ báo giá",customer:"PRIVATE"}];
  data["/v1/public/products"].pagination.total=1;
  const value=await fetchPublicCatalog("https://api.example.com",fetchMock(data));
  assert.equal(value.products.length,1);
  assert.doesNotMatch(JSON.stringify(value),/PRIVATE|23456|customer|net/);
});
test("database source only queries fixed public views, no private tables", async () => {
  const sqls = Object.values(PUBLIC_READ_QUERIES);
  assert.equal(sqls.length,11);
  for (const sql of sqls) {
    assert.match(sql,/FROM fbmn_public\.v_/);
    assert.doesNotMatch(sql,/futurebook\.|neon_auth\.|sku_prices|customers|password|net_price/i);
  }
  const query = async statement => {
    assert.ok(sqls.includes(statement));
    return [];
  };
  const store=createReadModel(query);
  assert.deepEqual(await store.getPublicCatalog(),{categories:[],products:[]});
  assert.deepEqual(await store.getPublicContent(),{company:null,articles:[],promotions:[],dealerInformation:null});
});
test("published product with no approved variants is excluded by SQL read model", async () => {
  const store = createReadModel(async statement => {
    if (statement === PUBLIC_READ_QUERIES.categories) return [
      {id:"c1",slug:"c1",name:"DEMO",product_group:"stationery",sort_order:1}];
    if (statement === PUBLIC_READ_QUERIES.products) return [
      {id:"p1",category_id:"c1",slug:"p1",name:"DEMO",description:null,public_price_mode:"contact"}];
    return [];
  });
  const catalog = await store.getPublicCatalog();
  assert.equal(catalog.categories.length,1);
  assert.equal(catalog.products.length,0);
});
test("oversized remote body is rejected during stream consumption", async () => {
  const transport = async () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(2_000_001));
      controller.close();
    },
  }), {status:200});
  await assert.rejects(fetchPublicCatalog("https://api.example.com", transport),/too large/);
});

test("catalogue/content SSR source switching is opt-in and production remains fail-closed", () => {
  const source = ["lib/catalog/adapter.ts","lib/content/adapter.ts"].map(p=>readFileSync(new URL("../"+p,import.meta.url),"utf8"));
  for (const s of source) {
    assert.match(s,/FBMN_PUBLIC_API_ENABLED === "true"/);
    assert.match(s,/FBMN_PUBLIC_API_BASE_URL/);
    assert.doesNotMatch(s,/NEXT_PUBLIC_API_BASE_URL|DATABASE_URL|R2_SECRET/);
  }
});
