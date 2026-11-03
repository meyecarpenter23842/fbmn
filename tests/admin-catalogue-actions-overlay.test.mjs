import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {positionCatalogueActions} from "../apps/admin/lib/catalogue-action-position.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("floating action menu opens below the row, aligned right without shifting table",()=>{
  assert.deepEqual(positionCatalogueActions({top:150,bottom:180,right:900},1280,720),
    {top:186,left:712});
});
test("floating action menu flips upward near the bottom of the viewport",()=>{
  assert.deepEqual(positionCatalogueActions({top:650,bottom:680,right:1180},1280,720),
    {top:538,left:992});
});
test("floating action menu remains in viewport at right edge and on cramped heights",()=>{
  assert.deepEqual(positionCatalogueActions({top:20,bottom:50,right:1275},1280,720),
    {top:56,left:1084});
  const pos=positionCatalogueActions({top:70,bottom:100,right:40},320,160);
  assert.ok(pos.top>=8 && pos.top<=160-106-8);
  assert.equal(pos.left,8);
});
test("catalogue action trigger controls exactly one portal rather than unbounded details",()=>{
  const tsx=read("apps/admin/app/catalogue-manager.tsx");
  const css=read("apps/admin/app/import-preview.css");
  assert.match(tsx,/useState<\{sku:string;top:number;left:number\}\|null>\(null\)/);
  assert.match(tsx,/actionMenu\?\.sku===row\.sku_cong_ty/);
  assert.match(tsx,/setActionMenu\(\{sku:row.sku_cong_ty,\.\.\.position\}\)/);
  assert.match(tsx,/createPortal\(/);
  assert.match(tsx,/,document\.body/);
  assert.match(tsx,/role="menu"/);
  assert.match(tsx,/aria-expanded=\{actionMenu\?\.sku===row.sku_cong_ty\}/);
  assert.match(tsx,/document\.addEventListener\("pointerdown",closeOutside\)/);
  assert.match(tsx,/document\.addEventListener\("keydown",keydown\)/);
  assert.match(tsx,/event\.key==="Escape"/);
  assert.match(tsx,/window\.addEventListener\("scroll",closeOnMove,true\)/);
  assert.match(tsx,/window\.addEventListener\("resize",closeOnMove\)/);
  assert.doesNotMatch(tsx,/<details className="catalogue-actions-menu">/);
  assert.doesNotMatch(tsx,/closest\("details"\)/);
  assert.match(css,/\.catalogue-actions-popover\{position:fixed;z-index:11000/);
  assert.doesNotMatch(css,/\.catalogue-actions-list\{display:grid/);
});
test("action menu preserves edit and grouping actions, and cleans up listeners",()=>{
  const tsx=read("apps/admin/app/catalogue-manager.tsx");
  assert.match(tsx,/setActionMenu\(null\)/);
  assert.match(tsx,/startEditor\(selectedActionRow\)/);
  assert.doesNotMatch(tsx,/>Quản lý hình ảnh<\/button>/);
  assert.match(tsx,/setStructurePane\("families"\)/);
  assert.match(tsx,/removeEventListener\("pointerdown",closeOutside\)/);
  assert.match(tsx,/removeEventListener\("keydown",keydown\)/);
});
