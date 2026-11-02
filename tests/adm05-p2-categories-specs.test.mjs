import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {safeProductSpec,handleCatalogue} from "../backend/admin-api/catalogue-service.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const base="https://admin.example.test/v1/admin/catalogue/";
const owner={role:"owner",subject:"p2-owner"};
const editor={role:"editor",subject:"p2-editor"};
const uuid="00000000-0000-0000-0000-000000000001";
const request=(name,method="GET",value)=>new Request(base+name,{method,
  ...(value?{headers:{"content-type":"application/json"},body:JSON.stringify(value)}:{})});
function memoryDb(){
  const queries=[];
  const db=async fn=>fn({query:async(sql,args=[])=>{
    queries.push({sql,args});
    if(sql.includes("RETURNING id::text AS id,parent_id::text AS parent_id,category_code,category_label"))
      return {rowCount:1,rows:[{id:uuid,parent_id:args[1],category_code:args[2],category_label:args[0]}]};
    if(sql.startsWith("SELECT id FROM fbmn_catalog.categories"))
      return {rowCount:1,rows:[{id:args[0]}]};
    if(sql.includes("RETURNING sku_cong_ty")&&sql.startsWith("INSERT"))
      return {rowCount:1,rows:[{sku_cong_ty:args[0]}]};
    if(sql.includes("RETURNING sku_cong_ty,revision"))
      return {rowCount:1,rows:[{sku_cong_ty:args[0],revision:2}]};
    return {rowCount:0,rows:[]};
  }});
  return {queries,db};
}
test("P2 specs allow missing source data and reject invented price or invalid units",()=>{
  assert.deepEqual(safeProductSpec({pages:"200",ruling:"4 ô ly",gsm:"70",
    cover_type:"Bìa UV",packaging:"Lốc",unit:"quyển",units_per_pack:"10"}).pages,"200");
  assert.deepEqual(safeProductSpec({pages:"",gsm:null}),{pages:null,gsm:null});
  assert.equal(safeProductSpec({pages:"1".repeat(1200),ruling:"R".repeat(1200)}).pages.length,1200);
  assert.throws(()=>safeProductSpec({pages:"1".repeat(1201)}),/invalid_product_spec/);
  assert.throws(()=>safeProductSpec({net_price:"3000"}),/invalid_product_spec/);
  assert.throws(()=>safeProductSpec({gsm:"70g"}),/invalid_product_spec/);
  assert.throws(()=>safeProductSpec({units_per_pack:"0"}),/invalid_product_spec/);
});
test("P2 category creates parent/child only via authenticated Owner and preserves SKU",async()=>{
  const a=memoryDb();
  const deny=await handleCatalogue({request:request("categories","POST",{category_label:"Tập học sinh",category_code:"DM-TAP-HS"}),
    actor:editor,db:a.db});
  assert.equal(deny.status,403);
  const parent=await handleCatalogue({request:request("categories","POST",{category_label:"Tập học sinh",category_code:"DM-TAP-HS"}),
    actor:owner,db:a.db});
  assert.equal(parent.status,201);
  const child=await handleCatalogue({request:request("categories","POST",{
    category_label:"Tập 4 ô ly",category_code:"DM-TAP-4OLY",parent_id:uuid}),actor:owner,db:a.db});
  assert.equal(child.status,201);
  assert.ok(a.queries.some(x=>x.sql.includes("parent_id IS NULL")));
  assert.ok(a.queries.some(x=>x.args?.[1]==="category_create"));
  assert.equal(a.queries.filter(x=>x.sql.includes("INSERT INTO fbmn_catalog.skus")).length,0);
});
test("P2 manual create keeps literal SKU and optional specifications in private JSONB",async()=>{
  const a=memoryDb();
  const res=await handleCatalogue({request:request("skus","POST",{
    sku_cong_ty:"0114",ten_san_pham:"Tập Futurebook",category_id:uuid,
    barcode:"8990000000001",paper_size:"A5",product_spec:{
      pages:"200",ruling:"4 ô ly",gsm:"70",unit:"quyển",units_per_pack:"10"
    }}),actor:owner,db:a.db});
  assert.equal(res.status,201);
  const inserted=a.queries.find(x=>x.sql.startsWith("INSERT INTO fbmn_catalog.skus"));
  assert.equal(inserted.args[0],"0114");
  assert.equal(inserted.args[5],uuid);
  assert.equal(JSON.parse(inserted.args[6]).gsm,"70");
  assert.ok(!JSON.stringify(a.queries).includes("net_price"));
  assert.ok(!JSON.stringify(a.queries).includes("published_at"));
});
test("P2 revision-locked update merges specs without clearing fields absent from request",async()=>{
  const a=memoryDb();
  const resp=await handleCatalogue({request:request("skus","PATCH",{
    sku_cong_ty:"0114",expected_revision:1,ten_san_pham:"Tên mới",
    review_status:"draft",product_spec:{ruling:"Ngang"}
  }),actor:owner,db:a.db});
  assert.equal(resp.status,200);
  const patch=a.queries.find(x=>x.sql.startsWith("UPDATE fbmn_catalog.skus"));
  assert.match(patch.sql,/product_spec=product_spec \|\| \$11::jsonb/);
  assert.match(patch.sql,/revision=revision\+1/);
  assert.equal(patch.args[4],false);
  assert.equal(patch.args[6],false);
  assert.equal(patch.args[8],false);
  assert.deepEqual(JSON.parse(patch.args[10]),{ruling:"Ngang"});
  assert.equal(patch.args[0],"0114");
});
test("P2 UI keeps modal-only edits, category picker and optional fields",()=>{
  const src=read("apps/admin/app/catalogue-manager.tsx");
  assert.match(src,/\(create\|\|editing\)&&<ProductModal/);
  assert.match(src,/<CatalogueProductWorkspace/);
  assert.match(src,/structurePane&&<ProductModal/);
  assert.match(src,/<CatalogueStructureManager/);
  assert.match(read("apps/admin/app/catalogue-structure-manager.tsx"),/Cấp 1/);
  assert.match(src,/categoryFilter/);
  assert.match(src,/catalogue-spec-details/);
  assert.match(src,/specPayload\(spec\)/);
  assert.match(src,/sku_cong_ty:editing.sku_cong_ty/);
  assert.doesNotMatch(src,/net_price|source_price_vnd|Cần rà soát|Cần kiểm tra/);
  const proxy=read("apps/admin/app/api/catalogue/[action]/route.ts");
  assert.match(proxy,/categories/);
  const migration=read("backend/neon/migrations/20261101_adm05_p2_categories.up.sql");
  assert.match(migration,/REFERENCES fbmn_catalog\.categories/);
  assert.doesNotMatch(migration,/fbmn_catalog_private|publications/);
});
