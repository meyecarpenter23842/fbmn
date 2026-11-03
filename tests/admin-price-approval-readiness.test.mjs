import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const src=read("apps/admin/app/catalogue-managed-prices.tsx");
const css=read("apps/admin/app/managed-price-lists.css");

test("draft price list shows actual approved SKU count and actionable next step",()=>{
 assert.match(src,/visiblePrices\.filter\(item=>item\.approval_state==="approved"\)\.length/);
 assert.match(src,/chosen\.price_count===0\|\|\(approvedSkuCount===0&&!priceListIsPartial\)/);
 assert.match(src,/visiblePrices\.length<chosen\.price_count/);
 assert.match(src,/fb-managed-approved-count/);
 assert.match(src,/fb-managed-approval-guide/);
 assert.match(src,/Chưa đủ điều kiện duyệt bảng giá/);
 for(const label of ["Xem giá","Thêm giá","Nhập từ Excel","duyệt từng mức giá SKU"])assert.ok(src.includes(label),label);
});
test("prevent futile approval while remaining fail-closed on the backend",()=>{
 assert.match(src,/disabled=\{busy\|\|approvalBlocked\} onClick=\{\(\)=>void approveList\(chosen\)\}/);
 assert.match(src,/if\(item\.price_count===0\|\|\(item\.id===chosenId&&approvedSkuCount===0&&!priceListIsPartial\)\)/);
 assert.match(src,/await query\("\/approve","POST",\{id:item\.id,expected_revision:item\.revision\}\)/);
 assert.match(src,/approved_price_required:"Bảng giá chưa có mức giá SKU được duyệt/);
 assert.doesNotMatch(src,/autoApprove|auto_approve/);
});
test("precondition status stays separate from operation toast and uses legible text",()=>{
 assert.match(css,/\.fb-managed-approved-count/);
 assert.match(css,/\.fb-managed-approval-guide/);
 assert.match(css,/font-size:13px/);
 assert.match(src,/role="note"/);
 assert.match(src,/<AdminToast message=\{toast\?\.message\|\|""\}/);
});

test("truncated price lists never falsely lock approval (server remains authoritative)",()=>{
 assert.match(src,/const priceListIsPartial=/);
 assert.match(src,/visiblePrices\.length<chosen\.price_count/);
 assert.match(src,/approvedSkuCount===0&&!priceListIsPartial/);
 assert.match(src,/Đã tải /);
});

test("eligibility colors reuse the central Admin tokens without screen-level overrides",()=>{
 const globalCss=read("apps/admin/app/admin-controls.css");
 for(const token of ["--fb-ui-success-ink","--fb-ui-warning-ink","--fb-ui-warning-bg","--fb-ui-warning-border"]){
  assert.ok(globalCss.includes(token+":"),token);
  assert.ok(css.includes("var("+token+")"),token);
 }
 assert.doesNotMatch(css,/\.fb-managed-approved-count[^\n]*!important/);
});
