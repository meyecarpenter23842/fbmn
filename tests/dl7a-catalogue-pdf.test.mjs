import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {cataloguePdfKey,validateCataloguePdf,MAX_CATALOGUE_PDF,handleCataloguePdf} from "../backend/admin-api/catalogue-pdf-service.mjs";
import {cataloguePublicPdfKey,parseCataloguePublicQuery,handlePublicCatalogueRequest} from "../backend/public-api/catalogue-books-public.mjs";
import {createReadModel,PUBLIC_READ_QUERIES} from "../backend/public-api/read-model.mjs";
import {createAdminApi} from "../backend/admin-api/handler.mjs";
const ID="123e4567-e89b-42d3-a456-426614174000";
const FILE="123e4567-e89b-42d3-a456-426614174001";
const KEY="books/"+ID+"/pdf/"+FILE+".pdf";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
function pdf(size=256){
 const b=new Uint8Array(size).fill(32);
 b.set(new TextEncoder().encode("%PDF-1.7\n1 0 obj\n"),0);
 b.set(new TextEncoder().encode("\n%%EOF\n"),size-7);
 return b;
}
const get=path=>new Request("https://public.example"+path);
test("DL7A PDF validates true bytes, bounded size and private R2 path",()=>{
 assert.equal(validateCataloguePdf(pdf()),true);
 assert.equal(validateCataloguePdf(new Uint8Array(256)),false);
 assert.equal(validateCataloguePdf(pdf().subarray(0,240)),false);
 assert.equal(validateCataloguePdf(new Uint8Array(MAX_CATALOGUE_PDF+1)),false);
 assert.equal(cataloguePdfKey(ID,FILE),KEY);
 assert.equal(cataloguePdfKey("../private",FILE),null);
 assert.equal(cataloguePublicPdfKey(KEY),true);
 assert.equal(cataloguePublicPdfKey(KEY+"?key=secret"),false);
 assert.equal(cataloguePublicPdfKey("products/secret.pdf"),false);
});
test("DL7A PDF query accepts only UUID and optional download=1",()=>{
 assert.deepEqual(parseCataloguePublicQuery(get("/v1/public/catalogue-pdf?book="+ID).url),
  {kind:"pdf",book:ID,download:false});
 assert.deepEqual(parseCataloguePublicQuery(get("/v1/public/catalogue-pdf?book="+ID+"&download=1").url),
  {kind:"pdf",book:ID,download:true});
 for(const s of ["?book=../../secret","?book="+ID+"&book="+ID,
  "?book="+ID+"&download=0","?book="+ID+"&r2_key=secret"]){
  assert.equal(parseCataloguePublicQuery(get("/v1/public/catalogue-pdf"+s).url),null,s);
 }
});
test("DL7A public PDF gate, rights, MIME and attachment disposition",async()=>{
 const data=pdf(),calls=[];
 const params={request:get("/v1/public/catalogue-pdf?book="+ID),enabled:true,pdfEnabled:false,
  allowedOrigins:[],getPdf:async(book,download)=>{
   calls.push([book,download]);return {key:KEY,bytes:data.length,mime:"application/pdf"};
  },r2:{get:async()=>({size:data.length,body:new Response(data).body,httpMetadata:{contentType:"application/pdf"}})}};
 assert.equal((await handlePublicCatalogueRequest(params)).status,404);
 assert.deepEqual(calls,[]);
 const inline=await handlePublicCatalogueRequest({...params,pdfEnabled:true});
 assert.equal(inline.status,200);assert.match(inline.headers.get("content-disposition"),/^inline;/);
 assert.equal(inline.headers.get("content-type"),"application/pdf");
 assert.equal((await inline.arrayBuffer()).byteLength,data.length);
 const download=await handlePublicCatalogueRequest({...params,pdfEnabled:true,
  request:get("/v1/public/catalogue-pdf?book="+ID+"&download=1")});
 assert.equal(download.status,200);assert.match(download.headers.get("content-disposition"),/^attachment;/);
 assert.deepEqual(calls,[[ID,false],[ID,true]]);
 assert.equal((await handlePublicCatalogueRequest({...params,pdfEnabled:true,
  getPdf:async()=>null})).status,404);
 assert.equal((await handlePublicCatalogueRequest({...params,pdfEnabled:true,
  getPdf:async()=>({key:"books/private.pdf",bytes:data.length,mime:"application/pdf"})})).status,404);
});
test("DL7A PDF-only book is public only after PDF flag enabled",async()=>{
 const book={id:ID,title:"Bộ giấy",edition:"2026",hasPages:false,hasPdf:true,pdfDownloadEnabled:true};
 const params={request:get("/v1/public/catalogue-books"),enabled:true,allowedOrigins:[],
  listBooks:async()=>[book],getSettings:async()=>({flipDurationMs:950,soundEnabled:false,soundVolume:35,shadowOpacity:0.26})};
 const hidden=(await (await handlePublicCatalogueRequest({...params,pdfEnabled:false})).json()).data;
 assert.equal(hidden.books.length,0);
 const shown=(await (await handlePublicCatalogueRequest({...params,pdfEnabled:true})).json()).data;
 assert.deepEqual(shown.books,[book]);
 const detail=await handlePublicCatalogueRequest({...params,pdfEnabled:true,
  request:get("/v1/public/catalogue-books?id="+ID),
  getBook:async()=>book,getAssets:async()=>[]});
 assert.equal(detail.status,200);assert.equal((await detail.json()).data.pages.length,0);
});
test("DL7A public SQL PDF query is view-only and requires download_enabled",async()=>{
 const calls=[];
 const model=createReadModel(async(sql,args)=>{
  calls.push([sql,args]);return [{r2_key:KEY,byte_size:256,mime_type:"application/pdf"}];
 });
 assert.deepEqual(await model.getReadyCataloguePdf(ID,false),{key:KEY,bytes:256,mime:"application/pdf"});
 assert.deepEqual(await model.getReadyCataloguePdf(ID,true),{key:KEY,bytes:256,mime:"application/pdf"});
 assert.equal(await model.getReadyCataloguePdf("../../bad",true),null);
 assert.deepEqual(calls.map(x=>x[1]),[[ID,false],[ID,true]]);
 assert.ok(calls.every(x=>x[0]===PUBLIC_READ_QUERIES.cataloguePdf));
 assert.match(PUBLIC_READ_QUERIES.cataloguePdf,/fbmn_public.v_catalogue_ready_pdfs/);
 assert.match(PUBLIC_READ_QUERIES.cataloguePdf,/download_enabled=true/);
 assert.doesNotMatch(PUBLIC_READ_QUERIES.cataloguePdf,/fbmn_catalog_private/);
});
test("DL7A PDF upload locks revision, writes R2 and audit; defaults hidden",async()=>{
 const bytes=pdf(),queries=[],uploads=[];
 const b={id:ID,title:"Tập vở",edition:"2026",state:"draft",revision:1,updated_at:new Date()};
 const db=async fn=>fn({query:async(sql,args)=>{
  queries.push([sql,args]);
  if(sql.includes("FOR UPDATE")&&sql.includes("website_catalogue_books"))
   return {rowCount:1,rows:[b]};
  if(sql.startsWith("SELECT r2_key,byte_size,visible,download_enabled"))
   return {rowCount:0,rows:[]};
  if(sql.startsWith("INSERT INTO fbmn_catalog_private.website_catalogue_pdfs"))
   return {rowCount:1,rows:[{byte_size:bytes.length,visible:false,download_enabled:false,updated_at:new Date()}]};
  if(sql.startsWith("UPDATE fbmn_catalog_private.website_catalogue_books"))
   return {rowCount:1,rows:[{...b,revision:2}]};
  return {rowCount:1,rows:[]};
 }});
 const res=await handleCataloguePdf({action:"pdf-upload",actor:{role:"owner",subject:"owner"},db,
  r2:{put:async(k,v,m)=>uploads.push({k,v,m}),delete:async()=>{}},
  request:new Request("https://admin.invalid/v1/admin/website/catalogue/pdf-upload",{
   method:"POST",headers:{"Content-Type":"application/pdf",
    "X-Catalogue-Book-Id":ID,"X-Catalogue-Revision":"1"},body:bytes})});
 assert.equal(res.status,200);
 const body=(await res.json()).data;
 assert.equal(body.pdf.visible,false);assert.equal(body.pdf.downloadEnabled,false);
 assert.equal(body.book.revision,2);assert.equal(uploads.length,1);
 assert.match(uploads[0].k,new RegExp("^books/"+ID+"/pdf/[a-f0-9-]{36}\\.pdf$"));
 assert.equal(uploads[0].m.httpMetadata.contentType,"application/pdf");
 assert.ok(queries.some(x=>x[0].includes("website_catalogue_audit")));
 assert.ok(queries.some(x=>x[0]==="COMMIT"));
});
test("DL7A Owner-only PDF rules and direct Worker CORS preflight",async()=>{
 const db=async()=>{throw Error("db should not run")};
 const pdfSettings=new Request("https://admin.invalid/v1/admin/website/catalogue/pdf-settings",{
  method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({id:ID,revision:1,visible:false,downloadEnabled:true})});
 assert.equal((await handleCataloguePdf({action:"pdf-settings",request:pdfSettings,
  actor:{role:"owner",subject:"owner"},db,r2:{put(){},delete(){}}})).status,400);
 const denied=await handleCataloguePdf({action:"pdf-upload",
  request:new Request("https://admin.invalid/v1/admin/website/catalogue/pdf-upload",{
   method:"POST",headers:{"Content-Type":"application/pdf"},body:pdf()}),
  actor:{role:"editor",subject:"editor"},db,r2:{put(){},delete(){}}});
 assert.equal(denied.status,403);
 const api=createAdminApi({verifyToken:async()=>ID,
  loadActor:async()=>({role:"owner",enabled:true,channels:["public_web"]}),
  listChannels:async()=>[],recordAudit:async()=>{},catalogueDb:db,
  catalogueBookR2:{get(){},put(){},delete(){}},allowedOrigins:["https://admin.fbmn.vn"]});
 const url="https://api.invalid/v1/admin/website/catalogue/pdf-upload";
 const preflight=await api.fetch(new Request(url,{method:"OPTIONS",
  headers:{Origin:"https://admin.fbmn.vn"}}));
 assert.equal(preflight.status,204);
 assert.equal(preflight.headers.get("access-control-allow-origin"),"https://admin.fbmn.vn");
 assert.match(preflight.headers.get("access-control-allow-methods"),/POST/);
 assert.match(preflight.headers.get("access-control-allow-headers"),/X-Catalogue-Revision/);
 assert.equal((await api.fetch(new Request(url,{method:"OPTIONS",
  headers:{Origin:"https://evil.invalid"}}))).status,403);
});
test("DL7A migrations and Website reject draft/key exposure and do not destroy pages",()=>{
 const up=read("backend/neon/migrations/20261110_dl7a_catalogue_pdf.up.sql");
 const down=read("backend/neon/migrations/20261110_dl7a_catalogue_pdf.down.sql");
 for(const term of ["website_catalogue_pdfs","security_barrier=true",
  "v_catalogue_ready_pdfs","download_enabled boolean NOT NULL DEFAULT false",
  "visible boolean NOT NULL DEFAULT false"])
  assert.ok(up.includes(term),term);
 assert.doesNotMatch(up,/GRANT\s+SELECT\s+ON\s+fbmn_catalog_private\.website_catalogue_pdfs\s+TO\s+fbmn_public_reader/i);
 assert.doesNotMatch(up,/DROP TABLE fbmn_catalog_private\.website_catalogue_assets/);
 assert.match(down,/PDF data exists/);
 assert.match(read("backend/public-api/wrangler.jsonc"),/"PUBLIC_DL7A_PDF_ENABLED": "false"/);
 const web=read("app/catalogue/catalogue-flipbook.tsx"),
  route=read("app/api/catalogue-books/pdf/route.ts"),
  admin=read("apps/admin/app/catalogue-book-manager.tsx");
 assert.match(web,/detail\.book\.pdfDownloadEnabled/);
 assert.match(web,/GlassButtonLink/);assert.match(route,/Content-Disposition/);
 assert.match(admin,/\/pdf-target/);assert.match(admin,/pdf-settings/);
 assert.match(read("apps/admin/app/api/website/catalogue/[[...path]]/route.ts"),/POST_ACTIONS=new Set\([^\n]*"pdf-settings","pdf-remove"/);
 assert.doesNotMatch(route,/R2_SECRET|ADMIN_TOKEN|NET_PRICE/);
});
