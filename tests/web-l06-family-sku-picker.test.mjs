import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createReadModel,PUBLIC_READ_QUERIES} from "../backend/public-api/read-model.mjs";
import {projectPublicCatalog} from "../backend/public-api/handler.mjs";
import {chooseVariant,paperSizes,paperWeights,photosForSku,samePaperOptions} from "../lib/catalog/selection.ts";

test("L06 declared family: one card, original company SKUs, scoped cover and ruling",async()=>{
  const family="9e9c4137-2c6e-4c0f-80ff-1fbd64ae36fe";
  const skuRows=[
    {sku_cong_ty:"L536",name:"NICE TRAVEL A5",paper_size:"A5",
      product_spec:{gsm:"70",pages:"96",ruling:"Kẻ ngang"},category_id:null,
      category_label:null,family_id:family,family_label:"NICE TRAVEL"},
    {sku_cong_ty:"L836",name:"NICE TRAVEL B5",paper_size:"B5",
      product_spec:{gsm:"80",pages:"200",ruling:"Kẻ ngang"},category_id:null,
      category_label:null,family_id:family,family_label:"NICE TRAVEL"},
  ];
  const ids=["00000000-0000-4000-8000-000000000001","00000000-0000-4000-8000-000000000002"];
  const mediaRows=skuRows.map((row,i)=>({sku_cong_ty:row.sku_cong_ty,
    asset_id:ids[i],media_role:"cover",sort_order:0}));
  const model=createReadModel(async sql=>sql===PUBLIC_READ_QUERIES.p5Skus?skuRows:
    sql===PUBLIC_READ_QUERIES.p5Media?mediaRows:[],{enableP5:true});
  const catalogue=projectPublicCatalog(await model.getPublicCatalog());
  assert.equal(catalogue.products.length,1);
  const product=catalogue.products[0];
  assert.equal(product.name,"NICE TRAVEL");
  assert.deepEqual(product.variants.map(v=>v.sku),["L536","L836"]);
  assert.deepEqual(product.variants.map(v=>v.specifications.ruling),["Kẻ ngang","Kẻ ngang"]);
  assert.deepEqual(product.media.map(m=>m.sku),["L536","L836"]);
  assert.doesNotMatch(JSON.stringify(catalogue),/net_price|source_price|inventory|private\/catalogue/i);
});

test("L06 selectors never invent SKUs and don't display another SKU's image",()=>{
  const v=[
    {sku:"0114",name:"A5 70",price:null,specifications:{paperSize:"A5",paperWeightGsm:70}},
    {sku:"0714",name:"A5 80",price:null,specifications:{paperSize:"A5",paperWeightGsm:80}},
    {sku:"L836",name:"B5 80",price:null,specifications:{paperSize:"B5",paperWeightGsm:80}},
  ];
  assert.deepEqual(paperSizes(v),["A5","B5"]);
  assert.deepEqual(paperWeights(v,"A5"),[70,80]);
  assert.equal(chooseVariant(v,v[0],"paperSize","B5").sku,"L836");
  assert.equal(chooseVariant(v,v[0],"paperWeightGsm",80).sku,"0714");
  assert.deepEqual(samePaperOptions(v,v[1]).map(x=>x.sku),["0714"]);
  const photos=[
    {src:"/a",alt:"A5",sku:"0114",position:0},
    {src:"/b",alt:"B5",sku:"L836",position:1},
    {src:"/shared",alt:"Chung",position:2},
  ];
  assert.deepEqual(photosForSku(photos,"0114").map(x=>x.src),["/a","/shared"]);
  assert.deepEqual(photosForSku(photos,"0714").map(x=>x.src),["/shared"]);
});
test("L06 public API refuses media mapped to a SKU outside its own family",()=>{
  const raw={categories:[{id:"cat",slug:"cat",name:"Test",group:"stationery",sortOrder:0}],
    products:[{id:"p",categoryId:"cat",slug:"p",name:"Test",priceLabel:"Liên hệ báo giá",
      variants:[{sku:"0114",name:"Test",price:null,specifications:{}}],
      media:[{r2Key:"products/catalogue/abc-v1.webp",alt:"Test",position:0,sku:"WRONG"}]}]};
  assert.throws(()=>projectPublicCatalog(raw),/Invalid public read model/);
});
test("L06 detail stays server-sourced without client API requests",()=>{
  const page=readFileSync(new URL("../app/san-pham/[slug]/page.tsx",import.meta.url),"utf8");
  const ui=readFileSync(new URL("../components/catalogue-product-options.tsx",import.meta.url),"utf8");
  assert.match(page,/getPublicCatalog/);
  assert.match(page,/CatalogueProductOptions/);
  assert.match(ui,/aria-pressed/);
  assert.match(ui,/const candidates=product\.variants;/); // missing size/GSM still selectable
  assert.doesNotMatch(ui,/fetch\(|DATABASE_URL|net_price/i);
});
