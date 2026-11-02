import test from "node:test";
import assert from "node:assert/strict";
import {detectSkuFromName,findR2SkuCandidates} from "../backend/admin-api/media-sku-sync.mjs";
import {handleMedia,imageSize} from "../backend/admin-api/media-service.mjs";

const actor={role:"owner",subject:"owner"};
const valid=()=>new Uint8Array(Buffer.from(
  "UklGRiAAAABXRUJQVlA4TBMAAAAvP8APEAcQEREAEsL/91pE/1M/AA==","base64"));
const asset="a99f7e12-c1ab-4bc8-91c0-1fa667b31ad0";
const sku="0114";
const path="private/catalogue/0114-02.webp";
function request(action,method="GET",body,headers={}){
  return new Request("https://example.test/v1/admin/catalogue/media/"+action,{
    method,headers,...(body?{body}:{})
  });
}
function db(logs=[],existing=[]){
  return async fn=>fn({query:async(sql,args=[])=>{
    logs.push({sql,args});
    if(sql.includes("SELECT sku_cong_ty FROM fbmn_catalog.skus ORDER BY"))
      return {rowCount:1,rows:[{sku_cong_ty:sku}]};
    if(sql.includes("SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE"))
      return {rowCount:1,rows:[{sku_cong_ty:sku}]};
    if(sql.includes("SELECT a.id::text AS id,a.r2_key,l.sort_order"))
      return {rowCount:existing.length,rows:existing};
    if(sql.includes("SELECT count(*)::int AS amount")&&sql.includes("WHERE asset_id="))
      return {rowCount:1,rows:[{amount:1}]};
    if(sql.includes("SELECT count(*)::int AS amount"))
      return {rowCount:1,rows:[{amount:0,last_position:-1}]};
    if(sql.includes("SELECT id FROM fbmn_catalog.media_assets WHERE id=$1 FOR UPDATE"))
      return {rowCount:1,rows:[{id:asset}]};
    if(sql.includes("SELECT id FROM fbmn_catalog.media_assets")||
       sql.includes("SELECT a.id FROM fbmn_catalog.media_assets"))
      return {rowCount:0,rows:[]};
    if(sql.includes("SELECT r2_key FROM fbmn_catalog.media_assets"))
      return {rowCount:0,rows:[]};
    if(sql.includes("SELECT a.r2_key,a.mime_type"))
      return {rowCount:1,rows:[{r2_key:"private/catalogue/0114.webp",mime_type:"image/webp"}]};
    return {rowCount:1,rows:[{}]};
  }});
}
test("one file per slot: exact leading-zero company SKU and numbered WebP",()=>{
  const codes=new Set(["0114","L536","L536-01","C592","C5921"]);
  assert.deepEqual(detectSkuFromName("private/catalogue/0114.webp",codes),
    {status:"matched",sku:"0114",filename:"0114.webp"});
  assert.equal(detectSkuFromName("private/catalogue/0114-02.webp",codes).sku,"0114");
  assert.equal(detectSkuFromName("private/catalogue/L536-02.webp",new Set(["L536-02"])).status,"matched");
  assert.equal(detectSkuFromName("private/catalogue/0114-01.webp",codes).status,"invalid_filename");
  assert.equal(detectSkuFromName("private/catalogue/0114.png",codes).status,"needs_webp");
  assert.equal(detectSkuFromName("private/catalogue/L536-01.webp",codes).status,"ambiguous");
  assert.equal(detectSkuFromName("private/catalogue/C5921.webp",codes).sku,"C5921");
  assert.equal(detectSkuFromName("private/catalogue/114.webp",codes).status,"unmatched");
  assert.equal(detectSkuFromName("private/catalogue/inbox/0114.webp",codes).status,"nested_path");
});
test("scan never changes R2, skips registered keys, classifies PNG as conversion-required",async()=>{
  const reads=[],sql=[];
  const store={put:async()=>{throw Error("unexpected write");},get:async()=>{},
    list:async opts=>{reads.push(opts);return {objects:[
      {key:"private/catalogue/0114.webp",size:140},
      {key:"private/catalogue/0114-02.webp",size:120},
      {key:"private/catalogue/0114.png",size:500}
    ],truncated:false};}};
  const query=async f=>f({query:async(t)=>{
    sql.push(t);
    if(t.includes("SELECT sku_cong_ty"))return {rows:[{sku_cong_ty:"0114"}]};
    if(t.includes("SELECT r2_key"))return {rows:[{r2_key:"private/catalogue/0114.webp"}]};
    throw Error("unexpected SQL");
  }});
  const result=await findR2SkuCandidates({db:query,r2:store});
  assert.equal(result.items.length,2);
  assert.equal(result.items.find(x=>x.key===path).status,"matched");
  assert.equal(result.items.find(x=>x.key.endsWith(".png")).status,"needs_webp");
  assert.equal(reads[0].prefix,"private/catalogue/");
  assert.ok(sql.every(t=>!t.includes("UPDATE")&&!t.includes("DELETE")));
});
test("Owner batch adoption links already-uploaded WebP exactly once without creating derivatives",async()=>{
  const logs=[],calls=[],body=valid();
  const store={
    put:async()=>{throw Error("adoption must not write");},
    get:async key=>{
      assert.ok(logs.some(row=>row.sql.includes("pg_advisory_xact_lock")),
        "R2 must be read only after upload/adopt key lock");
      calls.push(key);return {size:body.length,arrayBuffer:async()=>body};
    }
  };
  const res=await handleMedia({request:request("adopt","POST",
    JSON.stringify({confirm:"GAN_ANH_R2",keys:[path]}),{"Content-Type":"application/json"}),
    actor,db:db(logs),r2:store});
  assert.equal(res.status,201);
  assert.equal((await res.json()).data.count,1);
  assert.deepEqual(calls,[path]);
  assert.ok(logs.some(x=>x.sql.includes("'filename_exact'")));
  assert.ok(logs.some(x=>x.sql==="COMMIT"));
  const denied=await handleMedia({request:request("adopt","POST",
    JSON.stringify({confirm:"GAN_ANH_R2",keys:[path]}),{"Content-Type":"application/json"}),
    actor:{role:"editor"},db:db([]),r2:store});
  assert.equal(denied.status,403);
});
test("upload new WebP uses stable SKU key, overwrite existing asset preserves identity",async()=>{
  const logs=[],written=[],body=valid();
  const store={
    get:async()=>null,head:async()=>null,
    put:async(key,bytes,meta)=>written.push({key,size:bytes.length,mime:meta.httpMetadata.contentType})
  };
  const create=await handleMedia({request:request("upload","POST",body,{
    "Content-Type":"image/webp","X-FBMN-Sku":sku,"X-FBMN-File-Name":"test.webp"
  }),actor,db:db(logs),r2:store});
  assert.equal(create.status,201);
  assert.deepEqual(written,[{key:"private/catalogue/0114.webp",size:body.length,mime:"image/webp"}]);
  assert.ok(logs.some(x=>x.sql.includes("INSERT INTO fbmn_catalog.media_assets")));
  const existing=[{id:asset,r2_key:"private/catalogue/0114.webp",sort_order:0,media_role:"cover"}];
  const replaceLogs=[];
  const replaced=await handleMedia({request:request("upload","POST",body,{
    "Content-Type":"image/webp","X-FBMN-Sku":sku,"X-FBMN-File-Name":"new.webp",
    "X-FBMN-Asset-ID":asset
  }),actor,db:db(replaceLogs,existing),r2:store});
  assert.equal(replaced.status,200);
  assert.equal((await replaced.json()).data.id,asset);
  assert.equal(written.length,2);
  assert.equal(written[1].key,"private/catalogue/0114.webp");
  assert.ok(replaceLogs.some(x=>x.sql.includes("UPDATE fbmn_catalog.media_assets")));
  assert.ok(!replaceLogs.some(x=>x.sql.includes("INSERT INTO fbmn_catalog.media_assets")));
});
test("reject PNG writes, fake WebP, non-owner, and existing unregistered canonical path",async()=>{
  const body=valid(),actions=[];
  const store={put:async()=>actions.push("put"),get:async()=>null,
    head:async()=>({key:"private/catalogue/0114.webp"})};
  const png=await handleMedia({request:request("upload","POST",body,{
    "Content-Type":"image/png","X-FBMN-Sku":sku}),actor,db:db(),r2:store});
  assert.equal(png.status,400);
  const ownerOnly=await handleMedia({request:request("upload","POST",body,{
    "Content-Type":"image/webp","X-FBMN-Sku":sku}),actor:{role:"editor"},db:db(),r2:store});
  assert.equal(ownerOnly.status,403);
  const conflict=await handleMedia({request:request("upload","POST",body,{
    "Content-Type":"image/webp","X-FBMN-Sku":sku}),actor,db:db(),r2:store});
  assert.equal(conflict.status,409);
  const invalid=await handleMedia({request:request("upload","POST",new Uint8Array(64),{
    "Content-Type":"image/webp","X-FBMN-Sku":sku}),actor,db:db(),r2:store});
  assert.equal(invalid.status,422);
  assert.equal(actions.length,0);
});
test("direct file GET retrieves exactly one stored image and refuses variant queries",async()=>{
  const keys=[],payload=valid();
  const store={put:async()=>{},get:async key=>{
    keys.push(key);
    return {body:new ReadableStream({start(c){c.enqueue(payload);c.close();}})};
  }};
  const ok=await handleMedia({request:request("file?id="+asset),actor,db:db(),r2:store});
  assert.equal(ok.status,200);
  assert.equal(ok.headers.get("content-type"),"image/webp");
  assert.equal(ok.headers.get("cache-control"),"private, no-store");
  assert.deepEqual(keys,["private/catalogue/0114.webp"]);
  const extra=await handleMedia({request:request("file?id="+asset+"&variant=thumb"),actor,db:db(),r2:store});
  assert.equal(extra.status,400);
  assert.equal(keys.length,1);
});
test("narrow aspect WebP remains valid for max-1600 image uploads",()=>{
  const data=Buffer.from("UklGRiQAAABXRUJQVlA4TBcAAAAvP8APAAdQj1IUpf8BICH8f69F9D/1AwA=","base64");
  const tag=data.indexOf(Buffer.from("VP8L")),start=tag+8;
  data[start+1]=0x3f;data[start+2]=0xc1;data[start+3]=4;data[start+4]&=0xf0;
  assert.equal(imageSize(data,"image/webp"),null);
  assert.deepEqual(imageSize(data,"image/webp",1),{width:320,height:20});
});

test("if audit SQL fails after a new WebP PUT, only the new key is removed",async()=>{
  const changes=[],file=valid();
  const database=async fn=>fn({query:async(sql)=>{
    if(sql.includes("SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE"))return {rowCount:1,rows:[{}]};
    if(sql.includes("SELECT id FROM fbmn_catalog.media_assets WHERE r2_key="))return {rowCount:0,rows:[]};
    if(sql.includes("SELECT a.id::text AS id,a.r2_key,l.sort_order"))return {rowCount:0,rows:[]};
    if(sql.includes("SELECT a.id FROM fbmn_catalog.media_assets a JOIN"))return {rowCount:0,rows:[]};
    if(sql.includes("INSERT INTO fbmn_catalog.audit_events"))throw Error("audit_fail");
    return {rowCount:1,rows:[{}]};
  }});
  const store={get:async()=>null,head:async()=>null,
    put:async key=>changes.push(["put",key]),delete:async key=>changes.push(["delete",key])};
  const result=await handleMedia({request:request("upload","POST",file,{
    "Content-Type":"image/webp","X-FBMN-Sku":sku}),actor,db:database,r2:store});
  assert.equal(result.status,503);
  assert.deepEqual(changes,[["put","private/catalogue/0114.webp"],["delete","private/catalogue/0114.webp"]]);
});
