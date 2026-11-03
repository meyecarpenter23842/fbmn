import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleCatalogue} from "../backend/admin-api/catalogue-service.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const actor={role:"owner",subject:"futurebook-owner"};
const sample=[
 {sku_cong_ty:"0110",channel_code:"public_web",expected_revision:0},
 {sku_cong_ty:"0110",channel_code:"dealer_app",expected_revision:2},
 {sku_cong_ty:"0114",channel_code:"public_web",expected_revision:0}
];
const request=(entries=sample,extras={})=>new Request(
 "https://admin.example.test/v1/admin/catalogue/visibility-bulk",{
  method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({entries,visible:true,confirm:"CAP_NHAT_HIEN_THI_HANG_LOAT",...extras})
 });
function fakeDb({current=[{sku_cong_ty:"0110",channel_code:"dealer_app",revision:2}],
 missing=false}={}){
 const calls=[];
 const db=async fn=>fn({query:async(sql,args=[])=>{
  calls.push({sql,args});
  if(sql.startsWith("SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE"))
   return {rowCount:missing?1:2,rows:(missing?[{sku_cong_ty:"0110"}]:
    [{sku_cong_ty:"0110"},{sku_cong_ty:"0114"}])};
  if(sql.startsWith("SELECT sku_cong_ty,channel_code,revision FROM fbmn_catalog.publications"))
   return {rowCount:current.length,rows:current};
  if(sql.startsWith("INSERT INTO fbmn_catalog.publications"))
   return {rowCount:JSON.parse(args[0]).length,rows:JSON.parse(args[0]).map((entry,i)=>({
     sku_cong_ty:entry.sku_cong_ty,channel_code:entry.channel_code,
     state:"published",revision:entry.expected_revision+1,id:i
   }))};
  return {rowCount:0,rows:[]};
 }});
 return {db,calls};
}
test("Owner saves 3 SKU-channel pairs in one revision-checked audited transaction",async()=>{
 const {db,calls}=fakeDb();
 const response=await handleCatalogue({request:request(),actor,db});
 assert.equal(response.status,200);
 const payload=await response.json();
 assert.equal(payload.data.updated,3);
 assert.equal(payload.data.sku_count,2);
 assert.deepEqual(payload.data.items.map(x=>x.revision),[1,3,1]);
 assert.ok(calls.some(x=>x.sql==="BEGIN"));
 assert.ok(calls.some(x=>x.sql==="COMMIT"));
 const writes=calls.filter(x=>x.sql.startsWith("INSERT INTO fbmn_catalog.publications"));
 assert.equal(writes.length,1);
 assert.match(writes[0].sql,/ON CONFLICT\(sku_cong_ty,channel_code\) DO UPDATE/);
 assert.match(writes[0].sql,/revision=EXCLUDED\.revision-1/);
 const audit=calls.find(x=>x.sql.includes("fbmn_catalog.audit_events"));
 assert.ok(audit);
 assert.equal(audit.args[1],"channel_visibility_bulk");
 assert.equal(JSON.parse(audit.args[2]).pairs,3);
 assert.ok(calls.every(x=>!/net_price|price_evidence|source_price_vnd|fbmn_catalog_private/i.test(x.sql)));
});
test("batch publication rejects non-Owner and invalid or oversized entries before DB",async()=>{
 const {db,calls}=fakeDb();
 const denied=await handleCatalogue({request:request(),actor:{role:"editor",subject:"e"},db});
 assert.equal(denied.status,403);
 assert.equal(calls.length,0);
 for(const entries of [
  [sample[0],sample[0]],
  [{...sample[0],channel_code:"unknown"}],
  [{...sample[0],expected_revision:-1}],
  Array.from({length:201},(_,i)=>({sku_cong_ty:"SKU"+i,channel_code:"public_web",expected_revision:0}))
 ]){
  const res=await handleCatalogue({request:request(entries),actor,db});
  assert.equal(res.status,400);
 }
 assert.equal(calls.length,0);
});
test("stale revisions and unknown SKUs roll back the complete batch",async()=>{
 for(const data of [{current:[{sku_cong_ty:"0110",channel_code:"dealer_app",revision:5}]},{missing:true}]){
  const {db,calls}=fakeDb(data);
  const response=await handleCatalogue({request:request(),actor,db});
  assert.equal(response.status,data.missing?404:409);
  assert.ok(calls.some(x=>x.sql==="ROLLBACK"));
  assert.ok(!calls.some(x=>x.sql.startsWith("INSERT INTO fbmn_catalog.publications")));
  assert.ok(!calls.some(x=>x.sql==="COMMIT"));
 }
});
test("Admin always exposes page-selection and a two-step three-channel preview",()=>{
 const ui=read("apps/admin/app/catalogue-manager.tsx");
 const proxy=read("apps/admin/app/api/catalogue/[action]/route.ts");
 assert.match(ui,/Chọn tất cả sản phẩm trong trang hiện tại/);
 assert.match(ui,/onChange=\{event=>togglePageSelection\(event.target.checked\)\}/);
 assert.match(ui,/Bật \/ ẩn hàng loạt/);
 assert.match(ui,/setBulkStep\("preview"\)/);
 assert.match(ui,/Xem trước · \{bulkEntries\.length\} lượt thay đổi/);
 assert.match(ui,/CAP_NHAT_HIEN_THI_HANG_LOAT/);
 assert.match(ui,/channel_code:channel/);
 for(const channel of ["public_web","dealer_app","consumer_app"])assert.ok(ui.includes(channel));
 assert.match(ui,/Xác nhận /);
 assert.match(proxy,/"visibility-bulk"/);
 assert.match(ui,/Giá NET không được công khai/);
});
