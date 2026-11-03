import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const page=readFileSync(new URL("../apps/admin/app/page.tsx",import.meta.url),"utf8");
const styles=readFileSync(new URL("../apps/admin/app/admin.css",import.meta.url),"utf8");
const authStyles=readFileSync(new URL("../apps/admin/app/activation.css",import.meta.url),"utf8");
const route=readFileSync(new URL("../apps/admin/app/api/admin/[route]/route.ts",import.meta.url),"utf8");

test("Admin popup blocks the workspace until both Neon session and DB principal are approved",()=>{
  assert.match(page,/authState!=="authorised" && <div className="auth-overlay"/);
  assert.match(page,/if\(response.status===403\)\{setAuthState\("forbidden"\)/);
  assert.match(page,/if\(response.status===401\)/);
  assert.match(page,/if\(result\.data\.user\.emailVerified===false\)/);
  assert.match(page,/setAuthState\("anonymous"\);return;/);
  assert.match(page,/className="first-login-hint" role="note"/);
  assert.doesNotMatch(page,/Lần đầu dùng Owner\? Tài khoản chưa có mật khẩu\. Hãy chọn/);
  assert.match(page,/fetch\("\/api\/auth\/token"/);
  assert.doesNotMatch(page,/JWT_ENDPOINT_HTTP_|JWT_RESPONSE_MISSING/);
  assert.match(page,/headers:\{Authorization:"Bearer "\+jwt,Accept:"application\/json"\}/);
  assert.doesNotMatch(page,/authClient\.token\(\)/);
  assert.doesNotMatch(page,/try\{await authClient\.signOut\(\);\}/);
  assert.match(page,/Phiên đăng nhập chưa được chấp nhận/);
  assert.match(route,/invalid_bearer/);
  assert.match(route,/upstream_jwt_rejected/);
  assert.match(route,/server_token_missing/);
  assert.match(page,/minLength=\{loginMode==="reset"\?8:1\}/);
  assert.match(page,/if\(adminPassword\.length<8\|\|adminPassword!==repeatPassword\)/);
  assert.doesNotMatch(page,/Ít nhất 12 ký tự/);
  assert.match(page,/className="auth-logo"/);
  assert.doesNotMatch(page,/<Brand subtitle="Miền Nam · Quản trị"\/>/);
  assert.match(page,/authState==="authorised" && <>/);
  assert.match(page,/authClient\.signIn\.email\(/);
  assert.match(page,/Lần đầu dùng Owner/);
  assert.match(page,/if\(status===403\)\{/);
    assert.doesNotMatch(page,/domain Admin trong Neon Auth/);
    assert.match(page,/else if\(status===401 \|\| status===422\)/);
    assert.match(page,/<span className="staging-pill">ADMIN<\/span>/);
    assert.doesNotMatch(page,/>STAGING<\/span>/);
  assert.match(page,/Kích hoạt \/ Xác minh Owner/);
  assert.doesNotMatch(page,/Không kết nối được dịch vụ đăng nhập Neon Auth/);
  assert.match(page,/authClient\.emailOtp\.resetPassword\(/);
  assert.match(page,/authClient\.emailOtp\.verifyEmail\(/);
  assert.match(page,/authClient\.signOut\(\)/);
  assert.match(page,/role="dialog" aria-modal="true"/);
});

test("Admin does not invent catalogue, prices, customer counts or persist uploaded files locally",()=>{
  assert.doesNotMatch(page,/1\.248|2\.458|FB-VHS-200|18\.000/);
  assert.match(page,/<CatalogueManager\s+onImport=/);
  assert.match(page,/section==="pricing"&&<CatalogueSideWorkspace mode="pricing" onBusyChange=\{setWorkspaceOperationBusy\}\/>/);
  assert.match(page,/section==="media"&&<CatalogueSideWorkspace mode="media" onBusyChange=\{setWorkspaceOperationBusy\}\/>/);
  assert.doesNotMatch(page,/localStorage|sessionStorage/);
  assert.match(page,/URL\.revokeObjectURL/);
  assert.match(route,/const ALLOWED = new Set\(\["session", "channels", "publish-capability", "pricing-capability"\]\)/);
});

test("Admin reference UI retains purple side navigation, responsive panels and mandatory login overlay",()=>{
  for(const item of ["Danh sách sản phẩm","Danh mục & nhóm mẫu","Thư viện hình ảnh","Nhập / cập nhật Excel","Giá & bảng giá","Thêm sản phẩm mới","Thêm biến thể"])assert.ok(page.includes(item),item);
  for(const rule of [".sidebar",".auth-overlay",".gallery-grid",".editor-grid",".metric-grid","@media(max-width:780px)"])assert.ok(styles.includes(rule),rule);
  for(const rule of [".auth-modal",".auth-logo img",".first-login-hint span","background:#fff","@media(max-width:480px)"])assert.ok(authStyles.includes(rule),rule);
});

test("Polished Admin shell separates sidebar/main scroll and avoids dead navigation",()=>{
  const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
  const refined=read("apps/admin/app/admin-refinement.css");
  const layout=read("apps/admin/app/layout.tsx");
  const manager=read("apps/admin/app/catalogue-manager.tsx");
  const toast=read("apps/admin/app/admin-toast.tsx");
  assert.match(layout,/import "\.\/admin-refinement\.css"/);
  assert.match(refined,/\.sidebar \{ height:100dvh; min-height:0; overflow-y:auto/);
  assert.match(refined,/\.workspace-main \{ flex:1; min-height:0; overflow-y:auto/);
  assert.match(refined,/prefers-reduced-motion:reduce/);
  assert.match(refined,/@media \(min-width: 781px\)/);
  assert.match(refined,/@media \(max-width:780px\)/);
  assert.match(refined,/catalogue-channel-pending/);
  assert.match(page,/function Brand\(\)/);
  assert.doesNotMatch(page,/<span className="brand-copy">/);
  assert.match(page,/\{ key:"products",label:"Sản phẩm"/);
  assert.doesNotMatch(page,/\{ key:"banners",label:"Banner & Popup"/);
  // The toast portal stays *inside* the modal focus trap, never on document.body.
  assert.match(toast,/createPortal\(content,target\.host\)/);
  assert.match(toast,/closest\("\.fb-product-modal"\)/);
  assert.doesNotMatch(toast,/createPortal\([^,]+,\s*document\.body\)/);
  assert.match(read("apps/admin/app/product-modal.tsx"),/fb-product-modal-toast-stack/);
  assert.match(toast,/setTimeout\(onClose,duration\)/);
  assert.match(toast,/aria-label="Đóng thông báo"/);
  assert.match(manager,/pendingVisibility\.current\.has\(key\)/);
  assert.match(manager,/epochAtStart===visibilityEpoch\.current&&pendingVisibility\.current\.size===0/);
  assert.match(manager,/visibilityEpoch\.current\+\+/);
  assert.match(manager,/setVisibility\(previous=>\{const next=/);
  assert.match(manager,/pendingKeys\.includes/);
});
