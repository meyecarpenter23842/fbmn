import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DEFAULT_HOME_LAYOUT,selectHomeCatalog} from "../lib/catalog/home.ts";
import {handleHomeLayout,validateHomeLayout} from "../backend/admin-api/home-layout-service.mjs";
import {createAdminApi} from "../backend/admin-api/handler.mjs";
import {projectPublicHomeLayout,createPublicApi} from "../backend/public-api/handler.mjs";

const cat=id=>({id,slug:id+"-slug",name:id,sortOrder:0,group:"school_notebook"});
const sku=(id,catId,code)=>({id,name:id,slug:"sku-"+id,categoryId:catId,
 priceLabel:"Liên hệ báo giá",variants:[{sku:code,name:id,specifications:{},price:null}],media:[]});
const base=()=>({categories:[cat("a"),cat("b"),cat("c")],
 products:[sku("a1","a","00011"),sku("a2","a","00012"),sku("b1","b","00013"),sku("c1","c","00014")]});
const config={categoryIds:["b","a"],featuredSkus:["00012","00013"],categoryLimit:2,productLimit:2,
 sectionOrder:["products","categories"],revision:2};

test("DL4 homepage only reorders already-public catalogue without creating cards or changing SKU",()=>{
 const source=base(),before=JSON.stringify(source);
 const picked=selectHomeCatalog(source,config);
 assert.deepEqual(picked.categories.map(c=>c.id),["b","a"]);
 assert.deepEqual(picked.products.map(p=>p.id),["a2","b1"]);
 assert.equal(picked.products[0].variants[0].sku,"00012");
 assert.equal(JSON.stringify(source),before);
 const hidden={...config,featuredSkus:["not-published","00012"],categoryIds:["c"]};
 const selection=selectHomeCatalog(source,hidden);
 assert.deepEqual(selection.products.map(p=>p.id),["c1"]);
 assert.equal(selectHomeCatalog(base()).products.length,DEFAULT_HOME_LAYOUT.productLimit);
});
test("DL4 forbids duplicates, phantom categories, unpublished SKUs and unsafe limits",()=>{
 const a={categories:[{id:"p5-uncategorized",name:"Chưa phân loại",productCount:1}],
  skus:[{sku:"00013",name:"Vở",categoryId:"p5-uncategorized"}]};
 const good={...DEFAULT_HOME_LAYOUT,categoryIds:["p5-uncategorized"],featuredSkus:["00013"]};
 assert.equal(validateHomeLayout(good,a),true);
 for(const invalid of [
  {...good,categoryIds:["p5-bogus"]},{...good,featuredSkus:["00012"]},
  {...good,featuredSkus:["00013","00013"]},{...good,sectionOrder:["products","products"]},
  {...good,categoryLimit:99},{...good,productLimit:0},{...good,revision:0}
 ])assert.equal(validateHomeLayout(invalid,a),false);
});
test("DL4 Owner API enforces auth and revision/audit on save/reset",async()=>{
 const row={category_ids:[],featured_skus:[],category_limit:6,product_limit:4,
  section_order:["categories","products"],revision:1};
 const seen=[];
 const eligible=[{sku:"00013",name:"Vở",category_id:null,category_label:null}];
 const client={query:async(sql,args=[])=>{
   seen.push({sql,args});
   if(sql.startsWith("SELECT category_ids"))return {rows:[{...row}]};
   if(sql.startsWith("SELECT s.sku_cong_ty"))return {rows:eligible};
   if(sql.startsWith("UPDATE fbmn_catalog_private.web_home_layout")){
    if(args[5]!==row.revision)return {rows:[]};
    row.category_ids=args[0];row.featured_skus=args[1];
    row.category_limit=args[2];row.product_limit=args[3];row.section_order=args[4];
    row.revision++;return {rows:[{...row}]};
   }
   return {rows:[]};
 }};
 const db=async work=>work(client);
 const url="https://admin.example/v1/admin/website/home-layout";
 const get=await handleHomeLayout({request:new Request(url),actor:{subject:"owner"},db});
 assert.equal(get.status,200);
 assert.equal((await get.json()).data.layout.revision,1);
 const save=new Request(url,{method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({...DEFAULT_HOME_LAYOUT,revision:1,operation:"save",
    categoryIds:["p5-uncategorized"],featuredSkus:["00013"],productLimit:5})});
 const response=await handleHomeLayout({request:save,actor:{subject:"owner"},db});
 assert.equal(response.status,200);
 assert.equal((await response.json()).data.layout.revision,2);
 const audit=seen.find(x=>x.sql.startsWith("INSERT INTO fbmn_catalog_private.web_home_layout_audit"));
 assert.equal(audit.args[1],"owner");
 assert.equal(audit.args[2],"save");
 const stale=await handleHomeLayout({request:new Request(url,{method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({...DEFAULT_HOME_LAYOUT,revision:1,operation:"reset"})}),actor:{subject:"owner"},db});
 assert.equal(stale.status,409);
 assert.equal(seen.filter(x=>x.sql==="ROLLBACK").length,1);
 const reset=await handleHomeLayout({request:new Request(url,{method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({revision:2,operation:"reset"})}),actor:{subject:"owner"},db});
 assert.equal(reset.status,200);
 assert.deepEqual((await reset.json()).data.layout.featuredSkus,[]);
 assert.equal(row.revision,3);
});
test("DL4 private endpoint rejects non-Owner before touching database",async()=>{
 let called=false;
 const admin=createAdminApi({
  verifyToken:async()=> "actor",
  loadActor:async()=>({role:"editor",enabled:true,channels:["public_web"]}),
  listChannels:async()=>[],recordAudit:async()=>{},
  catalogueDb:async()=>{called=true;throw Error("must not query");},
 });
 const request=new Request("https://admin.example/v1/admin/website/home-layout",{
  headers:{Authorization:"Bearer abc.def.ghi"}});
 assert.equal((await admin.fetch(request)).status,403);
 assert.equal(called,false);
 assert.equal((await admin.fetch(new Request(request.url))).status,401);
});
test("DL4 public route has explicit gate, allowlist, no secrets and no caching",async()=>{
 const catalog=async()=>({categories:[],products:[]}),content=async()=>({company:null,articles:[],promotions:[],dealerInformation:null});
 const unready=createPublicApi({getPublicCatalog:catalog,getPublicContent:content});
 assert.equal((await unready.fetch(new Request("https://worker.example/v1/public/home-layout"))).status,404);
 const enabled=createPublicApi({getPublicCatalog:catalog,getPublicContent:content,
   getPublicHomeLayout:async()=>({...DEFAULT_HOME_LAYOUT,revision:7}),homeLayoutEnabled:true});
 const response=await enabled.fetch(new Request("https://worker.example/v1/public/home-layout"));
 assert.equal(response.status,200);
 assert.equal(response.headers.get("Cache-Control"),"no-store");
 const data=await response.json();
 assert.deepEqual(Object.keys(data.data).sort(),["categoryIds","categoryLimit","featuredSkus","productLimit","revision","sectionOrder"]);
 assert.equal((await enabled.fetch(new Request("https://worker.example/v1/public/home-layout?x=y"))).status,400);
 assert.throws(()=>projectPublicHomeLayout({...DEFAULT_HOME_LAYOUT,priceNet:100,categoryIds:["bad-id"]}));
});
test("DL4 source remains channel-scoped and release-gated",()=>{
 const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
 const admin=read("apps/admin/app/page.tsx"),web=read("app/page.tsx");
 const worker=read("backend/public-api/staging-worker.mjs");
 const migration=read("backend/neon/migrations/20261109_dl4_web_home_layout.up.sql");
 assert.match(admin,/home-layout/);
 assert.match(web,/getPublicHomeLayout/);
 assert.match(web,/layout\.sectionOrder\.map/);
 assert.match(worker,/PUBLIC_DL4_ENABLED==="true"/);
 assert.match(migration,/security_barrier=true/);
 assert.match(migration,/web_home_layout_audit/);
 assert.match(migration,/GRANT SELECT ON fbmn_public.v_web_home_layout TO fbmn_public_reader/);
 assert.doesNotMatch(migration,/GRANT .*net|GRANT .*pricebook/i);
});
