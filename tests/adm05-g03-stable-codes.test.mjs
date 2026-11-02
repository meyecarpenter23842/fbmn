import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planSheetSync} from "../apps/admin/lib/sheet-sync.mjs";
import {safeDraft} from "../backend/admin-api/catalogue-service.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const A="10000000-0000-0000-0000-000000000001";
const B="10000000-0000-0000-0000-000000000002";
const C="20000000-0000-0000-0000-000000000001";
const D="20000000-0000-0000-0000-000000000002";
const categories=[
 {id:A,parent_id:null,category_code:"DM-0001",category_label:"Vở học sinh"},
 {id:B,parent_id:A,category_code:"DM-0002",category_label:"96 trang"}];
const families=[
 {id:C,family_code:"NM-0001",family_label:"Mẫu bìa A"},
 {id:D,family_code:"NM-0002",family_label:"Mẫu bìa B"}];
const current={sku_cong_ty:"0114",ten_san_pham:"Vở 96 trang",revision:3,
 category_id:A,family_id:C,review_status:"draft",product_spec:{}};
function parsed(sku="0114",description={},title=""){
 return {source_sheet:"SAN PHAM",rows:[{__row:2,sku_cong_ty:sku,
   ten_san_pham:title,barcode:"",paper_size:""}],
   evidence:[{specifications:description}]};
}
function plan(spec, fields=["category_code","family_code"], old=[current], sku="0114",title=""){
 return planSheetSync(parsed(sku,spec,title),old,categories,{mappedFields:fields,families});
}
test("G03: stable codes map into UUID relationships and preserve literal leading-zero SKU",()=>{
 const result=plan({category_code:"DM-0002",family_code:"NM-0002"});
 assert.deepEqual(result.totals,{create:0,update:1,unchanged:0,conflict:0,error:0});
 assert.equal(result.operations[0].sku_cong_ty,"0114");
 assert.deepEqual(result.operations[0].changes,{category_id:B,family_id:D});
 assert.equal(result.items[0].diffs.length,2);
 assert.ok(result.items[0].field_states.some(x=>x.key==="family_code"&&x.action==="update"));
});
test("G03: mapped blank means clear codes; ignored column must keep existing links",()=>{
 const clearing=plan({category_code:"",family_code:""});
 assert.deepEqual(clearing.operations[0].changes,{category_id:null,family_id:null});
 const ignored=plan({family_code:"NM-0002"},["family_code"]);
 assert.deepEqual(ignored.operations[0].changes,{family_id:D});
 assert.equal(Object.hasOwn(ignored.operations[0].changes,"category_id"),false);
 const unchanged=plan({family_code:"NM-0001"},["family_code"]);
 assert.equal(unchanged.totals.unchanged,1);
});
test("G03: non-existent category/family codes block entire plan before DB writes",()=>{
 for(const [key,code,reason] of [["category_code","DM-9999","category_code_not_found"],["family_code","NM-9999","family_code_not_found"]]){
  const result=plan({[key]:code},[key]);
  assert.equal(result.totals.conflict,1);
  assert.equal(result.operations.length,0);
  assert.equal(result.items[0].reason,reason);
 }
});
test("G03: renaming labels cannot change id/code and export round-trip reconciles",()=>{
 const match=plan({category_code:"DM-0002",category_label:"Vở học sinh / 96 trang"},
   ["category_code","category_label"]);
 assert.equal(match.totals.update,1);
 assert.deepEqual(match.operations[0].changes,{category_id:B});
 const wrong=plan({category_code:"DM-0002",category_label:"Vở học sinh"},
   ["category_code","category_label"]);
 assert.equal(wrong.totals.conflict,1);
 assert.equal(wrong.items[0].reason,"category_code_name_mismatch");
 assert.equal(wrong.operations.length,0);
 const renamed=categories.map(c=>({...c,category_label:"Đổi tên "+c.category_label}));
 const still=planSheetSync(parsed("0114",{category_code:"DM-0002"}),
   [current],renamed,{mappedFields:["category_code"],families});
 assert.equal(still.operations[0].changes.category_id,B);
});
test("G03: mapped name and code preview agree for reassignments and clearing",()=>{
 const mapped=["category_code","category_label"];
 const changed=plan({category_code:"DM-0002",category_label:"Vở học sinh / 96 trang"},mapped);
 assert.equal(changed.totals.update,1);
 const name=changed.items[0].field_states.find(x=>x.key==="category_label");
 const code=changed.items[0].field_states.find(x=>x.key==="category_code");
 assert.equal(name.action,"update");
 assert.equal(code.action,"update");
 assert.equal(name.from,"Vở học sinh");
 assert.equal(name.to,"Vở học sinh / 96 trang");
 const cleared=plan({category_code:"",category_label:""},mapped);
 assert.equal(cleared.totals.update,1);
 assert.equal(cleared.items[0].field_states.find(x=>x.key==="category_label").action,"clear");
 assert.equal(cleared.items[0].field_states.find(x=>x.key==="category_code").action,"clear");
 assert.deepEqual(cleared.operations[0].changes,{category_id:null});
 const noName=plan({category_code:"DM-0002",category_label:""},mapped);
 assert.equal(noName.totals.conflict,1);
 assert.equal(noName.operations.length,0);
});
test("G03: automatically detected code/name columns must agree, but old name-only sheets still work",()=>{
 const wrong=planSheetSync(parsed("0114",{category_label:"Vở học sinh",category_code:"DM-0002"}),
  [current],categories,{families});
 assert.equal(wrong.totals.conflict,1);
 assert.equal(wrong.items[0].reason,"category_code_name_mismatch");
 assert.equal(wrong.operations.length,0);
 const legacy=planSheetSync(parsed("0114",{category_label:"Vở học sinh / 96 trang"}),
  [current],categories,{families});
 assert.equal(legacy.totals.update,1);
 assert.equal(legacy.operations[0].changes.category_id,B);
});
test("G03: draft creation accepts resolved family and category UUID without new sample SKU",()=>{
 const result=plan({category_code:"DM-0002",family_code:"NM-0002"},
   ["category_code","family_code","ten_san_pham"],[],"0999","Sổ mẫu thử");
 assert.equal(result.totals.create,1);
 assert.equal(result.operations[0].category_id,B);
 assert.equal(result.operations[0].family_id,D);
 assert.equal(safeDraft(result.operations[0]).family_id,D);
});
test("G03: never allow ambiguous/duplicate stable code lookup",()=>{
 assert.throws(()=>planSheetSync(parsed(),[current],
  [...categories,{...categories[1],id:"00000000-0000-0000-0000-000000000999"}],
  {mappedFields:["category_code"],families}),/duplicate_category_code/);
 assert.throws(()=>planSheetSync(parsed(),[current],categories,
  {mappedFields:["family_code"],families:[...families,{...families[1],id:"00000000-0000-0000-0000-000000000999"}]}),
  /invalid_family_codes/);
});
test("G03: API & UI include immutable codes and validated code sync end to end",()=>{
 const service=read("backend/admin-api/catalogue-service.mjs");
 const xlsx=read("apps/admin/lib/sku-xlsx-adapter.mjs");
 const backendXlsx=read("backend/catalogue/xlsx-adapter.mjs");
 const exportRoute=read("apps/admin/app/api/catalogue/export/route.ts");
 const previewRoute=read("apps/admin/app/api/catalogue/preview/route.ts");
 const syncRoute=read("apps/admin/app/api/catalogue/sync/route.ts");
 const manager=read("apps/admin/app/catalogue-structure-manager.tsx");
 const mapping=read("apps/admin/app/catalogue-import-preview.tsx");
 const migration=read("backend/neon/migrations/20261102_adm05_g03_stable_codes.up.sql");
 assert.match(service,/f.family_code/);
 assert.match(service,/c.category_code/);
 assert.match(service,/family_id=CASE WHEN x.changes/);
 assert.match(service,/familyIds/);
 assert.match(xlsx,/family_code:"Mã nhóm mẫu"/);
 assert.match(backendXlsx,/family_code:"Mã nhóm mẫu"/);
 assert.match(exportRoute,/"Mã danh mục","Mã nhóm mẫu"/);
 assert.match(exportRoute,/cell\(row,"family_code"\)/);
 assert.match(previewRoute,/families_unavailable/);
 assert.match(syncRoute,/families_unavailable/);
 assert.match(mapping,/key:"category_code"/);
 assert.match(mapping,/key:"family_code"/);
 assert.match(manager,/Mã quản lý/);
 assert.match(migration,/ADD CONSTRAINT fbmn_category_code_unique UNIQUE\(category_code\)/);
 assert.match(migration,/ADD CONSTRAINT fbmn_family_code_unique UNIQUE\(family_code\)/);
 assert.match(migration,/GRANT USAGE ON SEQUENCE/);
 assert.match(migration,/next_stable_taxonomy_code/);
 assert.match(migration,/greatest\(4,length\(v::text\)\)/);
 assert.doesNotMatch(migration,/lpad\(nextval\(/);
 assert.doesNotMatch(migration,/UPDATE fbmn_catalog.skus/);
 assert.doesNotMatch(service,/pricebook|net_price/i);
});
