import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const page=readFileSync("apps/admin/app/page.tsx","utf8");
const manager=readFileSync("apps/admin/app/catalogue-manager.tsx","utf8");
const side=readFileSync("apps/admin/app/catalogue-side-workspace.tsx","utf8");
const price=readFileSync("apps/admin/app/catalogue-pricebook-panel.tsx","utf8");
const layout=readFileSync("apps/admin/app/layout.tsx","utf8");

test("L01 product group exposes four working submenu screens",()=>{
  for(const section of ["products","structure","media","import-products"])
    assert.match(page,new RegExp('key:"'+section+'"'));
  assert.match(page,/aria-expanded=\{productMenuExpanded\}/);
  assert.match(page,/aria-current=\{section===item.key\?"page":undefined\}/);
  assert.match(page,/view="structure" initialPane=\{structureTab\}/);
  assert.match(page,/section==="media"&&<CatalogueSideWorkspace mode="media" onBusyChange=\{setWorkspaceOperationBusy\}\/>/);
  assert.match(page,/section==="pricing"&&<CatalogueSideWorkspace mode="pricing" onBusyChange=\{setWorkspaceOperationBusy\}\/>/);
  assert.match(layout,/admin-l01-navigation\.css/);
});

test("L01 structure page calls existing category and family write handlers",()=>{
  assert.match(manager,/if\(view==="structure"\)return/);
  for(const callback of ["onCreateCategory={createCategory}","onRenameCategory={renameCategory}",
    "onCreateFamily={createFamily}","onRenameFamily={renameFamily}",
    "onChangeMember=","onBulkAssign={bulkAssign}"])
    assert.ok(manager.includes(callback),callback);
  assert.match(manager,/const editorDialog=/);
  assert.match(manager,/currentStructurePane=view==="structure"\?initialPane:structurePane\|\|initialPane/);
  assert.match(manager,/{structureContent}/);
  assert.match(manager,/if\(groupMode&&selected\.length>0\)setStructurePane\("families"\)/);
  assert.doesNotMatch(manager,/{loading\?<p className="catalogue-workspace-empty"/);
});

test("L01 price list uses selected SKU only and does not expose a bulk price endpoint",()=>{
  assert.match(side,/fetch\("\/api\/catalogue\/skus"/);
  assert.match(side,/headers:\{Authorization:"Bearer "\+credentials.token/);
  assert.match(side,/<CataloguePricebookPanel key=\{selectedSku\} sku=\{selectedSku\} onBusyChange=\{handlePriceBusy\}\/>/);
  assert.doesNotMatch(side,/Promise\.all\(skus\.map/);
  assert.match(side,/CatalogueMediaManager key=\{selectedSku\}/);
  assert.match(side,/disabled=\{mediaBusy\|\|priceBusy\}/);
  assert.match(page,/if\(workspaceOperationBusy&&\["media","pricing"\]\.includes\(section\)&&to!==section\)return/);
  assert.ok(price.includes('fetch("/api/pricing/entries?sku="+encodeURIComponent(sku)'));
  assert.match(price,/setOwner\(identity.data\?\.role==="owner"\)/);
  assert.match(price,/confirm:"LUU_GIA_NHAP"/);
});
