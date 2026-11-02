import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createReadModel,PUBLIC_READ_QUERIES} from "../backend/public-api/read-model.mjs";
import {projectPublicCatalog} from "../backend/public-api/handler.mjs";
import {createStagingWorker} from "../backend/public-api/staging-worker.mjs";
import {handleCatalogue} from "../backend/admin-api/catalogue-service.mjs";
const fixture={
  p5Skus:[{sku_cong_ty:"0110",name:"Vở học sinh Futurebook",paper_size:"A5",
    product_spec:{pages:"96 trang",ruling:"4Ô",gsm:"70",unit:"Quyển"},
    category_id:null,category_label:null,family_id:null,family_label:null}],
  p5Media:[{sku_cong_ty:"0110",asset_id:"9e9c4137-2c6e-4c0f-80ff-1fbd64ae36fe",media_role:"cover",sort_order:0}],
};
const sqlResults=(sql,args=[])=>{
  if(sql===PUBLIC_READ_QUERIES.p5Skus)return fixture.p5Skus;
  if(sql===PUBLIC_READ_QUERIES.p5Media)return fixture.p5Media;
  if(sql===PUBLIC_READ_QUERIES.p5ImageKey){
    return args[0]==="9e9c4137-2c6e-4c0f-80ff-1fbd64ae36fe"?
      [{r2_key:"private/catalogue/0110.webp"}]:[];
  }
  return [];
};
test("published P5 model: exact SKU, one virtual image, no NET / R2 keys",async()=>{
  const read=createReadModel(async(sql,args)=>sqlResults(sql,args),{enableP5:true});
  const catalog=await read.getPublicCatalog();
  assert.equal(catalog.products.length,1);
  assert.equal(catalog.products[0].variants[0].sku,"0110");
  assert.equal(catalog.products[0].variants[0].specifications.pageCount,96);
  const full=createReadModel(async(sql,args)=>{
    if(sql===PUBLIC_READ_QUERIES.p5Skus)return [{...fixture.p5Skus[0],product_spec:{pages:"96 trang",gsm:"70.5",unit:"Quyển",units_per_pack:"10000"}}];
    return sqlResults(sql,args);
  },{enableP5:true});
  const spec=(await full.getPublicCatalog()).products[0].variants[0].specifications;
  assert.equal(spec.paperWeightGsm,70.5);
  assert.equal(spec.packaging.unitsPerPack,10000);
  const blank=createReadModel(async(sql,args)=>{
    if(sql===PUBLIC_READ_QUERIES.p5Skus)return [{...fixture.p5Skus[0],
      paper_size:"   ",product_spec:{unit:"   ",cover_type:"    "}}];
    return sqlResults(sql,args);
  },{enableP5:true});
  const blankSpec=(await blank.getPublicCatalog()).products[0].variants[0].specifications;
  assert.deepEqual(blankSpec,{});

  assert.equal(catalog.products[0].variants[0].price,null);
  assert.equal(catalog.categories[0].name,"Chưa phân loại");
  assert.equal(catalog.products[0].media[0].r2Key,
    "products/catalogue/9e9c4137-2c6e-4c0f-80ff-1fbd64ae36fe-v1.webp");
  assert.ok(!JSON.stringify(catalog).includes("private/catalogue"));
  assert.ok(!/price_evidence|source_price_vnd|net_price/.test(JSON.stringify(catalog)));
  assert.equal(await read.getPublicImageKey("00000000-0000-0000-0000-000000000000"),null);
});
test("default P5 OFF and no publication produces no catalogue, no image",async()=>{
  const read=createReadModel(async()=>[]);
  assert.deepEqual((await read.getPublicCatalog()).products,[]);
  assert.equal(await read.getPublicImageKey("9e9c4137-2c6e-4c0f-80ff-1fbd64ae36fe"),null);
  const empty=createReadModel(async(sql,args)=>{
    if(sql===PUBLIC_READ_QUERIES.p5Skus||sql===PUBLIC_READ_QUERIES.p5Media)return [];
    return sqlResults(sql,args);
  },{enableP5:true});
  assert.deepEqual((await empty.getPublicCatalog()).products,[]);
});
test("public image only resolves current published DB media, never exposes storage key",async()=>{
  const calls=[];
  const bytes=new Uint8Array([82,73,70,70,0,0,0,0,87,69,66,80]);
  const createDbClient=()=>({
    connect:async()=>{},end:async()=>{},
    query:async(sql,args=[])=>{
      calls.push({sql,args});
      if(sql.includes("current_user"))return {rows:[{role_name:"fbmn_p5_public_login"}]};
      return {rows:sqlResults(sql,args)};
    }
  });
  const worker=createStagingWorker({createDbClient});
  const env={HYPERDRIVE:{connectionString:"postgres://mock"},
    RATE_LIMITER:{limit:async()=>({success:true})},
    IMAGE_RATE_LIMITER:{limit:async()=>({success:true})},
    EXPECTED_DB_ROLE:"fbmn_p5_public_login",
    PUBLIC_P5_ENABLED:"true",PUBLIC_ALLOWED_ORIGINS:"https://fbmn-web.vercel.app",
    PUBLIC_MEDIA_R2:{get:async key=>{
      assert.equal(key,"private/catalogue/0110.webp");
      return {body:new Response(bytes).body};
    }}
  };
  const uuid="9e9c4137-2c6e-4c0f-80ff-1fbd64ae36fe";
  const response=await worker.fetch(new Request(
    "https://worker.example.test/v1/public/image?id="+uuid),env);
  assert.equal(response.status,200);
  assert.equal(response.headers.get("content-type"),"image/webp");
  assert.equal(response.headers.get("cache-control"),"no-store");
  assert.equal((await response.arrayBuffer()).byteLength,bytes.length);
  assert.equal((await worker.fetch(new Request(
    "https://worker.example.test/v1/public/image?id=00000000-0000-0000-0000-000000000000"),env)).status,404);
  assert.equal((await worker.fetch(new Request(
    "https://worker.example.test/v1/public/image?id="+uuid+"&id="+uuid),env)).status,400);
  assert.ok(calls.some(x=>x.sql===PUBLIC_READ_QUERIES.p5ImageKey));
});
const actor={role:"owner",subject:"p5-owner"};
function adminReq(body){
 return new Request("https://admin.example.test/v1/admin/catalogue/visibility",{
   method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
}
test("Owner visibility: explicit per-SKU per-channel, optimistic revisions, SQL audit",async()=>{
 const statements=[];
 const db=async fn=>fn({query:async(sql,params=[])=>{
   statements.push({sql,params});
   if(sql.includes("SELECT sku_cong_ty FROM fbmn_catalog.skus"))return {rowCount:1,rows:[{sku_cong_ty:"0110"}]};
   if(sql.includes("UPDATE fbmn_catalog.publications SET"))return {rowCount:1,rows:[
     {sku_cong_ty:"0110",channel_code:"public_web",state:"hidden",revision:2}]};
   if(sql.includes("INSERT INTO fbmn_catalog.publications"))return {rowCount:1,rows:[
     {sku_cong_ty:"0110",channel_code:"public_web",state:"published",revision:1}]};
   return {rowCount:1,rows:[]};
 }});
 const body={sku_cong_ty:"0110",channel_code:"public_web",visible:true,
   expected_revision:0,confirm:"CAP_NHAT_HIEN_THI"};
 const denied=await handleCatalogue({request:adminReq(body),actor:{role:"editor",subject:"e"},db});
 assert.equal(denied.status,403);
 const allowed=await handleCatalogue({request:adminReq(body),actor,db});
 assert.equal(allowed.status,200);
 assert.equal((await allowed.json()).data.state,"published");
 assert.ok(statements.some(x=>x.sql==="COMMIT"));
 assert.ok(statements.some(x=>x.sql.includes("INSERT INTO fbmn_catalog.audit_events")));
 assert.ok(statements.every(x=>!x.sql.includes("price_evidence")));
 const hide=await handleCatalogue({request:adminReq({...body,visible:false,expected_revision:1}),actor,db});
 assert.equal(hide.status,200);
 assert.equal((await hide.json()).data.state,"hidden");
 assert.ok(statements.some(x=>x.sql.includes("UPDATE fbmn_catalog.publications SET")));

 const stale=await handleCatalogue({request:adminReq({...body,expected_revision:-1}),actor,db});
 assert.equal(stale.status,400);
});
test("P5 migration is publication-gated, role-scoped, has no price-table projections",()=>{
 const migration=readFileSync(new URL("../backend/neon/migrations/20261102_adm05_p5_channel_catalogue_up.sql",import.meta.url),"utf8");
 assert.match(migration,/p\.channel_code='public_web' AND p\.state='published'/);
 assert.match(migration,/GRANT SELECT ON fbmn_public\.v_p5_visible_skus/);
 assert.match(migration,/TO fbmn_public_reader/);
 assert.ok(!migration.includes("source_price_vnd"));
 assert.ok(!migration.includes("price_evidence"));
 assert.match(migration,/GRANT UPDATE \(state,approved_by,approved_at,published_at,revision\)/);
});

test("a full-length company SKU still yields contract-safe public product id",async()=>{
  const longSku="A".repeat(80);
  const source=async(sql)=>{
    if(sql===PUBLIC_READ_QUERIES.p5Skus)return [{
      sku_cong_ty:longSku,name:"Vở Futurebook",paper_size:null,product_spec:{},
      category_id:null,category_label:null,family_id:null,family_label:null}];
    return [];
  };
  const model=createReadModel(source,{enableP5:true});
  const item=(await model.getPublicCatalog()).products[0];
  assert.ok(item.id.length<=80);
  assert.equal(item.slug,item.id);
  assert.equal(item.variants[0].sku,longSku);
});


test("101 published company SKUs in one family appear across two product cards",async()=>{
  const family="4f8e4b28-52e1-4514-b7a4-f584bb6dcd74";
  const records=Array.from({length:101},(_,i)=>({
    sku_cong_ty:"F"+String(i).padStart(4,"0"),name:"Futurebook family "+i,
    paper_size:"A4",product_spec:{},category_id:null,category_label:null,
    family_id:family,family_label:"F".repeat(160)
  }));
  const model=createReadModel(async sql=>{
    if(sql===PUBLIC_READ_QUERIES.p5Skus)return records;
    return [];
  },{enableP5:true});
  const result=await model.getPublicCatalog();
  assert.equal(result.products.length,2);
  assert.deepEqual(result.products.map(p=>p.variants.length),[100,1]);
  assert.equal(result.products[1].variants[0].sku,"F0100");
  assert.equal(new Set(result.products.flatMap(p=>p.variants.map(v=>v.sku))).size,101);
  assert.ok(result.products.every(p=>p.variants.length<=100));
  assert.ok(result.products.every(p=>p.name.length<=160));
  assert.match(result.products[1].name,/Phần 2$/);
});


test("over 10,000 valid published media links remain accessible through keyset pages",async()=>{
  const skuRows=Array.from({length:501},(_,i)=>({
    sku_cong_ty:"M"+String(i).padStart(4,"0"),name:"Sổ Futurebook "+i,
    paper_size:"A5",product_spec:{},category_id:null,category_label:null,
    family_id:null,family_label:null
  }));
  const mediaRows=skuRows.flatMap((row,i)=>Array.from({length:20},(_,n)=>({
    sku_cong_ty:row.sku_cong_ty,
    sort_order:n,media_role:n===0?"cover":"detail",
    asset_id:"00000000-0000-4000-8000-"+String(i*20+n+1).padStart(12,"0")
  })));
  let pages=0;
  const model=createReadModel(async(sql,cursor=[])=>{
    if(sql===PUBLIC_READ_QUERIES.p5Skus)return skuRows;
    if(sql===PUBLIC_READ_QUERIES.p5Media){
      pages++;
      const [sku="",position=-1,asset=""]=cursor;
      const filtered=mediaRows.filter(x=>
        x.sku_cong_ty>sku||(x.sku_cong_ty===sku&&
        (x.sort_order>position||(x.sort_order===position&&x.asset_id>asset))));
      return filtered.slice(0,1000);
    }
    return [];
  },{enableP5:true});
  const catalogue=await model.getPublicCatalog();
  assert.equal(catalogue.products.length,501);
  assert.equal(catalogue.products.flatMap(p=>p.media).length,10020);
  assert.ok(pages>=11);
});


test("P5 media cursor accepts DB locale order unlike JS mixed-case ordering",async()=>{
  let calls=0;
  const model=createReadModel(async(sql,args=[])=>{
    if(sql===PUBLIC_READ_QUERIES.p5Skus)return [
      {sku_cong_ty:"a0000",name:"Futurebook a",paper_size:null,product_spec:{},
       category_id:null,category_label:null,family_id:null,family_label:null},
      {sku_cong_ty:"B0000",name:"Futurebook B",paper_size:null,product_spec:{},
       category_id:null,category_label:null,family_id:null,family_label:null}
    ];
    if(sql===PUBLIC_READ_QUERIES.p5Media){
      calls++;
      if(calls===1)return Array.from({length:1000},(_,i)=>({
        sku_cong_ty:"a0000",sort_order:i,media_role:"detail",
        asset_id:"00000000-0000-4000-8000-"+String(i+1).padStart(12,"0")
      }));
      if(calls===2){
        assert.equal(args[0],"a0000");
        return [{sku_cong_ty:"B0000",sort_order:0,media_role:"cover",
          asset_id:"00000000-0000-4000-8000-000000001001"}];
      }
      return [];
    }
    return [];
  },{enableP5:true});
  const out=await model.getPublicCatalog();
  assert.equal(out.products.length,2);
  assert.equal(calls,2);
});

test("201 legitimate published categories do not take down the entire public catalogue",async()=>{
  const skus=Array.from({length:201},(_,i)=>({
    sku_cong_ty:"CAT"+String(i).padStart(4,"0"),name:"Futurebook "+i,
    paper_size:null,product_spec:{},
    category_id:"00000000-0000-4000-8000-"+String(i+1).padStart(12,"0"),
    category_label:"Nhóm hàng "+i,family_id:null,family_label:null
  }));
  const model=createReadModel(async sql=>sql===PUBLIC_READ_QUERIES.p5Skus?skus:[],{enableP5:true});
  const raw=await model.getPublicCatalog();
  assert.equal(raw.categories.length,201);
  assert.equal(raw.products.length,201);
  const projected=projectPublicCatalog(raw);
  assert.equal(projected.categories.length,201);
  assert.equal(projected.products.length,201);
});
