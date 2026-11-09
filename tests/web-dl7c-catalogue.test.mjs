import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {cataloguePublicAssetKey,parseCataloguePublicQuery,handlePublicCatalogueRequest}
 from "../backend/public-api/catalogue-books-public.mjs";
import {createReadModel,PUBLIC_READ_QUERIES} from "../backend/public-api/read-model.mjs";
const ID="123e4567-e89b-42d3-a456-426614174000",ASSET="123e4567-e89b-42d3-a456-426614174001";
const URL_ROOT="https://public.example/v1/public/";
const req=(suffix,method="GET",origin)=>new Request(URL_ROOT+suffix,
 {method,headers:origin?{origin}:{}});
const book={id:ID,title:"Catalogue Futurebook",edition:"2026"};
const asset={id:ASSET,kind:"page",sortOrder:0,width:1200,height:1600};
const key="books/"+ID+"/pages/"+ASSET+".webp";
const readFile=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("DL7C only exact id query accepted, no caller-supplied R2 key or raw URL",()=>{
 assert.deepEqual(parseCataloguePublicQuery(req("catalogue-books").url),{kind:"list"});
 assert.deepEqual(parseCataloguePublicQuery(req("catalogue-books?id="+ID).url),{kind:"detail",id:ID});
 assert.deepEqual(parseCataloguePublicQuery(req("catalogue-image?asset="+ASSET).url),{kind:"image",asset:ASSET});
 for(const path of ["catalogue-books?foo=1","catalogue-books?id="+ID+"&id="+ID,
  "catalogue-image?asset=../../private","catalogue-image?asset="+ASSET+"&key=secret"]){
  assert.equal(parseCataloguePublicQuery(req(path).url),null,path);
 }
 assert.equal(cataloguePublicAssetKey(key),true);
 for(const unsafe of ["products/foo.webp","backgrounds/desktop/../secret.webp",
  "books/"+ID+"/drafts/"+ASSET+".webp","https://example.com/file.webp"])
  assert.equal(cataloguePublicAssetKey(unsafe),false);
});

test("DL7C unpublished/disabled is unreadable before any SQL or R2 access",async()=>{
 let reads=0;
 const params={request:req("catalogue-books"),enabled:false,allowedOrigins:[],
  listBooks:async()=>{reads++;return [book]}};
 assert.equal((await handlePublicCatalogueRequest(params)).status,404);
 assert.equal(reads,0);
 const other=await handlePublicCatalogueRequest({...params,enabled:true,request:req("catalogue-books","POST")});
 assert.equal(other.status,405);
 const origin=await handlePublicCatalogueRequest({...params,enabled:true,
  request:req("catalogue-books","GET","https://malicious.invalid")});
 assert.equal(origin.status,403);
 assert.equal(reads,0);
});

test("DL7C manifest includes only DTO metadata and excludes R2 key and NET",async()=>{
 const api=async request=>handlePublicCatalogueRequest({
  request,enabled:true,allowedOrigins:[],
  listBooks:async()=>[book],
  getBook:async id=>id===ID?book:null,
  getAssets:async()=>[asset],
  getKey:async()=>null,r2:null
 });
 const list=await api(req("catalogue-books"));
 assert.equal(list.status,200);assert.deepEqual((await list.json()).data.books,[book]);
 const detail=await api(req("catalogue-books?id="+ID));
 assert.equal(detail.status,200);
 const body=(await detail.json()).data;
 assert.equal(body.pages[0].id,ASSET);
 assert.equal(body.cover,null);
 assert.deepEqual(body.backgrounds,{desktop:null,mobile:null});
 assert.equal(/r2_key|byte_size|net|draft/i.test(JSON.stringify(body)),false);
 assert.equal(detail.headers.get("Cache-Control"),"no-store");
 assert.equal((await api(req("catalogue-books?id=123e4567-e89b-42d3-a456-426614174010"))).status,404);
});

test("DL7C only approved image is streamed, no private R2 key in JSON",async()=>{
 const bytes=new Uint8Array(120).fill(3);let used=0;
 const params={enabled:true,allowedOrigins:[],request:req("catalogue-image?asset="+ASSET),
  getKey:async()=>({key,bytes:120}),
  r2:{get:async k=>{assert.equal(k,key);used++;return {body:bytes,size:120,
   httpMetadata:{contentType:"image/webp"}};}}};
 const ok=await handlePublicCatalogueRequest(params);
 assert.equal(ok.status,200);assert.equal(ok.headers.get("content-type"),"image/webp");
 assert.equal(used,1);assert.equal((await ok.arrayBuffer()).byteLength,120);
 const bad=await handlePublicCatalogueRequest({...params,getKey:async()=>({key:"products/secrets.webp",bytes:120})});
 assert.equal(bad.status,404);assert.equal(used,1);
 const hidden=await handlePublicCatalogueRequest({...params,getKey:async()=>null});
 assert.equal(hidden.status,404);assert.equal(used,1);
});

test("DL7C read model only queries security-filtered public views",async()=>{
 const inputs=[];
 const model=createReadModel(async (sql,args=[])=>{
  inputs.push({sql,args});
  if(sql===PUBLIC_READ_QUERIES.catalogueBooks)return [{...book}];
  if(sql===PUBLIC_READ_QUERIES.catalogueBook)return [{...book}];
  if(sql===PUBLIC_READ_QUERIES.catalogueAssets)return [{...asset,sort_order:0}];
  if(sql===PUBLIC_READ_QUERIES.catalogueAssetKey)return [{r2_key:key,byte_size:120}];
  throw Error("Unknown SQL");
 });
 assert.deepEqual(await model.getReadyCatalogueBooks(),[book]);
 assert.deepEqual(await model.getReadyCatalogueBook(ID),book);
 assert.equal((await model.getReadyCatalogueAssets(ID))[0].id,ASSET);
 assert.equal((await model.getReadyCatalogueAssetKey(ASSET)).key,key);
 assert.equal(inputs.length,4);
 assert.ok(inputs.every(x=>x.sql.includes("fbmn_public.v_catalogue_ready_")));
 assert.ok(inputs.every(x=>!x.sql.includes("fbmn_catalog_private.")));
 assert.equal(await model.getReadyCatalogueAssetKey("../../private"),null);
 assert.equal(inputs.length,4);
});

test("DL7C migration hides draft/hidden and never grants private table access",()=>{
 const sql=readFile("backend/neon/migrations/20261109_dl7c_catalogue_public.up.sql");
 assert.match(sql,/b\.state='ready'/);
 assert.match(sql,/EXISTS \(/);
 assert.match(sql,/JOIN fbmn_public\.v_catalogue_ready_books/);
 assert.match(sql,/security_barrier=true/);
 assert.match(sql,/GRANT SELECT ON fbmn_public\.v_catalogue_ready_books/);
 assert.doesNotMatch(sql,/GRANT (?:SELECT|ALL) ON fbmn_catalog_private/);
});
test("DL7C only swaps Catalogue tab; no PDF viewer frame, no open R2 key",()=>{
 const page=readFile("app/catalogue/page.tsx");
 const ui=readFile("app/catalogue/catalogue-flipbook.tsx");
 const css=readFile("app/catalogue/flipbook.css");
 assert.match(page,/<ContentShell>/);
 assert.match(page,/<PageHeading/);
 assert.match(page,/<ContentBreadcrumb/);
 assert.match(ui,/catalogue-books\/image\?asset=/);
 assert.match(ui,/prefers-reduced-motion/);
 assert.match(ui,/requestFullscreen/);
 assert.match(ui,/navigator\.share/);
 assert.match(ui,/onTouchEnd/);
 assert.match(ui,/ArrowRight/);
 assert.match(ui,/window\.history\.replaceState/);
 assert.match(css,/perspective:1600px/);
 assert.match(css,/background-image:[^;]*var\(--dl7c-bg-desktop/);
 assert.match(css,/max-width:700px/);
 assert.doesNotMatch(page+ui,/<iframe|PDFViewer|<embed/);
});

test("DL7C zoom uses shared dialog timing, reduced motion and deferred close",()=>{
 const ui=readFile("app/catalogue/catalogue-flipbook.tsx");
 const css=readFile("app/glass-foundation.css");
 assert.match(ui,/className="fb-catalogue-zoom fb-glass-dialog-motion"/);
 assert.match(ui,/zoomCloseTimer\.current=setTimeout/);
 assert.match(ui,/onCancel=\{event=>/);
 assert.match(css,/\.fb-glass-dialog-motion\[open\]:not\(\[data-closing="true"\]\)/);
 assert.match(css,/--fb-motion-dialog-open/);
 assert.match(css,/--fb-motion-dialog-close/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
