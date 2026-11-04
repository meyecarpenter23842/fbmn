import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chooseVariant,paperSizes,paperWeights,photosForSku} from "../lib/catalog/selection.ts";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Issue #130 removes the static variant grid; the selected SKU owns one dynamic specification panel",()=>{
  const page=read("app/san-pham/[slug]/page.tsx");
  const picker=read("components/catalogue-product-options.tsx");
  const css=read("app/catalog.css");
  assert.match(page,/<CatalogueProductOptions product={product} photos={images}\/>/);
  assert.doesNotMatch(page,/catalog-variants|catalog-variant-list|product\.variants\.map/);
  assert.doesNotMatch(css,/catalog-variants|catalog-variant-list|catalog-variant__price/);
  assert.match(picker,/const selected=product\.variants\.find/);
  assert.match(picker,/const specRows:/);
  assert.match(picker,/specRows\.map/);
  assert.match(picker,/aria-live="polite"/);
  assert.match(picker,/catalogue-sku-specs/);
  assert.match(picker,/const candidates=product\.variants;/);
  assert.match(picker,/photosForSku\(photos,selected\.sku\)/);
  assert.match(picker,/specs\.packaging\?\.unitsPerPack/);
  assert.match(picker,/specs\.packaging\?\.unitsPerCarton/);
  assert.doesNotMatch(picker,/hardcoded|price\.kind==="net"|fetch\(/i);
  assert.match(css,/\.catalogue-sku-specs__row/);
});

test("Issue #130 accepts eight Song Natural SKUs and a ninth without fixed size or price assumptions",()=>{
  const variants=Array.from({length:8},(_,i)=>({
    sku:String(110+i).padStart(4,"0"),
    name:"Song Natural "+i,price:null,
    specifications:{paperSize:i<4?"A5":"B5",paperWeightGsm:i%2?80:70,
      pageCount:i%2?200:96,ruling:i%2?"4 ô ly":"Kẻ ngang"},
  }));
  variants.push({sku:"L009",name:"Song Natural thiếu quy cách",price:null,
    specifications:{paperSize:undefined,paperWeightGsm:undefined,pageCount:undefined,ruling:undefined}});
  assert.equal(variants.length,9);
  assert.equal(new Set(variants.map(v=>v.sku)).size,9);
  assert.deepEqual(paperSizes(variants),["A5","B5"]);
  assert.deepEqual(paperWeights(variants,"A5"),[70,80]);
  let chosen=chooseVariant(variants,variants[0],"paperSize","B5");
  assert.ok(variants.includes(chosen));
  assert.equal(chosen.specifications.paperSize,"B5");
  chosen=chooseVariant(variants,chosen,"paperWeightGsm",80);
  assert.equal(chosen.specifications.paperWeightGsm,80);
  assert.equal(variants.find(v=>v.sku==="L009").specifications.pageCount,undefined);
  const media=[{src:"/own.webp",alt:"Bìa đúng SKU",sku:"0110",position:0},
    {src:"/other.webp",alt:"Bìa SKU khác",sku:"0111",position:1}];
  assert.deepEqual(photosForSku(media,"0110").map(p=>p.src),["/own.webp"]);
  assert.deepEqual(photosForSku(media,"L009"),[]);
});
