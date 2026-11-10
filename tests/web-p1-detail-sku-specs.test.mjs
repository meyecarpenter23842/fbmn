import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chooseVariant,paperSizes,paperWeights,photosForSku,
  availableVariantFacets,variantAudience,variantPaperFormat,visibleVariants,moveVariantFacet,
  shortVariantLabel} from "../lib/catalog/selection.ts";
import {relatedProducts} from "../lib/catalog/recommendations.ts";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const mk=(sku,name,paperSize,pageCount,ruling)=>({
  sku,name,price:null,specifications:{paperSize,pageCount,ruling}
});
test("Issue #130/G07: real code cards, original CTA plus visibility-gated mobile action",()=>{
  const page=read("app/san-pham/[slug]/page.tsx");
  const picker=read("components/catalogue-product-options.tsx");
  const related=read("components/catalogue-related-products.tsx");
  const css=read("app/catalog.css");
  assert.match(page,/<CatalogueProductOptions product={product} photos={images} glass={glass}[\s\S]*?initialSku=/);
  assert.match(page,/<CatalogueRelatedProducts items={recommendations.items} glass={glass}\/>/);
  assert.doesNotMatch(page,/const suggested=recommendations\.items\.map/);
  assert.doesNotMatch(page,/catalog-variants|catalog-variant-list/);
  assert.match(picker,/const selected=product\.variants\.find/);
  assert.match(picker,/const choices=visibleVariants\(product\.variants,audience,format\)/);
  assert.match(picker,/photosForSku\(photos,selected\.sku\)/);
  assert.match(picker,/availableVariantFacets\(product\.variants\)/);
  assert.match(picker,/Chọn mã sản phẩm/);
  assert.match(picker,/aria-pressed/);
  assert.match(picker,/aria-live="polite"/);
  assert.match(picker,/Mã \{variant\.sku\}/);
  assert.doesNotMatch(picker,/SKU này|>SKU|<select|giá NET|giá đại lý/i);
  assert.equal((picker.match(/Liên hệ báo giá/g)||[]).length,2);
  // The visual branch selects one CTA component, sharing the exact original quote label and URL.
  assert.match(picker,/const quoteLabel=/);
  assert.match(picker,/new IntersectionObserver/);
  assert.match(picker,/setShowMobileQuote\(!entry\.isIntersecting\)/);
  assert.match(picker,/glass&&showMobileQuote&&<div className="fb-song-mobile-cta"/);
  assert.equal((picker.match(/href="\/#contact"/g)||[]).length,3);
  assert.match(picker,/selected\.price\?\.kind==="retail"/);
  assert.match(picker,/extraInfo\.length>0&&<details className=\{glass\?"fb-song-details":"catalogue-extra-details"\}/);
  assert.match(picker,/specs\.binding/);
  assert.match(picker,/specs\.packaging\?\.unitsPerPack/);
  assert.match(picker,/specs\.packaging\?\.unitsPerCarton/);
  assert.match(css,/\.catalogue-extra-details summary:focus-visible/);
  assert.match(related,/import \{ProductCard\} from "\.\/catalog-ui"/);
  assert.match(related,/<ProductCard key={product.id} product={product} glass={glass}\/>/);
  assert.match(related,/Sản phẩm gợi ý/);
  assert.doesNotMatch(related,/scrollBy|useRef|"use client"|catalogue-related-card/);
  assert.match(css,/\.catalogue-variant-option\{[^\n]*height:var\(--fb-control-height-compact\)/);
  assert.match(css,/\.catalogue-variant-option__code\{[^\n]*font-size:var\(--fb-control-font-size\)/);
  assert.match(css,/@media\(max-width:780px\)/);
  assert.match(css,/@media\(max-width:700px\)\{\s*\.catalogue-variant-options\{grid-template-columns:1fr/);
  assert.match(css,/\.catalogue-related__grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css,/@media\(max-width:1100px\).*repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/@media\(max-width:700px\)[\s\S]*\.catalogue-related__grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\.catalogue-related__grid>\.catalog-product:nth-child\(n\+7\)/);
  assert.doesNotMatch(css,/\.catalogue-related__track|overflow-x:auto|scroll-snap-type/);
  assert.match(picker,/Bỏ lọc/);
  assert.doesNotMatch(picker,/>Tất cả<\/button>/);
  assert.match(page,/category\.id!=="p5-uncategorized"/);
});
test("Facet values are only from explicit source fields or name: never invent Học sinh/A4",()=>{
  const v=[
    mk("0110","(DG) F04 Song Of Nature 96TR Ô ly","Học Sinh",96,"4 ô ly"),
    mk("0114","Vở học sinh - Song of Nature - 96 trang","Học Sinh",96,"4 ô ly"),
    mk("0120","Song of Nature 200 trang","Học Sinh",200,"4 ô ly"),
    mk("0124","Vở học sinh 200 trang","Học Sinh",200,"4 ô ly"),
    mk("8381","(MG) SV4 Song Natural","Sinh Viên",120,"Kẻ ngang"),
    mk("8384","Vở sinh viên","Sinh Viên",120,"4 ô ly"),
    mk("8394","Vở sinh viên","Sinh Viên",200,"4 ô ly"),
    mk("M439","Vở may chỉ bìa bồi (A4) - Song Natural","A4",200,"Kẻ ngang"),
    mk("L009","Không rõ nhóm/khổ",undefined,undefined,undefined),
  ];
  assert.deepEqual(availableVariantFacets(v),{audiences:["Học sinh","Sinh viên"],formats:["A4"]});
  assert.equal(variantAudience(v[7]),"");
  assert.equal(variantPaperFormat(v[0]),"");
  assert.equal(variantPaperFormat(v[7]),"A4");
  assert.equal(visibleVariants(v,"","").length,9);
  assert.equal(visibleVariants(v,"Học sinh","").length,4);
  assert.equal(visibleVariants(v,"","A4").length,1);
  assert.equal(visibleVariants(v,"Học sinh","A4").length,0);
  const jump=moveVariantFacet(v,v[0],"format","A4","Học sinh","");
  assert.deepEqual(jump,{audience:"",format:"A4",sku:"M439"});
  const reset=moveVariantFacet(v,v[7],"audience","Sinh viên","","A4");
  assert.equal(reset.sku,"8381");
  assert.equal(reset.format,"");
  assert.equal(new Set(v.map(x=>x.sku)).size,9);
  assert.equal(shortVariantLabel(v[0]),"96 trang · 4 ô ly");
  assert.deepEqual(paperSizes(v),["A4","Học Sinh","Sinh Viên"]);
  assert.deepEqual(paperWeights(v,"Học Sinh"),[]);
  assert.ok(v.includes(chooseVariant(v,v[0],"paperSize","A4")));
  const photos=[{src:"/own.webp",alt:"Own",sku:"0110",position:0},
    {src:"/other.webp",alt:"Other",sku:"0114",position:1}];
  assert.deepEqual(photosForSku(photos,"0110").map(x=>x.src),["/own.webp"]);
  assert.deepEqual(photosForSku(photos,"L009"),[]);
});
test("Recommendations only contain other real public families, never fake suggestions",()=>{
  const prod=(id,name,categoryId,format,ruling)=>({id,slug:id,name,categoryId,
    variants:[mk("SKU-"+id,name,format,96,ruling)],media:[],priceLabel:null});
  const catalog={categories:[
    {id:"school",name:"Tập học sinh",group:"school_notebook",slug:"school",sortOrder:0},
    {id:"office",name:"Văn phòng phẩm",group:"stationery",slug:"office",sortOrder:0}
  ],products:[prod("one","Song Natural","school","A4","4 ô ly"),
    prod("two","Song Classic","school","A4","4 ô ly"),
    prod("three","Sổ xếp giấy","office","A4","Kẻ ngang")]};
  const result=relatedProducts(catalog,catalog.products[0]);
  assert.equal(result.title,"Sản phẩm gợi ý");
  assert.deepEqual(result.items.map(p=>p.id),["two","three"]);
  assert.ok(!result.items.some(p=>p.id==="one"));
  assert.deepEqual(relatedProducts({categories:[],products:[catalog.products[0]]},catalog.products[0]).items,[]);
  const bigger={...catalog,products:[catalog.products[0],...Array.from({length:18},(_,i)=>prod(
    "suggestion-"+i,"Song Natural "+i,"school","A4","4 ô ly"))]};
  const suggested=relatedProducts(bigger,bigger.products[0]);
  assert.equal(suggested.items.length,12);
  assert.ok(suggested.items.every(p=>p.id!=="one"));

});
