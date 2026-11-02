import test from "node:test";
import assert from "node:assert/strict";
import {deflateSync} from "node:zlib";
import {detectSkuFromName,findR2SkuCandidates} from "../backend/admin-api/media-sku-sync.mjs";
import {handleMedia,imageSize} from "../backend/admin-api/media-service.mjs";
function chunk(tag,data){
  const size=Buffer.alloc(4);size.writeUInt32BE(data.length);
  return Buffer.concat([size,Buffer.from(tag),data,Buffer.alloc(4)]);
}
function png(){
  const head=Buffer.alloc(13);head.writeUInt32BE(64,0);head.writeUInt32BE(64,4);
  head[8]=8;head[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
    chunk("IHDR",head),chunk("IDAT",deflateSync(Buffer.alloc(64*(64*3+1)))),
    chunk("IEND",Buffer.alloc(0))]);
}
const key="private/catalogue/inbox/0114-02.png";
const actor={role:"owner",subject:"owner"};
test("exact SKU filename: one image, numbered photos, leading zeros and ambiguity",()=>{
  const codes=new Set(["L536","0114","C592","C5921","L536-01"]);
  assert.deepEqual(detectSkuFromName("private/catalogue/L536.webp",codes),
    {status:"matched",sku:"L536",filename:"L536.webp"});
  assert.equal(detectSkuFromName(key,codes).sku,"0114");
  assert.equal(detectSkuFromName("private/catalogue/C5921.png",codes).sku,"C5921");
  assert.equal(detectSkuFromName("private/catalogue/L536-01.webp",codes).status,"ambiguous");
  assert.equal(detectSkuFromName("private/catalogue/L536-random.webp",codes).status,"unmatched");
  assert.equal(detectSkuFromName("private/catalogue/114.webp",codes).status,"unmatched");
  assert.equal(detectSkuFromName("public/L536.webp",codes).status,"invalid");
  assert.equal(detectSkuFromName("private/catalogue/77a3b7c3-a4db-430a-a49e-f9bca931da0c.png",codes).status,"generated");
});
test("scan excludes registered objects, returns only exact company SKUs without writing",async()=>{
  const sql=[],calls=[];
  const db=async work=>work({query:async(q)=>{
    sql.push(q);
    if(q.includes("SELECT sku_cong_ty"))return {rows:[{sku_cong_ty:"0114"}]};
    if(q.includes("SELECT r2_key"))return {rows:[{r2_key:"private/catalogue/0114.jpg"}]};
    throw Error("unexpected_sql");
  }});
  const r2={list:async options=>{
    calls.push(options);
    return {objects:[{key,size:200}, {key:"private/catalogue/0114.jpg"},
      {key:"private/catalogue/L536.png"}],truncated:false};
  }};
  const result=await findR2SkuCandidates({db,r2});
  assert.equal(result.items.length,2);
  assert.equal(result.items.find(item=>item.key===key).sku,"0114");
  assert.equal(result.items.find(item=>item.key==="private/catalogue/L536.png").status,"unmatched");
  assert.ok(result.items.every(item=>!item.r2_secret));
  assert.equal(calls[0].prefix,"private/catalogue/");
  assert.ok(sql.every(q=>!q.includes("source_price")));
});
test("Owner preview is read-only; non-Owner can't adopt",async()=>{
  const db=async work=>work({query:async()=>({rows:[],rowCount:0})});
  const r2={put:async()=>{},get:async()=>{},list:async()=>({objects:[],truncated:false})};
  const preview=await handleMedia({request:new Request("https://example.test/v1/admin/catalogue/media/scan"),
    actor,db,r2});
  assert.equal(preview.status,200);
  const denied=await handleMedia({request:new Request("https://example.test/v1/admin/catalogue/media/adopt",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({confirm:"GAN_ANH_R2",keys:[key]})
  }),actor:{role:"editor"},db,r2});
  assert.equal(denied.status,403);
});
test("Owner batch adoption is transactional, exact SKU linked, no R2 overwrite",async()=>{
  const statements=[],r2Calls=[];
  const db=async work=>work({query:async(sql,args=[])=>{
    statements.push({sql,args});
    if(sql.includes("SELECT sku_cong_ty FROM fbmn_catalog.skus ORDER BY"))
      return {rowCount:1,rows:[{sku_cong_ty:"0114"}]};
    if(sql.includes("SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE"))
      return {rowCount:1,rows:[{sku_cong_ty:"0114"}]};
    if(sql.includes("SELECT count(*)::int AS amount"))
      return {rowCount:1,rows:[{amount:0,last_position:-1}]};
    if(sql.includes("SELECT id FROM fbmn_catalog.media_assets")||
       sql.includes("SELECT a.id FROM fbmn_catalog.media_assets"))
      return {rowCount:0,rows:[]};
    return {rowCount:1,rows:[{}]};
  }});
  const image=png();
  const r2={get:async k=>{r2Calls.push(k);return {size:image.length,arrayBuffer:async()=>image};},
    put:async()=>{throw Error("must not write R2");}};
  const response=await handleMedia({request:new Request(
    "https://example.test/v1/admin/catalogue/media/adopt",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({confirm:"GAN_ANH_R2",keys:[key]})
  }),actor,db,r2});
  assert.equal(response.status,201);
  assert.equal((await response.json()).data.count,1);
  assert.deepEqual(r2Calls,[key]);
  assert.ok(statements.some(x=>x.sql.includes("'filename_exact'")));
  assert.ok(statements.some(x=>x.sql==="COMMIT"));
  assert.ok(statements.some(x=>x.sql.includes("r2_key=$1")&&x.args[0]===key));
  assert.ok(!statements.some(x=>x.sql.includes("published_at")||x.sql.includes("source_price")));
});

test("Owner WebP derivatives are bounded and preserve original R2 key",async()=>{
  const id="a99f7e12-c1ab-4bc8-91c0-1fa667b31ad0";
  const payload=Buffer.from("UklGRiAAAABXRUJQVlA4TBMAAAAvP8APEAcQEREAEsL/91pE/1M/AA==","base64");
  const ops=[];
  const db=async work=>work({query:async sql=>{
    if(sql.includes("FROM fbmn_catalog.media_assets a WHERE a.id="))
      return {rowCount:1,rows:[{id}]};
    return {rowCount:0,rows:[]};
  }});
  const r2={put:async (key,bytes,metadata)=>ops.push({key,bytes,metadata}),get:async()=>null};
  const response=await handleMedia({request:new Request(
    "https://example.test/v1/admin/catalogue/media/variant",{
      method:"POST",headers:{"Content-Type":"image/webp",
        "X-FBMN-Asset-ID":id,"X-FBMN-Variant":"thumb"},body:payload
    }),actor,db,r2});
  assert.equal(response.status,201);
  assert.equal(ops[0].key,"private/catalogue/renditions/"+id+"/thumb.webp");
  assert.equal(ops[0].metadata.httpMetadata.contentType,"image/webp");
  assert.equal(ops[0].bytes.length,payload.length);
  const unauthorized=await handleMedia({request:new Request(
    "https://example.test/v1/admin/catalogue/media/variant",{
      method:"POST",headers:{"Content-Type":"image/webp",
        "X-FBMN-Asset-ID":id,"X-FBMN-Variant":"thumb"},body:payload
    }),actor:{role:"editor"},db,r2});
  assert.equal(unauthorized.status,403);
});
test("private file variant serves WebP thumbnail and never publishes R2 key",async()=>{
  const id="a99f7e12-c1ab-4bc8-91c0-1fa667b31ad0",keys=[];
  const db=async work=>work({query:async()=>({rowCount:1,rows:[{
    r2_key:"private/catalogue/original.png",mime_type:"image/png"}]})});
  const r2={put:async()=>{},get:async key=>{
    keys.push(key);
    return {body:new ReadableStream({start(c){c.enqueue(new Uint8Array([1,2,3]));c.close();}})};
  }};
  const response=await handleMedia({request:new Request(
    "https://example.test/v1/admin/catalogue/media/file?id="+id+"&variant=thumb"
  ),actor,db,r2});
  assert.equal(response.status,200);
  assert.equal(response.headers.get("content-type"),"image/webp");
  assert.equal(response.headers.get("cache-control"),"private, no-store");
  assert.deepEqual(keys,["private/catalogue/renditions/"+id+"/thumb.webp"]);
});

test("panoramic thumbnail may have a 20px short edge, original uploads still require 32px",()=>{
  // Valid RIFF/VP8L structure with a 320x20 header to exercise dimension guards.
  const data=Buffer.from("UklGRiQAAABXRUJQVlA4TBcAAAAvP8APAAdQj1IUpf8BICH8f69F9D/1AwA=","base64");
  const tag=data.indexOf(Buffer.from("VP8L"));
  assert.ok(tag>=0);
  const start=tag+8;
  data[start+1]=0x3f;
  data[start+2]=0xc1;
  data[start+3]=4;
  data[start+4]&=0xf0;
  assert.equal(imageSize(data,"image/webp"),null);
  assert.deepEqual(imageSize(data,"image/webp",1),{width:320,height:20});
});
