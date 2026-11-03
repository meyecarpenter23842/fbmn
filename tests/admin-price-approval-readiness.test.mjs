import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const ui=read("apps/admin/app/catalogue-managed-prices.tsx");
const importer=read("apps/admin/app/catalogue-managed-price-import.tsx");
const api=read("backend/admin-api/managed-price-lists-service.mjs");
const bulk=read("backend/admin-api/managed-price-import-service.mjs");
const route=read("apps/admin/app/api/pricing/managed/[[...path]]/route.ts");
test("Owner workflow is Save → Apply, not per-SKU or list double approval",()=>{
 assert.match(ui,/async function applyList\(item:List\)/);
 assert.match(ui,/await query\("\/apply","POST"/);
 assert.match(ui,/>Áp dụng<\/button>/);
 assert.match(ui,/>Lưu giá<\/button>/);
 for(const old of [/Duyệt bảng giá/,/Duyệt mức giá/,/approvePrice\(/,/async function approveList/,/query\("\/price-approve"/])
  assert.doesNotMatch(ui,old);
 assert.match(ui,/chosen\.draft_count>0/);
 assert.match(ui,/chosen\.price_count===0/);
});
test("API saves drafts then applies all prices atomically and leaves publication separate",()=>{
 assert.match(api,/mode==="apply"/);
 assert.match(api,/approval_state='approved',approved_by=\$2/);
 assert.match(api,/price\.apply/);
 assert.match(api,/price_period_overlap/);
 assert.match(api,/active_scope_locked/);
 assert.match(api,/if\(action==="apply"\)/);
 assert.doesNotMatch(api,/if\(action==="price-approve"\)/);
 assert.doesNotMatch(api,/if\(action==="approve"\)/);
 assert.match(route,/new Set\(\["create","update","apply","deactivate","price"/);
 assert.doesNotMatch(route,/"price-approve"/);
});
test("Excel saves to user-selected live or draft list and keeps preview audit protection",()=>{
 assert.match(importer,/selected\.approval_state==="inactive"/);
 assert.match(importer,/Xác nhận lưu giá/);
 assert.match(importer,/preview_fingerprint:preview\.preview_fingerprint/);
 assert.match(bulk,/preview\.target\.approval_state==="approved"/);
 assert.match(bulk,/approval_state=EXCLUDED.approval_state/);
 assert.match(bulk,/test_file_preview_only/);
});
test("channel and customer must not be changed on active list without stopping",()=>{
 assert.match(ui,/Muốn đổi kênh\/khách/);
 assert.match(ui,/disabled=\{busy\|\|Boolean\(editingId&&chosen\?\.approval_state==="approved"\)\}/);
 assert.match(api,/throw Error\("active_scope_locked"\)/);
 assert.match(ui,/Ngừng áp dụng/);
});

test("manual price editing rejects stale list revision across browser tabs",()=>{
 assert.match(ui,/setPriceListSnapshot\(\{id:chosen\.id,revision:chosen\.revision\}\)/);
 assert.match(ui,/expected_list_revision:priceListSnapshot\.revision/);
 assert.match(api,/input\.expected_list_revision/);
 assert.match(api,/list\.rows\[0\]\.revision!==input\.expected_list_revision/);
});

test("Excel confirmation uses freshly previewed list state, not cached tab data",()=>{
 assert.match(importer,/target:\{list_code:string;list_name:string;\s*approval_state:"draft"\|"approved"\|"inactive"/);
 assert.match(importer,/preview\.target\.approval_state==="approved"/);
 assert.doesNotMatch(importer,/selected\?\.approval_state==="approved"\?"Bảng đang áp dụng/);
});
