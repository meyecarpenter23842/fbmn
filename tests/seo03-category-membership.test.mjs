import test from "node:test";
import assert from "node:assert/strict";
import {catalogueListingCards,searchCatalog} from "../lib/catalog/query.ts";

const catA="p5-11111111-1111-4111-8111-111111111111";
const catB="p5-22222222-2222-4222-8222-222222222222";
const spec={paperSize:"A5",pageCount:96};
const catalogue={
 categories:[
  {id:catA,slug:"cat-"+"1".repeat(32),name:"Tập học sinh",group:"school_notebook",sortOrder:1},
  {id:catB,slug:"cat-"+"2".repeat(32),name:"Tập nhóm khác",group:"school_notebook",sortOrder:2}
 ],
 products:[{
  id:"family-1",name:"Mẫu kiểm thử",slug:"sku-"+"a".repeat(32),categoryId:catA,
  priceLabel:null,media:[],variants:[
   {sku:"SKU-001",name:"Mẫu A",categoryId:catA,specifications:spec,price:null},
   {sku:"SKU-002",name:"Mẫu B",categoryId:catB,specifications:{paperSize:"B5",pageCount:200},price:null}
  ]
 }]
};
const filters={q:"",group:"",size:"",gsm:null,sort:"name",page:1,categoryId:catB};

test("SEO03 category membership uses identical family and SKU display modes as visible catalogue",()=>{
 const familyCards=catalogueListingCards(catalogue,{});
 assert.equal(familyCards.length,1);
 assert.equal(familyCards[0].categoryId,catA);
 assert.equal(searchCatalog(catalogue,filters,{}).total,0);
 const skuModes={[catB]:"sku"};
 const cards=catalogueListingCards(catalogue,skuModes);
 assert.equal(cards.filter(x=>x.categoryId===catB).length,1);
 assert.equal(searchCatalog(catalogue,filters,skuModes).total,1);
 assert.equal(searchCatalog(catalogue,filters,skuModes).items[0].listingSku,"SKU-002");
});
