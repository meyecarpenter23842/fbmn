import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleCatalogue} from "../backend/admin-api/catalogue-service.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const id="10000000-0000-0000-0000-000000000001";
const owner={role:"owner",subject:"manual-code-owner"};
const editor={role:"editor",subject:"manual-code-editor"};
const req=(route,method,data)=>new Request("https://private.example.test/v1/admin/catalogue/"+route,{
  method,headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
function mockDb({conflict=false,duplicate=false}={}){
  const calls=[];
  const db=async fn=>fn({query:async(sql,args=[])=>{
    calls.push({sql,args});
    if((sql.startsWith("INSERT INTO fbmn_catalog.categories(")||
        sql.startsWith("INSERT INTO fbmn_catalog.families("))&&duplicate){
      const err=new Error("duplicate_key");err.code="23505";throw err;
    }
    if(sql.startsWith("INSERT INTO fbmn_catalog.categories("))
      return {rowCount:1,rows:[{id,parent_id:args[1],category_label:args[0],category_code:args[2]}]};
    if(sql.startsWith("INSERT INTO fbmn_catalog.families("))
      return {rowCount:1,rows:[{id,family_label:args[0],family_code:args[1],revision:1}]};
    if(sql.startsWith("UPDATE fbmn_catalog.categories SET category_code="))
      return {rowCount:conflict?0:1,rows:conflict?[]:[{id,category_code:args[0],category_label:"Vở"}]};
    if(sql.startsWith("UPDATE fbmn_catalog.families SET family_code="))
      return {rowCount:conflict?0:1,rows:conflict?[]:[{id,family_code:args[0],family_label:"Bìa",revision:4}]};
    if(sql.startsWith("SELECT id FROM fbmn_catalog.families WHERE lower("))
      return {rowCount:0,rows:[]};
    return {rowCount:0,rows:[]};
  }});
  return {db,calls};
}
test("G03 requires a user-entered code on create; never generates a code",async()=>{
  const x=mockDb();
  for(const route of ["categories","families"]){
    const name=route==="categories"?"category_label":"family_label";
    const code=route==="categories"?"category_code":"family_code";
    for(const invalid of [undefined,"","dm-low","bad code","D","A".repeat(33)]){
      const data={[name]:"Sản phẩm"};
      if(invalid!==undefined)data[code]=invalid;
      const r=await handleCatalogue({request:req(route,"POST",data),actor:owner,db:x.db});
      assert.equal(r.status,400,route+" "+String(invalid));
    }
  }
  assert.equal(x.calls.filter(c=>c.sql.startsWith("INSERT INTO fbmn_catalog.")).length,0);
  const cat={category_label:"Tập học sinh",category_code:"DM-TAP-HS"};
  const denied=await handleCatalogue({request:req("categories","POST",cat),actor:editor,db:x.db});
  assert.equal(denied.status,403);
  const ok=await handleCatalogue({request:req("categories","POST",cat),actor:owner,db:x.db});
  assert.equal(ok.status,201);
  assert.deepEqual(x.calls.find(c=>c.sql.startsWith("INSERT INTO fbmn_catalog.categories(")).args,
    ["Tập học sinh",null,"DM-TAP-HS"]);
  const fam={family_label:"Vở 96 trang caro",family_code:"NM-VO96-CARO"};
  const family=await handleCatalogue({request:req("families","POST",fam),actor:owner,db:x.db});
  assert.equal(family.status,201);
  assert.deepEqual(x.calls.find(c=>c.sql.startsWith("INSERT INTO fbmn_catalog.families(")).args,
    ["Vở 96 trang caro","NM-VO96-CARO"]);
});
test("duplicate manual code is conflict (409), no fake success or automatic retry",async()=>{
  const x=mockDb({duplicate:true});
  for(const [route,data] of [
    ["categories",{category_label:"Tập học sinh",category_code:"DM-TAP-HS"}],
    ["families",{family_label:"Mẫu bìa",family_code:"NM-VO96"}]]){
    const r=await handleCatalogue({request:req(route,"POST",data),actor:owner,db:x.db});
    assert.equal(r.status,409);
    assert.equal((await r.json()).error.code,"catalogue_conflict");
  }
  assert.equal(x.calls.filter(c=>c.sql==="ROLLBACK").length,2);
});
test("existing codes are editable only by Owner, with CAS and audit; SKU ids stay untouched",async()=>{
  for(const [route,data,expectedArgs] of [
    ["categories",{id,expected_code:"DM-0001",category_code:"DM-TAP-HS"},["DM-TAP-HS",id,"DM-0001"]],
    ["families",{id,expected_code:"NM-0001",family_code:"NM-VO96",expected_revision:3},["NM-VO96",id,"NM-0001",3]]
  ]){
    const x=mockDb();
    assert.equal((await handleCatalogue({request:req(route,"PATCH",data),actor:editor,db:x.db})).status,403);
    const saved=await handleCatalogue({request:req(route,"PATCH",data),actor:owner,db:x.db});
    assert.equal(saved.status,200);
    const change=x.calls.find(c=>c.sql.startsWith("UPDATE fbmn_catalog."+(route==="categories"?"categories":"families")+" SET "+
      (route==="categories"?"category_code":"family_code")));
    assert.deepEqual(change.args,expectedArgs);
    assert.ok(x.calls.some(c=>c.sql.startsWith("INSERT INTO fbmn_catalog.audit_events")));
    assert.ok(!x.calls.some(c=>/UPDATE fbmn_catalog\.skus|DELETE FROM/.test(c.sql)));
    const stale=mockDb({conflict:true});
    assert.equal((await handleCatalogue({request:req(route,"PATCH",data),actor:owner,db:stale.db})).status,409);
  }
});
test("Neon migration drops both automatic defaults, preserves old codes, limits editable columns",()=>{
  const sql=read("backend/neon/migrations/20261102_adm05_g03_manual_codes.up.sql");
  assert.match(sql,/ALTER COLUMN category_code DROP DEFAULT/);
  assert.match(sql,/ALTER COLUMN family_code DROP DEFAULT/);
  assert.match(sql,/GRANT UPDATE \(category_code\)/);
  assert.match(sql,/GRANT UPDATE \(family_code\)/);
  assert.match(sql,/CHECK \(category_code ~/);
  assert.doesNotMatch(sql,/UPDATE fbmn_catalog\.skus|INSERT INTO fbmn_catalog\.skus|SET DEFAULT/);
  const ui=read("apps/admin/app/catalogue-structure-manager.tsx");
  const manager=read("apps/admin/app/catalogue-manager.tsx");
  assert.match(ui,/Mã quản lý \(bắt buộc\)/);
  assert.match(ui,/!validCode\(newCode\)/);
  assert.match(ui,/onChangeCategoryCode/);
  assert.match(ui,/onChangeFamilyCode/);
  assert.match(manager,/category_code:code/);
  assert.match(manager,/family_code:code/);
  assert.doesNotMatch(ui,/mã được cấp tự động|Mã DM\/NM được cấp tự động/);
});
