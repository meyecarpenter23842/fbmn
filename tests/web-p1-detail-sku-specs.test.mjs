import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chooseVariant,paperSizes,paperWeights,photosForSku,
  groupedProductTypes,productType,shortVariantLabel} from "../lib/catalog/selection.ts";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Issue #130 follow-up uses concise customer language, without duplicate specifications or CTA",()=>{
  const page=read("app/san-pham/[slug]/page.tsx");
  const picker=read("components/catalogue-product-options.tsx");
  const css=read("app/catalog.css");
  assert.match(page,/<CatalogueProductOptions product={product} photos={images}\/>/);
  assert.doesNotMatch(page,/catalog-variants|catalog-variant-list|product\.variants\.map/);
  assert.doesNotMatch(css,/catalog-variants|catalog-variant-list|catalog-variant__price/);
  assert.match(picker,/const selected=product\.variants\.find/);
  assert.match(picker,/groupedProductTypes\(product\.variants\)/);
  assert.match(picker,/product\.variants\.filter/);
  assert.match(picker,/shortVariantLabel\(variant\)/);
  assert.match(picker,/aria-pressed/);
  assert.match(picker,/aria-live="polite"/);
  assert.match(picker,/photosForSku\(photos,selected\.sku\)/);
  assert.match(picker,/Loại sản phẩm/);
  assert.match(picker,/groups\.length===1&&groups\[0\]!==""/);
  assert.match(picker,/Loại \/ khổ:/);
  assert.match(css,/\.catalogue-single-type/);
  assert.match(picker,/Chọn quy cách/);
  assert.doesNotMatch(picker,/Khổ giấy|catalogue-sku-specs|<select|SKU này|>SKU|Có \{product\.variants\.length\}|giá NET|giá đại lý/i);
  assert.equal((picker.match(/Liên hệ báo giá/g)||[]).length,1);
  assert.match(css,/\.catalogue-variant-options/);
  assert.match(css,/\.catalogue-option-group:focus-within~\.catalogue-option-announcement/);
  assert.match(css,/@media\(max-width:780px\)\{\.catalogue-option-announcement\{position:static/);
  assert.match(css,/\.catalogue-variant-option\{[^\n]*height:var\(--fb-control-height-compact\)/);
  assert.match(css,/\.catalogue-variant-option__code\{font-size:var\(--fb-control-font-size\)/);
  assert.match(css,/height:var\(--fb-control-height-touch\)/);
  assert.doesNotMatch(css,/\.catalogue-variant-option\{[^\n]*min-height:64px/);
  assert.match(css,/@media\(max-width:500px\)/);
  assert.match(page,/category\.id!=="p5-uncategorized"/);
});

test("Eight family variants plus unclassified items stay selectable with accurate concise labels",()=>{
  const variants=[
    {sku:"0110",name:"(DG) F04 - Song Of Nature 96TR Ô ly",price:null,
      specifications:{paperSize:"Học Sinh",pageCount:96,ruling:"4 ô ly"}},
    {sku:"0114",name:"Vở học sinh - SONG OF NATURE - 96 trang - 4 ô ly",price:null,
      specifications:{paperSize:"Học Sinh",pageCount:96,ruling:"4 ô ly"}},
    ...Array.from({length:6},(_,i)=>({sku:String(120+i).padStart(4,"0"),
      name:"Song Natural sản phẩm "+i,price:null,
      specifications:{paperSize:i<3?"Sinh Viên":"A4",pageCount:i%2?200:120,ruling:"Kẻ ngang"}})),
    {sku:"L009",name:"Thiếu quy cách",price:null,specifications:{}},
  ];
  const groups=groupedProductTypes(variants);
  assert.deepEqual(groups,["Học Sinh","Sinh Viên","A4",""]);
  assert.equal(new Set(variants.map(v=>v.sku)).size,9);
  assert.equal(groups.flatMap(group=>variants.filter(v=>productType(v)===group)).length,9);
  assert.equal(shortVariantLabel(variants[0]),"96 trang · 4 ô ly");
  assert.equal(shortVariantLabel(variants[1]),"96 trang · 4 ô ly");
  assert.equal(shortVariantLabel(variants[8]),"Quy cách khác");
  assert.equal(variants[0].sku,"0110");
  assert.deepEqual(paperSizes(variants),["A4","Học Sinh","Sinh Viên"]);
  assert.deepEqual(paperWeights(variants,"A4"),[]);
  assert.ok(variants.includes(chooseVariant(variants,variants[0],"paperSize","A4")));
  const media=[{src:"/own.webp",alt:"Bìa đúng mã",sku:"0110",position:0},
    {src:"/other.webp",alt:"Bìa mã khác",sku:"0114",position:1}];
  assert.deepEqual(photosForSku(media,"0110").map(p=>p.src),["/own.webp"]);
  assert.deepEqual(photosForSku(media,"L009"),[]);
});
