import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const css=source("apps/admin/app/admin-controls.css");
const root=source("AGENTS.md");
const policy=source("docs/futurebook-ui-contract.md");

test("every repo, Admin and Website AI entrypoint points to the canonical UI contract",()=>{
 for(const path of ["AGENTS.md","apps/admin/AGENTS.md","app/AGENTS.md","README.md",
  "docs/admin-ui-design-system.md","docs/web-component-design-system.md"]){
  const text=source(path);
  assert.match(text,/futurebook-ui-contract\.md/,path);
 }
 assert.match(root,/bắt buộc đọc/i);
 assert.match(policy,/bắt buộc/i);
 assert.match(policy,/tím nhạt/);
 assert.match(policy,/Drawer hoặc popup\/modal|drawer hoặc popup/i);
 assert.match(policy,/góc (trên bên phải|trên phải)/);
 assert.match(policy,/Website và App người tiêu dùng/);
});

test("one shared CSS defines the exact Futurebook control tokens",()=>{
 for(const token of [
  "--fb-control-height-compact: 36px",
  "--fb-control-height-default: 40px",
  "--fb-field-height: 40px",
  "--fb-control-height-touch: 44px",
  "--fb-control-font-size: 13px",
  "--fb-control-radius: 9px",
  "--fb-ui-primary: #6d249e",
  "--fb-ui-table-header-bg: #f4edfa",
  "--fb-ui-table-header-ink: #43215f",
  "--fb-ui-table-header-border: #e5d7f1"
 ])assert.ok(css.includes(token),token);
 const layout=source("apps/admin/app/layout.tsx");
 assert.match(layout,/import "\.\/admin-controls\.css"/);
 assert.ok(layout.lastIndexOf('import "./admin-controls.css"')>
  layout.lastIndexOf('import "./admin-l01-navigation.css"'),
  "shared Admin CSS must load after older screen-specific styles");
});

test("pricing tabs are styled by global Admin CSS and never rely on legacy Excel CSS",()=>{
 for(const selector of [
  ".fb-admin .fb-pricing-tabs {",
  ".fb-admin .fb-pricing-tabs > button {",
  ".fb-admin .fb-pricing-tabs > button.active,",
  '.fb-admin .fb-pricing-tabs > button[aria-current="page"]',
  ".fb-admin .fb-pricing-tab-content"
 ])assert.ok(css.includes(selector),selector);
 assert.match(css,/\.fb-admin \.fb-pricing-tabs > button\s*\{[^}]*height: var\(--fb-control-height-compact\)/s);
 assert.match(css,/@media \(max-width: 780px\)[\s\S]*\.fb-admin \.fb-pricing-tabs > button\s*\{[^}]*height: var\(--fb-control-height-touch\)/s);
 const legacy=source("apps/admin/app/pricebook-bulk.css");
 assert.doesNotMatch(legacy,/\.fb-pricing-tabs\s*(?:\{|button)/);
});

test("Admin data headers have a lavender tone from the central stylesheet",()=>{
 assert.ok(css.includes(':is(.fb-admin,.fb-product-modal) :is(table thead th, [role="columnheader"], .fb-ui-data-header)'));
 assert.match(css,/background-color: var\(--fb-ui-table-header-bg\)/);
 assert.match(css,/color: var\(--fb-ui-table-header-ink\)/);
 assert.match(css,/border-bottom-color: var\(--fb-ui-table-header-border\)/);
 for(const path of ["apps/admin/app/managed-price-import.css",
  "apps/admin/app/managed-price-lists.css"]){
  const own=source(path);
  assert.doesNotMatch(own,/(\.fb-managed-import-scroll th|\.fb-managed-table-wrap th)\s*\{[^}]*background(?:-color)?\s*:/s,
   "page-specific table header background must use the shared token");
 }
});

test("buttons and fields keep shared geometry without screen-level sizing copies",()=>{
 assert.ok(css.includes(':is(.fb-admin,.fb-product-modal) :is(.btn, .import-btn, .catalogue-actions-trigger, .fb-ui-button)'));
 assert.match(css,/height: var\(--fb-control-height-compact\)/);
 assert.match(css,/height: var\(--fb-field-height\)/);
 const isolated=source("apps/admin/app/managed-price-import.css");
 assert.doesNotMatch(isolated,/\.fb-managed-import \.import-btn\s*\{/);
 const prices=source("apps/admin/app/managed-price-lists.css");
 assert.doesNotMatch(prices,/\.fb-managed-prices \.import-btn\s*\{/);
 assert.match(css,/input\[type="date"\]/);
 assert.match(css,/input\[type="search"\]/);
 const fieldGeometry=css.slice(css.indexOf("/* Native file inputs"),css.indexOf("/* The tab content boundary"));
 assert.doesNotMatch(fieldGeometry,/input\[type="checkbox"\]/,
  "checkboxes remain excluded from shared text-field height rule but may have dedicated styles");
});

test("mandatory smooth motion and compact purple popup header rules persist across AI sessions",()=>{
 const admin=source("apps/admin/AGENTS.md");
 const design=source("docs/admin-ui-design-system.md");
 for(const s of [root,admin,policy,design]){
  for(const ms of ["180–200ms","180–220ms","280ms","220ms","300ms"])assert.ok(s.includes(ms),ms);
  for(const px of ["52px","56px","16px"])assert.ok(s.includes(px),px);
  assert.match(s,/lavender/i);
  assert.match(s,/tím|purple/i);
 }
 assert.match(policy,/prefers-reduced-motion/);
 assert.match(policy,/exit animation/);
 assert.match(policy,/chưa được sửa trong PR tài liệu này/);
 assert.doesNotMatch(design,/Motion 120–180ms cho hover\/focus/);
});

test("runtime shared modal and categories meet the mandatory UI contract",()=>{
 const modal=source("apps/admin/app/product-modal.tsx");
 const taxonomy=source("apps/admin/app/catalogue-structure-manager.tsx");
 const style=source("apps/admin/app/admin-controls.css");
 assert.match(modal,/fb-modal-exiting/);
 assert.match(modal,/window\.setTimeout\(\(\)=>onCloseRef\.current\(\),220\)/);
 assert.match(modal,/requestCloseRef\.current\(\)/);
 assert.match(modal,/beforeCloseRef\.current\?\.\(\)===false/);
 assert.match(modal,/ModalCloseContext\.Provider value=\{requestClose\}/);
 const workspace=source("apps/admin/app/catalogue-product-workspace.tsx");
 assert.match(workspace,/useProductModalClose\(\)/);
 assert.match(workspace,/onClick=\{requestClose\}>Đóng/);
 for(const token of ["--fb-motion-button: 190ms","--fb-motion-menu: 200ms",
  "--fb-motion-modal-enter: 280ms","--fb-motion-modal-exit: 220ms",
  "--fb-motion-drawer: 300ms","--fb-modal-header-height: 52px",
  "--fb-modal-header-mobile-height: 56px"]){
  assert.ok(style.includes(token),token);
 }
 assert.match(style,/@keyframes fb-modal-enter/);
 assert.match(style,/@keyframes fb-modal-exit/);
 assert.match(style,/@media \(prefers-reduced-motion: reduce\)/);
 assert.match(taxonomy,/createChild\(selectedCategory\.id\)/);
 assert.match(taxonomy,/createNameInput\.current\?\.focus\(\)/);
 assert.match(taxonomy,/Thuộc ngành hàng/);
 assert.doesNotMatch(taxonomy,/Danh mục cha|Tạo danh mục con bên dưới/);
});
