import test from "node:test";
import assert from "node:assert/strict";
import { exactCompanySku,previewAgainstCatalogue,selectManualFamily } from "../backend/catalogue/owner-draft-planning.mjs";

test("Exact text business SKU never strips leading zeros or merges near-codes",()=>{
  assert.equal(exactCompanySku("0114"),"0114");
  assert.equal(exactCompanySku("114"),"114");
  assert.equal(exactCompanySku("C5921"),"C5921");
  assert.throws(()=>exactCompanySku(114),/invalid_original_company_sku/);
  assert.throws(()=>exactCompanySku(" 0114"),/invalid_original_company_sku/);
  const x=previewAgainstCatalogue([
    {sku_cong_ty:"0114"}, {sku_cong_ty:"114"}, {sku_cong_ty:"C592"}, {sku_cong_ty:"C5921"}
  ],[]);
  assert.equal(x.totals.create,4);
  assert.deepEqual(x.items.map(row=>row.sku_cong_ty),["0114","114","C592","C5921"]);
  assert.equal(x.applied,false);
});

test("Read-only snapshot comparison rejects duplicate SKU and protects approved records",()=>{
  const x=previewAgainstCatalogue([
    {sku_cong_ty:"0114"},{sku_cong_ty:"0114"},{sku_cong_ty:"A1"},{sku_cong_ty:"B1"}
  ],[{sku_cong_ty:"0114",review_status:"draft"},{sku_cong_ty:"B1",review_status:"approved"}]);
  assert.deepEqual(x.totals,{create:1,unchanged:1,conflict:1,error:1});
  assert.equal(x.applied,false);
});

test("Manual grouping never rewrites codes or infers groups from shared barcode",()=>{
  assert.deepEqual(selectManualFamily(["0114","0714"],"family-id"),
    {familyId:"family-id",codes:["0114","0714"]});
  assert.throws(()=>selectManualFamily(["0114","0114"],"family-id"));
  assert.throws(()=>selectManualFamily(["0114"],"family-id"));
});
