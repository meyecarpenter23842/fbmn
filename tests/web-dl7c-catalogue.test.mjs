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
 assert.equal("backgrounds" in body,false);
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
 assert.match(ui,/useMouseEvents/);
 assert.match(ui,/swipeDistance:38/);
 assert.match(ui,/ArrowRight/);
 assert.match(ui,/window\.history\.replaceState/);
 assert.match(css,/\.fb-catalogue-paper\{/);
 assert.match(css,/\.fb-catalogue-scene\{[^}]*background:transparent/);
 assert.doesNotMatch(css,/--dl7c-bg-desktop|--dl7c-bg-mobile/);
 assert.match(css,/max-width:700px/);
 assert.doesNotMatch(page+ui,/<iframe|PDFViewer|<embed/);
});

test("DL7C zoom uses shared dialog timing, reduced motion and deferred close",()=>{
 const ui=readFile("app/catalogue/catalogue-flipbook.tsx");
 const css=readFile("app/glass-foundation.css");
 assert.match(ui,/className="fb-catalogue-zoom fb-glass-dialog-motion"/);
 assert.match(ui,/zoomCloseTimer\.current=setTimeout/);
 assert.match(ui,/onCancel=\{e=>/);
 assert.match(css,/\.fb-glass-dialog-motion\[open\]:not\(\[data-closing="true"\]\)/);
 assert.match(css,/--fb-motion-dialog-open/);
 assert.match(css,/--fb-motion-dialog-close/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test("DL7C thumbnail navigation uses mandatory readable control-size token",()=>{
 const css=readFile("app/catalogue/flipbook.css");
 const rule=css.match(/\.fb-catalogue-thumb\{([^}]+)\}/)?.[1];
 assert.ok(rule);
 assert.match(rule,/font-size:var\(--fb-control-font-size\)/);
 assert.doesNotMatch(rule,/font-size:12px/);
});

test("DL7C navigation remains shared 36px/44px Glass control and modal owns arrow keys",()=>{
 const ui=readFile("app/catalogue/catalogue-flipbook.tsx");
 const css=readFile("app/catalogue/flipbook.css");
 assert.match(ui,/if\(zoomRef\.current\?\.open\)return/);
 assert.match(ui,/fb-glass-button fb-glass-button--secondary fb-catalogue-nav fb-catalogue-nav--prev/);
 assert.match(ui,/fb-glass-button fb-glass-button--secondary fb-catalogue-nav fb-catalogue-nav--next/);
 assert.match(css,/\.fb-catalogue-nav\{flex:0 0 auto\}/);
 assert.doesNotMatch(css,/\.fb-catalogue-nav\{[^}]*\b(?:width|height|border-radius|background):/);
});

test("DL7C-R uses a single G05 site backdrop and retires per-book backgrounds",()=>{
 const layout=readFile("app/layout.tsx");
 const admin=readFile("apps/admin/app/catalogue-book-manager.tsx");
 const worker=readFile("backend/public-api/catalogue-books-public.mjs");
 const flipbook=readFile("app/catalogue/catalogue-flipbook.tsx");
 const css=readFile("app/catalogue/flipbook.css");
 assert.match(layout,/<GlassPageBackdrop/);
 assert.doesNotMatch(admin,/Ảnh nền riêng tab Catalogue|Thêm nền Desktop|Thêm nền Mobile/);
 assert.doesNotMatch(worker,/backgrounds:\s*\{/);
 assert.doesNotMatch(flipbook,/detail\?\.backgrounds|dl7c-bg-desktop|dl7c-bg-mobile/);
 assert.match(css,/\.fb-catalogue-scene\{[^}]*background:transparent/);
 assert.equal(cataloguePublicAssetKey("backgrounds/desktop/"+ID+"/"+ASSET+".webp"),false);
});
test("DL7C-R page curl and paper audio are interaction-based and reduced-motion-safe",()=>{
 const ui=readFile("app/catalogue/catalogue-flipbook.tsx");
 const pkg=JSON.parse(readFile("package.json"));
 assert.equal(pkg.dependencies["page-flip"],"2.0.7");
 assert.equal(pkg.devDependencies["@types/page-flip"],"2.0.4");
 assert.match(ui,/const \{PageFlip\}=await import\("page-flip"\)/);
 assert.match(ui,/flippingTime:950/);
 assert.match(ui,/maxShadowOpacity:0\.26/);
 assert.match(ui,/flipNext\("bottom" as FlipCorner\)/);
 assert.match(ui,/turnToNextPage\(\)/);
 assert.match(ui,/new AudioContext\(\)/);
 assert.match(ui,/aria-pressed=\{soundEnabled\}/);
 assert.match(ui,/soundRef\.current/);
 assert.match(ui,/if\(reduced\)/);
 assert.doesNotMatch(ui,/fb-catalogue-turn--next|@keyframes fb-dl7c-next/);
});

test("DL7C-R never flips beyond final spread or before first (StPageFlip bounds)",async()=>{
 const {canFlipForward,canFlipBackward,spreadStart}=await import("../lib/catalogue/spread-navigation.ts");
 assert.equal(canFlipForward(6,8,false,false),false);
 assert.equal(canFlipForward(7,8,false,false),false);
 assert.equal(canFlipForward(4,8,false,false),true);
 assert.equal(canFlipForward(7,9,false,true),false);
 assert.equal(canFlipForward(8,9,false,true),false);
 assert.equal(canFlipForward(0,9,false,true),true);
 assert.equal(canFlipForward(0,1,false,true),false);
 assert.equal(canFlipForward(7,9,true,true),true);
 assert.equal(canFlipForward(8,9,true,true),false);
 assert.equal(canFlipBackward(1,false,false),false);
 assert.equal(canFlipBackward(1,false,true),true);
 assert.equal(spreadStart(8,false,true),7);
 const ui=readFile("app/catalogue/catalogue-flipbook.tsx");
 assert.match(ui,/if\(direction==="next"&&!canFlipForward\(/);
 assert.match(ui,/if\(direction==="prev"&&!canFlipBackward\(/);
});
test("DL7C-R uses a disposable StPageFlip mount and never destroys React host",()=>{
 const ui=readFile("app/catalogue/catalogue-flipbook.tsx");
 const css=readFile("app/catalogue/flipbook.css");
 assert.match(ui,/const disposable=document\.createElement\("div"\)/);
 assert.match(ui,/flip=new PageFlip\(disposable/);
 assert.doesNotMatch(ui,/new PageFlip\(host/);
 assert.match(css,/\.fb-catalogue-engine-root\{/);
});
