import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {parseCsv,previewCsvImport,previewSkuRows} from "../backend/catalogue/import-preview.mjs";

test("CSV quoted names preserve 0-prefixed company SKU", () => {
  const rows=parseCsv('\uFEFFsku_cong_ty,ten_goc_xnt,barcode\n0114,"Vở, kẻ ngang",893000\nL536,NICE TRAVEL,893000\n');
  assert.equal(rows[0].sku_cong_ty,"0114");
  assert.equal(rows[0].ten_goc_xnt,"Vở, kẻ ngang");
  assert.equal(rows[1].barcode,rows[0].barcode); // barcode is NOT a unique SKU
});
test("Preview counts create/unchanged/update/conflict/errors; never performs mutation", () => {
  const csv='sku_cong_ty,ten_goc_xnt,barcode\n0114,Giấy thật,111\nL536,Sổ mới,111\nL836,Sổ cũ,222\nC592,Mã gốc,333\nC5921,Mã khác,333\nL536,Lặp,111\n';
  const existing=[
    {sku_cong_ty:"0114",ten_goc_xnt:"Giấy thật",barcode:"111",revision:2,review_status:"draft"},
    {sku_cong_ty:"L836",ten_goc_xnt:"Sổ khác",barcode:"222",revision:4,review_status:"approved"},
    {sku_cong_ty:"C592",ten_goc_xnt:"Mã cũ",barcode:"333",revision:1,review_status:"draft"},
  ];
  const result=previewCsvImport(csv,existing);
  assert.deepEqual(result.totals,{create:2,update:1,unchanged:1,conflict:1,error:1});
  assert.equal(result.applied,false);
  assert.equal(result.items[0].sku_cong_ty,"0114");
  assert.ok(result.items.every(x=>x.media_missing));
});
test("Never unify similar SKU or modify reviewer-approved record",()=> {
  const result=previewSkuRows([{sku_cong_ty:"C592",ten_goc_xnt:"X"},{sku_cong_ty:"C5921",ten_goc_xnt:"Y"}],[]);
  assert.equal(result.totals.create,2);
});
test("Malformed CSV rejected, duplicate SKU flagged, prices not present in preview",()=> {
  assert.throws(()=>parseCsv('sku_cong_ty,ten_goc_xnt\nA,"oops'),/unclosed_csv_quote/);
  const x=previewCsvImport('sku_cong_ty,ten_goc_xnt\n0114,one\n0114,two\n');
  assert.equal(x.totals.error,1);
  assert.equal(JSON.stringify(x).includes('net_price'),false);
});
test("SQL private schema + nullable media + price isolation, rollback gate",()=> {
  const up=readFileSync(new URL('../backend/neon/migrations/20261029_adm02_catalogue_master.up.sql',import.meta.url),'utf8');
  const down=readFileSync(new URL('../backend/neon/migrations/20261029_adm02_catalogue_master.down.sql',import.meta.url),'utf8');
  assert.match(up,/sku_cong_ty text PRIMARY KEY/);
  assert.match(up,/CREATE UNIQUE INDEX skus_casefold_unique/);
  assert.match(up,/r2_key text UNIQUE/);
  assert.match(up,/CREATE SCHEMA fbmn_catalog_private/);
  // Ignore comments: they legitimately mention GRANT as a security requirement.
  const executable=up.replace(/^\s*--.*$/gm,"");
  assert.doesNotMatch(executable,/\bGRANT\s+[^;]*\bfbmn_public_reader\b/i);
  assert.match(down,/fbmn\.rollback_confirmed/);
});

test("Create requires an original or reviewed name; barcode-only SKU is rejected", () => {
  const x=previewCsvImport("sku_cong_ty,barcode\n0114,893000\n");
  assert.equal(x.totals.create,0);
  assert.equal(x.totals.error,1);
  assert.equal(x.items[0].reason,"missing_product_name");
});
test("Partial barcode update keeps existing name, but cannot erase final name", () => {
  const existing=[{sku_cong_ty:"0114",ten_goc_xnt:"Tên thật",barcode:"001",revision:1,review_status:"draft"}];
  const barcode=previewCsvImport("sku_cong_ty,barcode\n0114,002\n",existing);
  assert.equal(barcode.totals.update,1);
  const erased=previewCsvImport("sku_cong_ty,ten_goc_xnt\n0114,\n",existing);
  assert.equal(erased.totals.error,1);
  assert.equal(erased.items[0].reason,"missing_product_name");
});
