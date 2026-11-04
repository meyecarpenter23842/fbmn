import test from "node:test";
import assert from "node:assert/strict";
import { createReadModel, PUBLIC_READ_QUERIES } from "../backend/public-api/read-model.mjs";
import { createPublicApi } from "../backend/public-api/handler.mjs";

test("P0B 613 P5 SKUs retain stable slugs and leading zeros with batched hash generation",async()=>{
  const skuRows=Array.from({length:613},(_,i)=>({
    sku_cong_ty:String(i).padStart(4,"0"),name:"Tập chính hãng "+i,paper_size:"A5",
    product_spec:{pages:"96",gsm:"70",unit:"Quyển"},
    category_id:null,category_label:null,family_id:null,family_label:null,
  }));
  const sql=async text => text===PUBLIC_READ_QUERIES.p5Skus?skuRows:[];
  const model=createReadModel(sql,{enableP5:true});
  const first=await model.getPublicCatalog();
  const second=await model.getPublicCatalog();
  assert.equal(first.products.length,613);
  assert.equal(first.products[4].variants[0].sku,"0004");
  assert.deepEqual(first.products.map(x=>x.id),second.products.map(x=>x.id));
  assert.ok(first.products.every(p=>/^sku-[0-9a-f]{32}$/.test(p.slug)));
  const api=createPublicApi({
    getPublicCatalog:()=>model.getPublicCatalog(),
    getPublicContent:async()=>({company:null,articles:[],promotions:[],dealerInformation:null}),
  });
  const response=await api.fetch(new Request("https://example.test/v1/public/catalog?page=1&limit=1000"));
  assert.equal(response.status,200);
  assert.equal(response.headers.get("cache-control"),"no-store");
  const body=await response.json();
  assert.equal(body.data.products.length,613);
  assert.equal(body.pagination.totalPages,1);
  assert.doesNotMatch(JSON.stringify(body),/net_price|source_price_vnd|customer|PRIVATE/);
});
