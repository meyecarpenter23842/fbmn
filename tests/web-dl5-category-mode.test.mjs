import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {searchCatalog,parseCatalogFilters,PAGE_SIZE} from "../lib/catalog/query.ts";
import {projectPublicCatalog,projectPublicCategoryDisplay,createPublicApi} from "../backend/public-api/handler.mjs";
import {createAdminApi} from "../backend/admin-api/handler.mjs";

const A="p5-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const B="p5-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const uuid=n=>String(n).padStart(8,"0")+"-1111-1111-1111-111111111111";
const photo=(sku,n)=>({sku,r2Key:"products/catalogue/"+uuid(n)+"-v1.webp",position:n,alt:"Cover "+sku});
const variant=(sku,categoryId,size)=>({sku,name:"Tên "+sku,categoryId,
 specifications:{paperSize:size,paperWeightGsm:80},price:null});
const product={id:"family-1",name:"Mẫu chính",slug:"sku-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",categoryId:A,
 priceLabel:"Liên hệ báo giá",variants:[variant("0001",A,"A4"),variant("0002",A,"B5"),variant("0003",B,"A4")],
 media:[photo("0001",1),photo("0001",2),photo("0002",3),photo("0003",4)]};
const data={categories:[{id:A,slug:"a",name:"A",group:"school_notebook",sortOrder:1},
 {id:B,slug:"b",name:"B",group:"school_notebook",sortOrder:2}],products:[product]};
const filters=(q="",categoryId=undefined)=>({...parseCatalogFilters(new URLSearchParams(q)),categoryId});
const mode={[A]:"sku"};
test("DL5 Family is default and SKU mode creates only view cards with exact company codes and scoped covers",()=>{
 const original=JSON.stringify(data);
 const grouped=searchCatalog(data,filters("",A));
 assert.equal(grouped.total,1);
 assert.equal(grouped.items[0].variants.length,3);
 const expanded=searchCatalog(data,filters("",A),mode);
 assert.equal(expanded.total,2);
 assert.deepEqual(expanded.items.map(item=>item.listingSku),["0001","0002"]);
 assert.deepEqual(expanded.items[0].media.map(p=>p.position),[1,2]);
 assert.deepEqual(expanded.items[1].media.map(p=>p.position),[3]);
 assert.deepEqual(expanded.items.map(item=>item.variants[0].sku),["0001","0002"]);
 assert.equal(searchCatalog(data,filters("",B),mode).items[0].listingSku,undefined);
 assert.equal(searchCatalog(data,filters("",B),mode).items[0].initialSku,"0003");
 assert.equal(JSON.stringify(data),original);
});
test("DL5 search and facets operate on the visible SKU card, not hidden siblings",()=>{
 assert.deepEqual(searchCatalog(data,filters("q=0002",A),mode).items.map(x=>x.listingSku),["0002"]);
 assert.equal(searchCatalog(data,filters("kho=A4",A),mode).total,1);
 assert.equal(searchCatalog(data,filters("kho=B5",A),mode).items[0].listingSku,"0002");
 assert.equal(searchCatalog(data,filters("kho=B5",B),mode).total,0);
 const first=searchCatalog(data,filters("",A),mode);
 assert.deepEqual(first.sizes,["A4","B5"]);
});
test("DL5 pagination counts SKU cards and preserves leading-zero company codes",()=>{
 const large={categories:data.categories,products:[{...product,
  variants:Array.from({length:PAGE_SIZE+1},(_,i)=>variant(String(i).padStart(4,"0"),A,"A4")),
  media:[]}]};
 assert.equal(searchCatalog(large,filters("",A)).total,1);
 const p1=searchCatalog(large,filters("trang=1",A),mode);
 const p2=searchCatalog(large,filters("trang=2",A),mode);
 assert.equal(p1.total,PAGE_SIZE+1);
 assert.equal(p1.items.length,PAGE_SIZE);
 assert.equal(p1.pages,2);
 assert.equal(p2.items.length,1);
 assert.equal(p2.items[0].listingSku,String(PAGE_SIZE).padStart(4,"0"));
});
test("DL5 public DTO accepts only actual published variant categories and media per SKU",()=>{
 const result=projectPublicCatalog(data);
 assert.equal(result.products[0].variants[0].categoryId,A);
 assert.equal(result.products[0].variants[2].categoryId,B);
 assert.equal(result.products[0].media.length,4);
 assert.throws(()=>projectPublicCatalog({...data,products:[{...product,variants:[{...product.variants[0],categoryId:"private"}]}]}));
});
test("DL5 public mode settings are allowlisted, gated and no-store",async()=>{
 const a=createPublicApi({getPublicCatalog:async()=>data,getPublicContent:async()=>({company:null,articles:[],promotions:[],dealerInformation:null})});
 const url="https://worker.example/v1/public/category-display";
 assert.equal((await a.fetch(new Request(url))).status,404);
 const api=createPublicApi({getPublicCatalog:async()=>data,getPublicContent:async()=>({company:null,articles:[],promotions:[],dealerInformation:null}),
  getPublicCategoryDisplay:async()=>({modes:[{categoryId:A,mode:"sku"}]}),categoryDisplayEnabled:true});
 const response=await api.fetch(new Request(url));
 assert.equal(response.status,200);
 assert.equal(response.headers.get("Cache-Control"),"no-store");
 assert.deepEqual((await response.json()).data,{modes:[{categoryId:A,mode:"sku"}]});
 assert.equal((await api.fetch(new Request(url+"?sku=1"))).status,400);
 assert.throws(()=>projectPublicCategoryDisplay({modes:[{categoryId:A,mode:"family"}]}));
 assert.throws(()=>projectPublicCategoryDisplay({modes:[{categoryId:A,mode:"sku"},{categoryId:A,mode:"sku"}]}));
});
test("DL5 public projection supports all 2,000 Admin categories and refuses 2,001",()=>{
 const ids=Array.from({length:2000},(_,i)=>"p5-"+String(i+1).padStart(8,"0")+"-1111-1111-1111-111111111111");
 const modes=ids.map(categoryId=>({categoryId,mode:"sku"}));
 assert.equal(projectPublicCategoryDisplay({modes}).modes.length,2000);
 assert.throws(()=>projectPublicCategoryDisplay({modes:[...modes,{categoryId:"p5-00002001-1111-1111-1111-111111111111",mode:"sku"}]}));
 const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
 assert.match(read("backend/public-api/read-model.mjs"),/categoryDisplay: "SELECT[^\n]+LIMIT 2001"/);
 assert.match(read("backend/public-api/read-model.mjs"),/execute\("categoryDisplay",2000\)/);
 assert.match(read("lib/public-api/client.ts"),/const rows=arr\(data.modes,2000\)/);
});
test("DL5 non-Owner cannot change category modes or reach DB",async()=>{
 let accessed=false;
 const api=createAdminApi({verifyToken:async()=>"editor",loadActor:async()=>({role:"editor",enabled:true,channels:["public_web"]}),
  listChannels:async()=>[],recordAudit:async()=>{},catalogueDb:async()=>{accessed=true;}});
 const response=await api.fetch(new Request("https://admin.example/v1/admin/website/category-display",{
  headers:{Authorization:"Bearer abc.def.ghi"}}));
 assert.equal(response.status,403);assert.equal(accessed,false);
});
test("DL5 migration, Website and Admin follow single-source and privacy constraints",()=>{
 const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
 const up=source("backend/neon/migrations/20261110_dl5_web_category_display.up.sql");
 const web=source("app/danh-muc/[slug]/page.tsx");
 const detail=source("app/san-pham/[slug]/page.tsx");
 const admin=source("apps/admin/app/page.tsx");
 assert.match(up,/security_barrier=true/);
 assert.match(up,/web_category_display_audit/);
 assert.match(up,/GRANT SELECT ON fbmn_public.v_web_category_display TO fbmn_public_reader/);
 assert.doesNotMatch(up,/net_price|pricebook|GRANT .*net/i);
 assert.match(web,/modeByCategory=\{modes\}/);
 assert.match(detail,/alternates:\{canonical/);
 assert.match(detail,/initialSku=/);
 assert.match(admin,/category-display/);
 const manager=source("apps/admin/app/category-display-manager.tsx");
 assert.match(manager,/<ProductModal/);
 assert.match(manager,/setEditing\(c\)/);
 assert.match(manager,/Lưu cấu hình/);
 assert.match(source("backend/public-api/staging-worker.mjs"),/categoryDisplayEnabled:env\.PUBLIC_P5_ENABLED==="true"/);
});
