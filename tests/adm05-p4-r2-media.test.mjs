import test from "node:test";
import assert from "node:assert/strict";
import {deflateSync} from "node:zlib";
import {readFileSync} from "node:fs";
import {handleMedia,imageSize} from "../backend/admin-api/media-service.mjs";
import {handleCatalogue} from "../backend/admin-api/catalogue-service.mjs";
import {createAdminApi} from "../backend/admin-api/handler.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function chunk(tag,data){
  const length=Buffer.alloc(4);length.writeUInt32BE(data.length);
  return Buffer.concat([length,Buffer.from(tag),data,Buffer.alloc(4)]); // shape checked
}
function png(size=64){
  const head=Buffer.alloc(13);head.writeUInt32BE(size,0);head.writeUInt32BE(size,4);
  head[8]=8;head[9]=2;
  const scan=Buffer.alloc(size*(size*3+1));
  return new Uint8Array(Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",head),
    chunk("IDAT",deflateSync(scan)),chunk("IEND",Buffer.alloc(0))
  ]));
}
const uuid="a99f7e12-c1ab-4bc8-91c0-1fa667b31ad0";
const sku="0114";
function database(records=[]){
  return async fn=>fn({query:async(sql,args=[])=>{
    records.push({sql,args});
    if(sql.includes("FROM fbmn_catalog.skus WHERE sku_cong_ty="))
      return {rowCount:1,rows:[{sku_cong_ty:sku}]};
    if(sql.includes("SELECT count(*)::int AS amount"))
      return {rowCount:1,rows:[{amount:0,last_position:-1}]};
    if(sql.includes("FROM fbmn_catalog.media_assets WHERE id="))
      return {rowCount:1,rows:[{id:uuid}]};
    if(sql.includes("SELECT asset_id FROM fbmn_catalog.sku_media"))
      return {rowCount:0,rows:[]};
    if(sql.includes("FROM fbmn_catalog.media_assets a")&&sql.includes("EXISTS("))
      return {rowCount:1,rows:[{r2_key:"private/catalogue/"+uuid+".png",mime_type:"image/png"}]};
    if(sql.includes("SELECT a.id::text AS id"))
      return {rowCount:1,rows:[{id:uuid,sku_cong_ty:sku,media_role:"cover"}]};
    return {rowCount:1,rows:[{}]};
  }});
}
function bucket(actions=[]){
  return {put:async(key,data,meta)=>{actions.push(["put",key,data.length,meta]);},
    get:async(key)=>{actions.push(["get",key]);return {body:new ReadableStream({
      start(controller){controller.enqueue(png());controller.close();}})};},
    delete:async key=>{actions.push(["delete",key]);}};
}
function req(action,method="GET",body,headers={}){
  return new Request("https://worker.example.test/v1/admin/catalogue/media/"+action,{
    method,headers,...(body?{body}:{})
  });
}
const owner={subject:"owner-sub",role:"owner"};
test("P4 valid image signatures and bounds, reject partial image or other formats",()=>{
  const img=png();
  assert.deepEqual(imageSize(img,"image/png"),{width:64,height:64});
  assert.equal(imageSize(img.subarray(0,34),"image/png"),null);
  assert.equal(imageSize(img,"image/jpeg"),null);
  assert.equal(imageSize(new Uint8Array([60,115,118,103,62]),"image/png"),null);
  assert.equal(imageSize(png(16),"image/png"),null);
});
test("real transparent and opaque lossless WebP decode dimensions correctly",()=>{
  const transparent=Buffer.from("UklGRiAAAABXRUJQVlA4TBMAAAAvP8APEAcQEREAEsL/91pE/1M/AA==","base64");
  const opaque=Buffer.from("UklGRiQAAABXRUJQVlA4TBcAAAAvP8APAAdQj1IUpf8BICH8f69F9D/1AwA=","base64");
  assert.equal(transparent[24]&0x10,0x10); // VP8L alpha bit.
  assert.equal(opaque[24]&0x10,0);
  assert.deepEqual(imageSize(transparent,"image/webp"),{width:64,height:64});
  assert.deepEqual(imageSize(opaque,"image/webp"),{width:64,height:64});
  assert.equal(imageSize(transparent.subarray(0,30),"image/webp"),null);
});
test("header-only extended WebP cannot be uploaded as a successful photo",async()=>{
  const fake=new Uint8Array(38);
  fake.set(Buffer.from("RIFF"),0);
  new DataView(fake.buffer).setUint32(4,30,true);
  fake.set(Buffer.from("WEBPVP8X"),8);
  new DataView(fake.buffer).setUint32(16,10,true);
  fake[24]=63;fake[27]=63;
  fake.set(Buffer.from("VP8 "),30);
  // Empty VP8 chunk has no encoded pixels.
  new DataView(fake.buffer).setUint32(34,0,true);
  assert.equal(imageSize(fake,"image/webp"),null);
  const ops=[];
  const response=await handleMedia({request:req("upload","POST",fake,{
    "Content-Type":"image/webp","X-FBMN-Sku":sku,"X-FBMN-File-Name":"fake.webp"}),
    actor:owner,db:database([]),r2:bucket(ops)});
  assert.equal(response.status,422);
  assert.equal(ops.length,0);
});
test("partial multi-file uploads refresh existing gallery and revoke detached previews",()=>{
  const ui=read("apps/admin/app/catalogue-media-manager.tsx");
  assert.match(ui,/try\{await refresh\(\);onChanged\(\);\}catch/);
  assert.match(ui,/finally\{if\(fileInput.current\)fileInput.current.value=""/);
  assert.match(ui,/else URL.revokeObjectURL\(url\)/);
});
test("private admin upload validates image bytes then R2.put + owner-locked metadata + audit, without public URL",async()=>{
  const bytes=png(),statements=[],actions=[];
  const result=await handleCatalogue({request:req("upload","POST",bytes,{
    "Content-Type":"image/png","X-FBMN-Sku":sku,
    "X-FBMN-File-Name":encodeURIComponent("Bìa chính.png")}),
    actor:owner,db:database(statements),r2:bucket(actions)});
  assert.equal(result.status,201);
  const output=await result.json();
  assert.equal(output.data.media_role,"cover");
  assert.equal(output.data.width,64);
  assert.match(output.data.id,/^[0-9a-f-]{36}$/);
  assert.ok(!("r2_key" in output.data));
  assert.ok(!("url" in output.data));
  assert.deepEqual(actions.map(x=>x[0]),["put"]);
  assert.match(actions[0][1],/^private\/catalogue\/[0-9a-f-]+\.png$/);
  assert.equal(statements.some(x=>/INSERT INTO fbmn_catalog.media_assets/.test(x.sql)),true);
  assert.equal(statements.some(x=>/INSERT INTO fbmn_catalog.sku_media/.test(x.sql)),true);
  assert.equal(statements.some(x=>x.args.includes("owner-sub")),true);
  assert.ok(statements.some(x=>x.sql==="COMMIT"));
  assert.ok(!statements.some(x=>/fbmn_catalog.publications|net_price|source_price_vnd/i.test(x.sql)));
});
test("upload owner only, missing bucket fails closed, image bytes and MIME mismatch rejected before R2.put",async()=>{
  const file=png(),actions=[],db=database([]);
  const request=()=>req("upload","POST",file,{
    "Content-Type":"image/png","X-FBMN-Sku":sku,"X-FBMN-File-Name":"test.png"});
  assert.equal((await handleCatalogue({request:request(),
    actor:{role:"editor",subject:"e"},db,r2:bucket(actions)})).status,403);
  assert.equal((await handleCatalogue({request:request(),actor:owner,db})).status,503);
  assert.equal((await handleCatalogue({request:req("upload","POST",file,{
    "Content-Type":"image/png","X-FBMN-Sku":sku,"X-FBMN-File-Name":"test.jpg"}),
    actor:owner,db,r2:bucket(actions)})).status,400);
  assert.equal((await handleCatalogue({request:req("upload","POST",new TextEncoder().encode("<svg>test</svg>"),{
    "Content-Type":"image/png","X-FBMN-Sku":sku,"X-FBMN-File-Name":"test.png"}),
    actor:owner,db,r2:bucket(actions)})).status,413);
  assert.equal(actions.length,0);
});
test("upload and reattach append after MAX sort_order, never reuse holes",async()=>{
  const upSql=[],linkSql=[],actions=[];
  const upDb=async fn=>fn({query:async(sql,args=[])=>{
    upSql.push({sql,args});
    if(sql.includes("FROM fbmn_catalog.skus WHERE sku_cong_ty="))
      return {rowCount:1,rows:[{sku_cong_ty:sku}]};
    if(sql.includes("SELECT count(*)::int AS amount"))
      return {rowCount:1,rows:[{amount:3,last_position:4}]};
    return {rowCount:1,rows:[{}]};
  }});
  const result=await handleMedia({request:req("upload","POST",png(),{
    "Content-Type":"image/png","X-FBMN-Sku":sku,"X-FBMN-File-Name":"more.png"}),
    actor:owner,db:upDb,r2:bucket(actions)});
  assert.equal(result.status,201);
  const insert=upSql.find(x=>x.sql.includes("INSERT INTO fbmn_catalog.sku_media"));
  assert.equal(insert.args[3],5);
  assert.equal(insert.args[2],"detail");
  const linkDb=async fn=>fn({query:async(sql,args=[])=>{
    linkSql.push({sql,args});
    if(sql.includes("FROM fbmn_catalog.skus WHERE sku_cong_ty="))
      return {rowCount:1,rows:[{sku_cong_ty:sku}]};
    if(sql.includes("FROM fbmn_catalog.media_assets WHERE id="))
      return {rowCount:1,rows:[{id:uuid}]};
    if(sql.includes("SELECT asset_id,sort_order FROM"))
      return {rowCount:3,rows:[
        {asset_id:"b0000000-0000-0000-0000-000000000001",sort_order:0},
        {asset_id:"b0000000-0000-0000-0000-000000000002",sort_order:3},
        {asset_id:"b0000000-0000-0000-0000-000000000003",sort_order:4}
      ]};
    return {rowCount:1,rows:[{}]};
  }});
  const linked=await handleMedia({request:req("link","POST",
    JSON.stringify({sku_cong_ty:sku,asset_id:uuid}),{"Content-Type":"application/json"}),
    actor:owner,db:linkDb,r2:bucket([])});
  assert.equal(linked.status,201);
  assert.equal(linkSql.find(x=>x.sql.includes("INSERT INTO fbmn_catalog.sku_media")).args[3],5);
});
test("R2 object gets removed when SQL metadata transaction fails",async()=>{
  const operations=[],r2=bucket(operations);
  const db=async fn=>fn({query:async sql=>{
    if(sql.includes("SELECT sku_cong_ty FROM fbmn_catalog.skus"))return {rowCount:0,rows:[]};
    return {rowCount:1,rows:[]};
  }});
  const result=await handleMedia({request:req("upload","POST",png(),{
    "Content-Type":"image/png","X-FBMN-Sku":sku,"X-FBMN-File-Name":"test.png"}),
    actor:owner,db,r2});
  assert.equal(result.status,404);
  assert.deepEqual(operations.map(x=>x[0]),["put","delete"]);
});
test("owner gallery reads are scoped to the exact literal SKU and never expose R2 keys",async()=>{
  const calls=[],objects=[];
  const result=await handleCatalogue({
    request:req("list?sku=0114"),actor:owner,db:database(calls),r2:bucket(objects)});
  assert.equal(result.status,200);
  assert.equal(result.headers.get("cache-control"),"private, no-store");
  const {data}=await result.json();
  assert.equal(data.items.length,1);
  assert.equal(data.items[0].sku_cong_ty,"0114");
  assert.equal(data.items[0].media_role,"cover");
  assert.equal(Object.hasOwn(data.items[0],"r2_key"),false);
  assert.equal(Object.hasOwn(data.items[0],"source_price_vnd"),false);
  const select=calls.find(call=>call.sql.includes("FROM fbmn_catalog.sku_media l"));
  assert.deepEqual(select.args,["0114"]);
  assert.match(select.sql,/WHERE l.sku_cong_ty=\$1/);
  assert.equal(objects.length,0);
  for(const wrong of ["list?sku=114&sku=0114","list?sku=","list?sku=0114&extra=1"]){
    const response=await handleCatalogue({request:req(wrong),actor:owner,db:database([]),r2:bucket([])});
    assert.equal(response.status,400);
  }
});
test("private reusable media library lists metadata without exposing R2 keys or publishing links",async()=>{
  const statements=[],r2Calls=[];
  const db=async fn=>fn({query:async(sql,args=[])=>{
    statements.push({sql,args});
    return {rowCount:1,rows:[{id:uuid,source_filename:"bia-chinh.webp",
      mime_type:"image/webp",linked_skus:2}]};
  }});
  const response=await handleMedia({request:req("library"),actor:owner,db,r2:bucket(r2Calls)});
  assert.equal(response.status,200);
  const result=await response.json();
  assert.deepEqual(result.data.items,[{id:uuid,source_filename:"bia-chinh.webp",
    mime_type:"image/webp",linked_skus:2}]);
  assert.equal(statements.length,1);
  assert.equal(statements[0].args.length,0);
  assert.equal(r2Calls.length,0);
  assert.ok(!JSON.stringify(result).includes("private/catalogue/"));
  assert.ok(!JSON.stringify(result).includes("NET"));
});
test("private media read only for authenticated linked assets, response is binary and no-store",async()=>{
  const actions=[],res=await handleCatalogue({
    request:req("file?id="+uuid),actor:owner,db:database([]),r2:bucket(actions)});
  assert.equal(res.status,200);
  assert.equal(res.headers.get("content-type"),"image/png");
  assert.equal(res.headers.get("cache-control"),"private, no-store");
  assert.equal((await res.arrayBuffer()).byteLength,png().byteLength);
  assert.deepEqual(actions.map(x=>x[0]),["get"]);
});
test("manual library link and unlink require owner, no inferred SKU or public auto-publish",async()=>{
  const db=database([]),r2=bucket([]);
  const body=JSON.stringify({sku_cong_ty:sku,asset_id:uuid});
  const post=()=>req("link","POST",body,{"Content-Type":"application/json"});
  const del=()=>req("link","DELETE",body,{"Content-Type":"application/json"});
  assert.equal((await handleMedia({request:post(),actor:{role:"editor"},db,r2})).status,403);
  assert.equal((await handleMedia({request:post(),actor:owner,db,r2})).status,201);
  assert.equal((await handleMedia({request:del(),actor:{role:"editor"},db,r2})).status,403);
  assert.equal((await handleMedia({request:del(),actor:owner,db,r2})).status,200);
});
test("media API is behind verified JWT + DB grants; no unauthenticated gallery",async()=>{
  const api=createAdminApi({
    verifyToken:async t=>{if(t==="wrong")throw Error();return "owner-sub";},
    loadActor:async()=>({role:"owner",enabled:true,channels:[]}),
    listChannels:async()=>[],recordAudit:async()=>{},catalogueDb:database([]),
    catalogueR2:bucket([]),allowedOrigins:["https://admin.example.test"]});
  const url="https://worker.example.test/v1/admin/catalogue/media/list?sku=0114";
  assert.equal((await api.fetch(new Request(url))).status,401);
  assert.equal((await api.fetch(new Request(url,{headers:{Authorization:"Bearer wrong"}}))).status,401);
  assert.equal((await api.fetch(new Request(url,{headers:{Authorization:"Bearer good",
    Origin:"https://evil.example.test"}}))).status,403);
  assert.equal((await api.fetch(new Request(url,{headers:{Authorization:"Bearer good"}}))).status,200);
});
test("P4 contract: R2 bucket private, grants staging only and browser no direct R2 credentials",()=>{
  const wrangler=read("backend/admin-api/wrangler.jsonc");
  const up=read("backend/neon/migrations/20261102_adm05_p4_private_media.up.sql");
  const down=read("backend/neon/migrations/20261102_adm05_p4_private_media.down.sql");
  const admin=read("apps/admin/app/catalogue-media-manager.tsx");
  const proxy=read("apps/admin/app/api/media/[action]/route.ts");
  const worker=read("backend/admin-api/media-service.mjs");
  assert.match(wrangler,/"binding":"ADMIN_MEDIA_R2","bucket_name":"fbmn"/);
  assert.ok(up.includes("GRANT INSERT (id,source_filename,r2_key,mime_type,file_sha256)"));
  assert.ok(up.includes("GRANT UPDATE (media_role,sort_order)"));
  assert.match(up,/sku_media_single_cover_per_sku/);
  assert.ok(!up.includes("GRANT INSERT ON fbmn_catalog.media_assets"));
  assert.ok(!up.includes("GRANT UPDATE ON fbmn_catalog.sku_media"));
  assert.ok(!up.includes("reviewed_by) TO fbmn_admin_http_staging"));
  assert.ok(down.includes("REVOKE UPDATE (media_role,sort_order)"));
  assert.match(read("apps/admin/app/catalogue-manager.tsx"),/Quản lý ảnh R2/);
  assert.match(admin,/X-FBMN-File-Name/);
  assert.match(admin,/Ảnh đại diện/);
  assert.match(admin,/Gỡ khỏi SKU/);
  assert.match(proxy,/origin_forbidden/);
  assert.match(proxy,/body_too_large/);
  assert.match(worker,/private\/catalogue\//);
  assert.doesNotMatch(admin,/R2_ACCESS_KEY|R2_SECRET|r2\.dev|NET/);
  assert.doesNotMatch(worker,/publications.*(UPDATE|INSERT)|net_price|pricebook/);
});
