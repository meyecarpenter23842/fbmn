import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { selectHomeCatalog, HOME_CATEGORY_LIMIT, HOME_PRODUCT_LIMIT } from "../lib/catalog/home.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const cat=(id,sortOrder,name=id)=>({id,slug:id+"-slug",name,sortOrder,group:"school_notebook"});
const p=(id,categoryId,{name=id,sku="00"+id,media=[]}={})=>({
 id,categoryId,name,slug:"sku-"+id,priceLabel:"Liên hệ báo giá",
 variants:[{sku,name,specifications:{paperSize:"A4"},price:null}],media
});

test("DL3 only exposes categories with actual public products, in approved sort order",()=>{
 const original={
  categories:[cat("late",9),cat("empty",0),cat("first",1)],
  products:[p("p2","late"),p("p1","first")]
 };
 const selection=selectHomeCatalog(original);
 assert.deepEqual(selection.categories.map(c=>c.id),["first","late"]);
 assert.deepEqual(selection.categories.map(c=>c.productCount),[1,1]);
 assert.deepEqual(selection.products.map(x=>x.id),["p1","p2"]);
 assert.equal(original.categories[0].id,"late","selection never mutates DTO ordering");
 assert.equal(selectHomeCatalog({categories:[],products:[]}).products.length,0);
 assert.deepEqual(selectHomeCatalog({categories:[cat("empty",0)],products:[]}).categories,[]);
});

test("DL3 preserves published SKU strings and approved media; orphan/empty families cannot appear",()=>{
 const realMedia={r2Key:"products/catalogue/11111111-1111-1111-1111-111111111111-v1.webp",
    position:0,alt:"Bìa xác minh"};
 const data={categories:[cat("a",0),cat("b",1)],
 products:[
  p("real","a",{sku:"000091",media:[realMedia]}),
  p("empty","a",{name:"Không có SKU"}), // override below to create no variants
  p("orphan","unknown",{name:"Mã không thuộc danh mục"}),
  p("second","b",{sku:"000005"})
 ]};
 data.products[1].variants=[];
 const result=selectHomeCatalog(data);
 assert.deepEqual(result.products.map(x=>x.id),["real","second"]);
 assert.equal(result.products[0].variants[0].sku,"000091");
 assert.deepEqual(result.categories[0].representativeMedia,realMedia);
 assert.equal(result.categories[1].representativeMedia,null);
 assert.equal(data.products.length,4);
});

test("DL3 limits to 6 public categories and 4 products, without bestseller or hidden duplication",()=>{
 const categories=Array.from({length:9},(_,i)=>cat("c"+i,i));
 const products=categories.flatMap(c=>[p(c.id+"-a",c.id),p(c.id+"-b",c.id)]);
 const selection=selectHomeCatalog({categories,products});
 assert.equal(HOME_CATEGORY_LIMIT,6);
 assert.equal(HOME_PRODUCT_LIMIT,4);
 assert.equal(selection.categories.length,6);
 assert.equal(selection.products.length,4);
 assert.deepEqual(selection.products.map(x=>x.id),["c0-a","c1-a","c2-a","c3-a"]);
 assert.equal(new Set(selection.products.map(x=>x.id)).size,4);
});

test("DL3 SSR reads the same public_web adapter as listing with explicit loading/empty/error",()=>{
 const home=read("app/page.tsx");
 const listing=read("app/san-pham/page.tsx");
 assert.match(home,/getPublicCatalog\(\)/);
 assert.match(listing,/getPublicCatalog\(\)/);
 assert.match(home,/selectHomeCatalog\(catalog\)/);
 assert.match(home,/<Suspense fallback=/);
 assert.match(home,/aria-busy="true"/);
 assert.match(home,/role="alert"/);
 assert.match(home,/role="status"/);
 assert.match(home,/HomePublicCatalogue/);
 assert.match(home,/CmsBannerSlot items=\{cms\} slot="home\.hero"/);
 assert.match(home,/CmsBannerSlot items=\{cms\} slot="home\.after_products"/);
 assert.match(home,/CmsFeaturedSlot items=\{cms\} slot="home\.news_featured"/);
 assert.match(home,/CmsFeaturedSlot items=\{cms\} slot="home\.promotion_featured"/);
 assert.doesNotMatch(home,/from "@\/lib\/ui-preview"|previewProducts|MẪU GIAO DIỆN|ref-demo-badge/);
 assert.doesNotMatch(home,/Mẫu trưng bày|Vở A4|Vở B5|ref-promos/);
});

test("DL3 cards contain one true product link, SKU and optional approved cover, no price leak",()=>{
 const card=read("components/home-product-card.tsx");
 const nav=read("components/category-navigation.tsx");
 assert.match(card,/product\.variants\[0\]\?\.sku/);
 assert.match(card,/product\.variants\.length/);
 assert.match(card,/getPublishedProductImageUrl/);
 assert.match(card,/CatalogProductImage/);
 assert.match(card,/GlassCard hover linkCard/);
 assert.match(card,/href=\{"\/san-pham\/" \+ encodeURIComponent\(product\.slug\)\}/);
 assert.equal((card.match(/<Link\b/g)||[]).length,1);
 assert.doesNotMatch(card,/NET_PRICE|dealerPrice|amountVnd|cart|checkout|MẪU/);
 assert.match(nav,/href=\{"\/danh-muc\/" \+ encodeURIComponent\(category\.slug\)\}/);
 assert.doesNotMatch(nav,/ui-preview|NotebookArt|StationeryArt/);
 assert.match(read("lib/catalog/adapter.ts"),/cache\(async \(\): Promise<PublicCatalog>/);
 assert.match(read("lib/public-api/client.ts"),/cache: "no-store"/);
});
