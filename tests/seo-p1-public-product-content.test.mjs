import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createReadModel,PUBLIC_READ_QUERIES} from "../backend/public-api/read-model.mjs";
import {createPublicApi,projectPublicCatalog} from "../backend/public-api/handler.mjs";
import {fetchPublicCatalog} from "../lib/public-api/client.ts";

const one="66d992ff-8f13-48cd-a944-71de0c3edbc8";
const record=(sku,product_spec={},family_id=null)=>({
  sku_cong_ty:sku,name:"Tập mã "+sku,paper_size:"A5",
  product_spec,category_id:null,category_label:null,family_id,family_label:family_id?"Bộ mẫu":""
});
async function catalog(rows,media=[]){
  const model=createReadModel(async(sql,args)=>{
    if(sql===PUBLIC_READ_QUERIES.p5Skus)return rows;
    if(sql===PUBLIC_READ_QUERIES.p5Media)return media;
    return [];
  },{enableP5:true});
  return model.getPublicCatalog();
}
const wire=async data=>{
  const api=createPublicApi({
    getPublicCatalog:async()=>data,
    getPublicContent:async()=>({company:null,articles:[],promotions:[],dealerInformation:null})
  });
  const response=await api.fetch(new Request("https://public.example.invalid/v1/public/catalog?page=1&limit=20"));
  assert.equal(response.status,200);
  return (await response.json()).data.products;
};

test("SEO P1: approved P5 SKU short/long descriptions reach the published DTO",async()=>{
  const model=await catalog([record("A571",{
    pages:"120 trang",ruling:"Kẻ Ngang",gsm:"100",cover_type:"Bìa nhựa",
    short_description:" Sổ ghi chép Futurebook ",
    long_description:"Có các ô chọn lịch.\r\nPhù hợp lưu ghi chép."
  })]);
  const product=model.products[0];
  assert.equal(product.description,"Sổ ghi chép Futurebook\n\nCó các ô chọn lịch.\nPhù hợp lưu ghi chép.");
  assert.equal(product.variants[0].description,product.description);
  assert.equal(product.variants[0].specifications.paperSize,"A5");
  assert.equal(product.variants[0].specifications.pageCount,120);
  assert.equal(product.variants[0].specifications.ruling,"Kẻ Ngang");
  assert.equal(product.variants[0].specifications.paperWeightGsm,100);
  assert.equal(product.variants[0].specifications.coverFinish,"Bìa nhựa");
  const [pub]=await wire(model);
  assert.equal(pub.description,product.description);
  assert.equal(pub.variants[0].description,pub.description);
  assert.equal(pub.priceLabel,"Liên hệ báo giá");
  assert.equal(pub.variants[0].price,null);
});

test("SEO P1: per-SKU descriptions cannot be misattributed to a multi-SKU family",async()=>{
  const model=await catalog([
    record("A571",{short_description:"Mô tả riêng A571"},one),
    record("B871",{short_description:"Mô tả riêng B871"},one)
  ]);
  assert.equal(model.products.length,1);
  assert.equal(model.products[0].description,undefined);
  const [pub]=await wire(model);
  assert.equal(pub.description,undefined);
  assert.deepEqual(pub.variants.map(v=>[v.sku,v.description]),
    [["A571","Mô tả riêng A571"],["B871","Mô tả riêng B871"]]);
});

test("SEO P1: shared description safely belongs to the whole family",async()=>{
  const model=await catalog([
    record("A571",{short_description:"Cùng một mô tả"},one),
    record("B871",{short_description:"Cùng một mô tả"},one)
  ]);
  assert.equal(model.products[0].description,"Cùng một mô tả");
  assert.equal((await wire(model))[0].description,"Cùng một mô tả");
});

test("SEO P1: null, invalid types and unapproved private fields never become public content",async()=>{
  const model=await catalog([record("P003",{
    short_description:null,long_description:{internalNotes:"NET 123456"},
    pages:null,gsm:null,net_price_vnd:123456,internal_notes:"For admin only"
  })]);
  const [pub]=await wire(model);
  assert.equal(pub.description,undefined);
  assert.equal(pub.variants[0].description,undefined);
  assert.equal(pub.variants[0].specifications.pageCount,undefined);
  assert.equal(pub.variants[0].specifications.paperWeightGsm,undefined);
  assert.doesNotMatch(JSON.stringify(pub),/123456|For admin only|internalNotes/);
});

test("SEO P1: approved 600+6000 text survives the public DTO without truncation",async()=>{
  const model=await catalog([record("P003",{
    short_description:"X".repeat(600),long_description:"L".repeat(6000)
  })]);
  assert.equal(model.products[0].description.length,6602);
  assert.equal((await wire(model))[0].description.length,6602);
});

test("SEO P1: Website displays only real selected-SKU copy and sourced specification values",()=>{
  const ui=readFileSync(new URL("../components/catalogue-product-options.tsx",import.meta.url),"utf8");
  const seo=readFileSync(new URL("../lib/seo/structured-data.ts",import.meta.url),"utf8");
  const client=readFileSync(new URL("../lib/public-api/client.ts",import.meta.url),"utf8");
  assert.match(ui,/selected\.description&&selected\.description!==product\.description/);
  assert.match(ui,/exactFormat\?"Khổ giấy":"Phân nhóm"/);
  assert.match(ui,/\^\[AB\]\[3-6\]\$/);
  for(const label of ["Khổ giấy","Số trang","Định lượng giấy","Kiểu kẻ","Loại bìa"]){
    assert.ok(ui.includes(label));
  }
  assert.match(seo,/const supplied=text\(product\.description\?\?""/);
  assert.match(client,/optionalText\(v\.description,6602\)/);
});


test("SEO P1: large fully-described families fall back to one-product API pages",async()=>{
  const all=[];
  for(let familyIndex=0;familyIndex<5;familyIndex++){
    const family_id="11111111-1111-4111-8111-"+String(familyIndex+1).padStart(12,"0");
    for(let variant=0;variant<100;variant++){
      const sku="F"+String(familyIndex).padStart(2,"0")+String(variant).padStart(3,"0");
      all.push(record(sku,{
        short_description:"ắ".repeat(600),long_description:"ắ".repeat(6000)
      },family_id));
    }
  }
  const data=await catalog(all);
  assert.equal(data.products.length,5);
  const limits=[];
  const api=createPublicApi({
    getPublicCatalog:async()=>data,
    getPublicContent:async()=>({company:null,articles:[],promotions:[],dealerInformation:null})
  });
  const transport=async url=>{
    limits.push(Number(new URL(url).searchParams.get("limit")));
    return api.fetch(new Request(url));
  };
  const loaded=await fetchPublicCatalog("https://public.example.com",transport);
  assert.equal(loaded.products.length,5);
  assert.equal(loaded.products[0].variants.length,100);
  assert.equal(loaded.products[4].variants[99].description.length,6602);
  assert.ok(limits.includes(5),"must reach oversized five-product response");
  assert.ok(limits.includes(1),"must retry with a one-product response to avoid losing the catalogue");
});
