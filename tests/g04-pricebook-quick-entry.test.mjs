import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const panel=readFileSync("apps/admin/app/catalogue-pricebook-panel.tsx","utf8");

test("G04 quick entry defaults new effective date to Viet Nam day at save and keeps audit provenance",()=>{
 assert.match(panel,/const effectiveFrom=editing\?\.effective_from\|\|form\.date\|\|/);
 assert.match(panel,/Date\.now\(\)\+7\*60\*60\*1000/);
 assert.match(panel,/effective_from:effectiveFrom/);
 assert.doesNotMatch(panel,/!form\.date\|\|/);
 assert.match(panel,/source_document:form\.source\.trim\(\)/);
 assert.match(panel,/confirm:"LUU_GIA_NHAP"/);
});

test("G04 preserves separate pricing scopes, Owner write and existing revision guard",()=>{
 for(const kind of ["source","net_internal","retail_public","dealer_contract"])
   assert.match(panel,new RegExp('\\["'+kind+'",'));
 assert.match(panel,/if\(!owner\|\|saving\|\|loading\)return/);
 assert.match(panel,/expected_revision:editing\.revision/);
 assert.match(panel,/validUuid\(form\.customerId\)/);
});

test("G04 keeps mandatory amount, VAT inclusion and evidence visible with actionable messages",()=>{
 assert.match(panel,/Nhập giá nhanh/);
 assert.match(panel,/Giá này đã gồm VAT chưa/);
 assert.match(panel,/Nguồn giá/);
 assert.match(panel,/Vui lòng chọn giá đã gồm VAT hay chưa gồm VAT/);
 assert.match(panel,/Vui lòng ghi nguồn giá/);
 assert.match(panel,/Tùy chọn nâng cao: ngày áp dụng, thuế suất VAT/);
 assert.match(panel,/type="date" value=\{form\.date\}/);
});
