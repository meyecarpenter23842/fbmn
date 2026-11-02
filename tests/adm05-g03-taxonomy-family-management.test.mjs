import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleCatalogue} from "../backend/admin-api/catalogue-service.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const url="https://admin.example.test/v1/admin/catalogue/";
const id="10000000-0000-0000-0000-000000000001";
const owner={role:"owner",subject:"g03-owner"};
const editor={role:"editor",subject:"g03-editor"};
function request(route,method,body){
  return new Request(url+route,{method,headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)});
}
function fakeDb({conflict=false,duplicate=false}={}){
  const calls=[];
  const db=async fn=>fn({query:async(sql,args=[])=>{
    calls.push({sql,args});
    if(sql.startsWith("SELECT id FROM fbmn_catalog.families WHERE id=$1"))
      return {rowCount:1,rows:[{id}]};
    if(sql.startsWith("SELECT id FROM fbmn_catalog.families WHERE lower(btrim(family_label))"))
      return {rowCount:duplicate?1:0,rows:duplicate?[{id}]:[]};
    if(sql.startsWith("UPDATE fbmn_catalog.families"))
      return {rowCount:conflict?0:1,rows:[{id,family_label:args[0],revision:3}]};
    if(sql.startsWith("UPDATE fbmn_catalog.categories"))
      return {rowCount:conflict?0:1,rows:[{id,parent_id:null,category_label:args[0]}]};
    if(sql.startsWith("UPDATE fbmn_catalog.skus SET family_id="))
      return {rowCount:conflict?0:1,rows:[{sku_cong_ty:args[1],revision:args[2]+1,family_id:args[0]}]};
    if(sql.startsWith("INSERT INTO fbmn_catalog.families"))
      return {rowCount:1,rows:[{id,family_label:args[0],revision:1}]};
    return {rowCount:0,rows:[]};
  }});
  return {db,calls};
}
test("G03 category rename is owner-only, compares previous name, records audit, does not change hierarchy or SKU",async()=>{
  const value={id,expected_label:"Tập học sinh",category_label:"Tập học sinh và sinh viên"};
  const a=fakeDb();
  const denied=await handleCatalogue({request:request("categories","PATCH",value),actor:editor,db:a.db});
  assert.equal(denied.status,403);
  const ok=await handleCatalogue({request:request("categories","PATCH",value),actor:owner,db:a.db});
  assert.equal(ok.status,200);
  const query=a.calls.find(c=>c.sql.startsWith("UPDATE fbmn_catalog.categories"));
  assert.match(query.sql,/category_label=\$1/);
  assert.match(query.sql,/WHERE id=\$2 AND category_label=\$3/);
  assert.deepEqual(query.args,[value.category_label,id,value.expected_label]);
  assert.ok(a.calls.some(c=>c.sql.includes("INSERT INTO fbmn_catalog.audit_events")));
  assert.ok(a.calls.some(c=>c.sql==="COMMIT"));
  assert.ok(!a.calls.some(c=>/DELETE |UPDATE fbmn_catalog\.skus/.test(c.sql)));
});
test("G03 family rename is revision-locked, serializes duplicate checks, prevents duplicate names",async()=>{
  const value={id,expected_revision:2,family_label:"Bìa mẫu mới"};
  const a=fakeDb();
  assert.equal((await handleCatalogue({request:request("families","PATCH",value),actor:owner,db:a.db})).status,200);
  assert.ok(a.calls.some(c=>c.sql.includes("pg_advisory_xact_lock")));
  const change=a.calls.find(c=>c.sql.startsWith("UPDATE fbmn_catalog.families"));
  assert.match(change.sql,/revision=revision\+1/);
  assert.match(change.sql,/revision=\$3/);
  assert.equal(change.args[2],2);
  const dupe=fakeDb({duplicate:true});
  assert.equal((await handleCatalogue({request:request("families","PATCH",value),actor:owner,db:dupe.db})).status,409);
  assert.ok(dupe.calls.some(c=>c.sql==="ROLLBACK"));
  const stale=fakeDb({conflict:true});
  assert.equal((await handleCatalogue({request:request("families","PATCH",value),actor:owner,db:stale.db})).status,409);
});
test("G03 single-SKU membership supports assign/move/unlink, immutable literal code and revision guard",async()=>{
  for(const family_id of [id,null]){
    const a=fakeDb();
    const value={sku_cong_ty:"0114",expected_revision:3,family_id,confirm:"CAP_NHAT_NHOM_MAU"};
    const deny=await handleCatalogue({request:request("membership","POST",value),actor:editor,db:a.db});
    assert.equal(deny.status,403);
    const ok=await handleCatalogue({request:request("membership","POST",value),actor:owner,db:a.db});
    assert.equal(ok.status,200);
    const change=a.calls.find(c=>c.sql.startsWith("UPDATE fbmn_catalog.skus SET family_id="));
    assert.match(change.sql,/revision=revision\+1/);
    assert.match(change.sql,/sku_cong_ty=\$2 AND revision=\$3/);
    assert.match(change.sql,/review_status IN \('draft','needs_review'\)/);
    assert.match(change.sql,/family_id IS DISTINCT FROM \$1::uuid/);
    assert.deepEqual(change.args,[family_id,"0114",3]);
    assert.ok(a.calls.some(c=>c.sql.includes("INSERT INTO fbmn_catalog.audit_events")&&c.args[1]==="family_membership_change"));
    assert.ok(!a.calls.some(c=>/UPDATE.*ten_san_pham|UPDATE.*barcode|UPDATE.*publications/.test(c.sql)));
    const missingConfirm=await handleCatalogue({request:request("membership","POST",{...value,confirm:"wrong"}),actor:owner,db:a.db});
    assert.equal(missingConfirm.status,400);
    const conflict=fakeDb({conflict:true});
    assert.equal((await handleCatalogue({request:request("membership","POST",value),actor:owner,db:conflict.db})).status,409);
  }
});
test("G03 hierarchy, counts, searchable membership and private access are routed correctly",()=>{
  const ui=read("apps/admin/app/catalogue-structure-manager.tsx");
  const manager=read("apps/admin/app/catalogue-manager.tsx");
  const relay=read("apps/admin/app/api/catalogue/[action]/route.ts");
  const service=read("backend/admin-api/catalogue-service.mjs");
  const style=read("apps/admin/app/catalogue-structure.css");
  assert.match(manager,/<CatalogueStructureManager/);
  assert.match(manager,/setStructurePane\("categories"\)/);
  assert.match(manager,/setStructurePane\("families"\)/);
  assert.match(manager,/>Thoát chọn nhóm<\/button>/);
  assert.match(manager,/setGroupMode\(false\);setSelected\(\[\]\);setActionMenu\(null\)/);
  assert.match(ui,/categories\.filter\(c=>!c\.parent_id\)/);
  assert.match(ui,/directCategoryCounts/);
  assert.match(ui,/familyCounts/);
  assert.match(ui,/memberMatches\.slice\(0,200\)/);
  assert.match(ui,/Gỡ nhóm/);
  assert.match(ui,/onChangeMember\(sku,familyId\)/);
  assert.match(manager,/expected_revision:row\.revision/);
  assert.match(manager,/confirm:"CAP_NHAT_NHOM_MAU"/);
  assert.match(relay,/"membership"/);
  assert.match(relay,/\["skus","categories","families"\]\.includes\(action\)/);
  assert.match(service,/actor\.role!=="owner"/);
  assert.match(style,/@media\(max-width:520px\)/);
  assert.match(style,/max-height:calc\(95dvh - 88px\)/);
  assert.match(style,/\.catalogue-structure-grid\{display:flex;flex-direction:column;overflow-y:auto\}/);
  assert.doesNotMatch(service,/DROP TABLE|TRUNCATE TABLE|DELETE FROM fbmn_catalog\.skus/);
});
test("G03 grant migration changes only two label columns and family revision",()=>{
  const up=read("backend/neon/migrations/20261102_adm05_g03_taxonomy_roles.up.sql");
  const down=read("backend/neon/migrations/20261102_adm05_g03_taxonomy_roles.down.sql");
  assert.match(up,/GRANT UPDATE \(category_label\) ON fbmn_catalog\.categories/);
  assert.match(up,/GRANT UPDATE \(family_label,revision\) ON fbmn_catalog\.families/);
  assert.match(down,/REVOKE UPDATE \(category_label\)/);
  assert.doesNotMatch(up,/GRANT UPDATE ON fbmn_catalog\.skus|fbmn_catalog_private|fbmn_public/);
});
