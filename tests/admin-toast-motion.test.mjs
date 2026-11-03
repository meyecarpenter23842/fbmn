import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const toast=read("apps/admin/app/admin-toast.tsx");
const css=read("apps/admin/app/admin-controls.css");
const legacy=read("apps/admin/app/admin-refinement.css");
const layout=read("apps/admin/app/layout.tsx");

test("one shared top-right stack for page and a modal-local focus-safe stack",()=>{
  assert.match(layout,/id="fb-admin-toast-root"/);
  assert.match(toast,/closest\("\.fb-product-modal"\)/);
  assert.match(toast,/querySelector<HTMLElement>\("\.fb-product-modal-toast-stack"\)/);
  assert.match(toast,/getElementById\("fb-admin-toast-root"\)/);
  assert.match(css,/\.fb-admin-toast-stack,\s*\.fb-product-modal-toast-stack\s*\{/);
  assert.match(css,/right:16px/);
  assert.doesNotMatch(legacy,/\.catalogue-toast\s*\{/);
  assert.doesNotMatch(legacy,/\.fb-product-modal-toast-stack\s*\{/);
});
test("toast matches Owner sample geometry, progress and enter/exit motion",()=>{
  for(const rule of ["min-height:66px","width:min(404px,calc(100vw - 32px))",
    "height:3px","@keyframes fb-toast-enter","@keyframes fb-toast-exit",
    "@keyframes fb-toast-progress","translate3d(22px,0,0)","translate3d(18px,0,0)",
    "animation:fb-toast-enter 220ms","animation:fb-toast-exit 190ms",
    "animation:fb-toast-progress var(--fb-toast-lifespan,4800ms)"]){
    assert.ok(css.includes(rule),rule);
  }
  assert.match(toast,/duration=4800/);
  assert.match(toast,/className="catalogue-toast-progress"/);
  assert.match(toast,/setClosing\(\{message,notificationId\}\)/);
  assert.match(toast,/aria-label="Đóng thông báo"/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});
test("error telemetry stays generic and accessibility semantics survive the reskin",()=>{
  assert.match(toast,/window\.dispatchEvent\(new Event\("fbmn-admin-operation-error"\)\)/);
  assert.match(toast,/role=\{variant==="error"\?"alert":"status"\}/);
  assert.match(toast,/aria-live=\{variant==="error"\?"assertive":"polite"\}/);
  assert.doesNotMatch(toast,/dispatchEvent\([^)]*message/);
  assert.match(toast,/onCloseRef\.current\(\)/);
});

test("identical repeated notifications reset the lifetime and interrupted exits are cancelled",()=>{
 assert.match(toast,/notificationId\?:number/);
 assert.match(toast,/\[message,notificationId,lifespan\]/);
 assert.match(toast,/setClosing\(null\)/);
 assert.match(toast,/key=\{notificationId\?\?message\}/);
 for(const p of ["apps/admin/app/catalogue-managed-prices.tsx","apps/admin/app/catalogue-managed-price-import.tsx"]){
  const source=read(p);
  assert.match(source,/id:\+\+nextToastId\.current/);
  assert.match(source,/notificationId=\{toast\?\.id\}/);
 }
});
