import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createReadModel,PUBLIC_READ_QUERIES} from "../backend/public-api/read-model.mjs";
import {createPublicApi,projectPublicCatalog} from "../backend/public-api/handler.mjs";
import {getProductBySlug} from "../lib/catalog/query.ts";
import {fetchPublicCatalog} from "../lib/public-api/client.ts";
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

test("L06 Song Natural: six SKUs in one family despite mixed categories; 0110 keeps three own photos",async()=>{
  const family="9e9c4137-2c6e-4c0f-80ff-1fbd64ae36fe";
  const codes=["0110","0114","0120","0124","8384","8394"];
  const skuRows=codes.map((sku,i)=>({
    sku_cong_ty:sku,
    name:"Song Natural "+sku,
    paper_size:i<4?"Học Sinh":"Sinh Viên",
    product_spec:{pages:i%2===0?"96":"200",ruling:"4 ô ly"},
    category_id:i===0?"f04":null,
    category_label:i===0?"F04 - Tập 100 gsm":null,
    family_id:family,family_label:"Song Natural",
  }));
  const mediaRows=[0,1,2].map(i=>({
    sku_cong_ty:"0110",
    asset_id:"00000000-0000-4000-8000-"+String(i+1).padStart(12,"0"),
    media_role:i===0?"cover":"gallery",
    sort_order:i,
  }));
  const model=createReadModel(async sql=>sql===PUBLIC_READ_QUERIES.p5Skus?skuRows:
    sql===PUBLIC_READ_QUERIES.p5Media?mediaRows:[],{enableP5:true});
  const catalog=projectPublicCatalog(await model.getPublicCatalog());
  assert.equal(catalog.products.length,1,"a family may span distinct category assignments");
  const product=catalog.products[0];
  assert.equal(product.name,"Song Natural");
  assert.equal(product.categoryId,"p5-f04","prefer a real category for the family breadcrumb");
  assert.deepEqual(product.variants.map(v=>v.sku),codes,"all published company codes survive");
  const oldSlug=async categoryId=>{
    const bytes=new TextEncoder().encode(family+"|"+categoryId+"|part:0");
    const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
    return "sku-"+Array.from(hash.slice(0,16),b=>b.toString(16).padStart(2,"0")).join("");
  };
  const oldNamed=await oldSlug("p5-f04"),oldUncategorized=await oldSlug("p5-uncategorized");
  assert.deepEqual(new Set(product.legacySlugs),new Set([oldNamed,oldUncategorized]));
  assert.equal(getProductBySlug(catalog,oldNamed),product,"old single-SKU link still resolves");
  assert.equal(getProductBySlug(catalog,oldUncategorized),product,"old 5-SKU link still resolves");
  const api=createPublicApi({getPublicCatalog:async()=>catalog,
    getPublicContent:async()=>({company:null,articles:[],promotions:[],dealerInformation:null})});
  const legacyResponse=await api.fetch(new Request("https://example.com/v1/public/products?slug="+oldNamed));
  assert.equal(legacyResponse.status,200,"public products API resolves old links too");
  assert.equal(product.media.length,3,"SKU 0110's three approved photos remain with the family");
  assert.deepEqual(product.media.map(photo=>photo.sku),["0110","0110","0110"]);
  const photos=product.media.map(m=>({src:m.r2Key,alt:m.alt,position:m.position,sku:m.sku}));
  assert.equal(photosForSku(photos,"0110").length,3);
  assert.equal(photosForSku(photos,"0114").length,0,"never borrow another SKU's cover");
  assert.doesNotMatch(JSON.stringify(catalog),/net_price|source_price|private\/catalogue/i);
});

test("L06 cross-category families retain all 60 approved SKU-scoped photos",async()=>{
  const family="9e9c4137-2c6e-4c0f-80ff-1fbd64ae36fe";
  const codes=["0110","0114","0124"];
  const skuRows=codes.map((sku,i)=>({
    sku_cong_ty:sku,name:"Song Natural "+sku,paper_size:"A5",
    product_spec:{},category_id:i===0?"cat-a":i===1?"cat-b":null,
    category_label:i===0?"A":i===1?"B":null,
    family_id:family,family_label:"Song Natural",
  }));
  const mediaRows=Array.from({length:60},(_,i)=>({
    sku_cong_ty:codes[Math.floor(i/20)],
    asset_id:"00000000-0000-4000-8000-"+String(i+1).padStart(12,"0"),
    media_role:i%20===0?"cover":"gallery",
    sort_order:i%20,
  }));
  const model=createReadModel(async sql=>sql===PUBLIC_READ_QUERIES.p5Skus?skuRows:
    sql===PUBLIC_READ_QUERIES.p5Media?mediaRows:[],{enableP5:true});
  const catalog=projectPublicCatalog(await model.getPublicCatalog());
  assert.equal(catalog.products.length,1);
  const [product]=catalog.products;
  assert.equal(product.media.length,60,"merging must not truncate previously approved galleries");
  const photos=product.media.map(m=>({src:m.r2Key,alt:m.alt,position:m.position,sku:m.sku}));
  for(const sku of codes)assert.equal(photosForSku(photos,sku).length,20);
});

test("L06 public SSR catalog retries oversized media pages without losing any products",async()=>{
  const categories=[{id:"cat",slug:"cat",name:"Tập vở",group:"stationery",sortOrder:1}];
  const products=Array.from({length:25},(_,i)=>({
    id:"product-"+i,categoryId:"cat",slug:"product-"+i,name:"Song Natural "+i,
    priceLabel:"Liên hệ báo giá",variants:[{
      sku:"S"+String(i).padStart(4,"0"),name:"Published SKU",price:null,
      specifications:{},
    }],media:[],
  }));
  const calls=[];
  const transport=async input=>{
    const url=new URL(String(input)),page=Number(url.searchParams.get("page"));
    const limit=Number(url.searchParams.get("limit"));calls.push({page,limit});
    if(limit>20)return new Response("{}",{status:200,headers:{"Content-Length":"9000001"}});
    const pagination={page,limit,total:products.length,totalPages:Math.ceil(products.length/limit)};
    return new Response(JSON.stringify({data:{categories,
      products:products.slice((page-1)*limit,page*limit)},pagination}),{
      status:200,headers:{"Content-Type":"application/json"},
    });
  };
  const catalog=await fetchPublicCatalog("https://public.example.com",transport);
  assert.equal(catalog.products.length,25);
  assert.deepEqual(calls.map(c=>c.limit),[1000,100,20,20]);
  assert.equal(catalog.products[24].variants[0].sku,"S0024");
});

test("L06 Worker accepts page 1001 when five-product fallback covers 5001 SKUs",async()=>{
  const categories=[{id:"cat",slug:"cat",name:"Tập vở",group:"stationery",sortOrder:1}];
  const products=Array.from({length:5001},(_,i)=>({
    id:"product-"+i,categoryId:"cat",slug:"product-"+i,name:"Approved product "+i,
    priceLabel:"Liên hệ báo giá",
    variants:[{sku:"SKU"+i,name:"Approved SKU",price:null,specifications:{}}],
    media:[],
  }));
  const api=createPublicApi({
    getPublicCatalog:async()=>({categories,products}),
    getPublicContent:async()=>({company:null,articles:[],promotions:[],dealerInformation:null}),
  });
  const last=await api.fetch(new Request("https://public.example.com/v1/public/catalog?page=1001&limit=5"));
  assert.equal(last.status,200,"the 1001st five-item page must not fail HTTP query validation");
  const data=await last.json();
  assert.equal(data.pagination.totalPages,1001);
  assert.equal(data.pagination.page,1001);
  assert.equal(data.data.products.length,1);
  assert.equal(data.data.products[0].variants[0].sku,"SKU5000");
  const single=await api.fetch(new Request("https://public.example.com/v1/public/catalog?page=5001&limit=1"));
  assert.equal(single.status,200,"a one-product page can reach the end of the supported catalogue");
  const outOfRange=await api.fetch(new Request("https://public.example.com/v1/public/catalog?page=10001&limit=1"));
  assert.equal(outOfRange.status,400,"the HTTP page number must remain bounded");
});

test("L06 same name without Admin family assignment does not auto-merge",async()=>{
  const skuRows=["0110","0114"].map(sku=>({
    sku_cong_ty:sku,name:"Song Natural",paper_size:"A5",product_spec:{},
    category_id:null,category_label:null,family_id:null,family_label:null,
  }));
  const model=createReadModel(async sql=>sql===PUBLIC_READ_QUERIES.p5Skus?skuRows:[],
    {enableP5:true});
  const catalog=projectPublicCatalog(await model.getPublicCatalog());
  assert.equal(catalog.products.length,2);
  assert.deepEqual(catalog.products.flatMap(p=>p.variants.map(v=>v.sku)),["0110","0114"]);
  const oldBytes=new TextEncoder().encode("0110|p5-uncategorized|part:0");
  const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",oldBytes));
  const oldSlug="sku-"+Array.from(digest.slice(0,16),b=>b.toString(16).padStart(2,"0")).join("");
  assert.equal(catalog.products[0].slug,oldSlug,"unchanged standalone links must remain stable");
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
  assert.match(ui,/const choices=visibleVariants\(product\.variants,audience,format\)/); // all real codes reachable with clear filters
  assert.doesNotMatch(ui,/fetch\(|DATABASE_URL|net_price/i);
});
