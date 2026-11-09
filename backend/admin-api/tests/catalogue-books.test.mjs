import test from "node:test";
import assert from "node:assert/strict";
import {createAdminApi} from "../handler.mjs";
import {catalogueObjectKey,validateCatalogueBook,validateCatalogueImage,handleCatalogueBooks,parseCataloguePage}
 from "../catalogue-books-service.mjs";

const ID="123e4567-e89b-42d3-a456-426614174000",FILE="123e4567-e89b-42d3-a456-426614174001";
test("DL7B R2 keys strictly separate book pages and catalogue-only backgrounds",()=>{
 assert.equal(catalogueObjectKey(ID,"page",FILE),"books/"+ID+"/pages/"+FILE+".webp");
 assert.equal(catalogueObjectKey(ID,"cover",FILE),"books/"+ID+"/covers/"+FILE+".webp");
 assert.equal(catalogueObjectKey(ID,"background_desktop",FILE),"backgrounds/desktop/"+ID+"/"+FILE+".webp");
 assert.equal(catalogueObjectKey(ID,"background_mobile",FILE),"backgrounds/mobile/"+ID+"/"+FILE+".webp");
 for(const kind of ["sku","../../products","pdf"])assert.equal(catalogueObjectKey(ID,kind,FILE),null);
 assert.equal(catalogueObjectKey("../secrets","page",FILE),null);
});
test("DL7B book metadata rejects malformed text and image bytes",()=>{
 assert.equal(Boolean(validateCatalogueBook({title:"Tập học sinh",edition:"2026"})),true);
 assert.equal(Boolean(validateCatalogueBook({title:"",edition:"2026"})),false);
 assert.equal(Boolean(validateCatalogueBook({title:"A",edition:"\n"})),false);
 assert.equal(validateCatalogueImage(new Uint8Array(128)),null);
});
const validR2={get:async()=>null,put:async()=>{},delete:async()=>{}};
function api(role="owner",r2=validR2){
 return createAdminApi({
  verifyToken:async()=>ID,
  loadActor:async()=>({role,enabled:true,channels:["public_web"]}),
  listChannels:async()=>[],
  recordAudit:async()=>{},
  catalogueDb:async()=>{throw Error("no-migration");},
  catalogueBookR2:r2,
  allowedOrigins:[]
 });
}
function request(path,token="Bearer a.b.c"){
 return new Request("https://api.example.test/v1/admin/website/catalogue"+path,{
  headers:token?{Authorization:token}:{}
 });
}
test("DL7B Owner-only on Worker, deny anonymous and non-Owner without touching storage",async()=>{
 assert.equal((await api().fetch(request("",null))).status,401);
 assert.equal((await api("editor").fetch(request(""))).status,403);
 assert.equal((await api("owner",null).fetch(request(""))).status,503);
});
test("DL7B fails closed for bad asset ids, query and inaccessible catalogue",async()=>{
 const direct={role:"owner",subject:ID};
 assert.equal((await handleCatalogueBooks({request:request("/image?asset=../../x"),actor:direct,db:async()=>{},r2:validR2})).status,400);
 assert.equal((await handleCatalogueBooks({request:request("?unexpected=1"),actor:direct,db:async()=>{},r2:validR2})).status,400);
 assert.equal((await api().fetch(request(""))).status,503);
});

test("DL7B valid positive book-list page numbers",()=>{
 assert.equal(parseCataloguePage("1"),1);
 assert.equal(parseCataloguePage("100"),100);
 for(const invalid of ["0","-1","01","1.5","Infinity","100000","",null])
  assert.equal(parseCataloguePage(invalid),null);
});
