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
  assert.match(page,/JWT_ENDPOINT_HTTP_/);
  assert.match(page,/JWT_RESPONSE_MISSING/);
  assert.match(page,/headers:\{Authorization:"Bearer "\+jwt,Accept:"application\/json"\}/);
  assert.doesNotMatch(page,/authClient\.token\(\)/);
  assert.doesNotMatch(page,/try\{await authClient\.signOut\(\);\}/);
  assert.match(page,/Phiên đăng nhập được giữ nguyên/);
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
    assert.match(page,/domain Admin trong Neon Auth/);
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
  assert.match(page,/Chưa có danh sách sản phẩm thực tế/);
  assert.match(page,/Chưa có API công bố/);
  assert.match(page,/chưa tải lên Cloudflare R2/);
  assert.doesNotMatch(page,/localStorage|sessionStorage/);
  assert.match(page,/URL\.revokeObjectURL/);
  assert.match(route,/const ALLOWED = new Set\(\["session", "channels", "publish-capability", "pricing-capability"\]\)/);
});

test("Admin reference UI retains purple side navigation, responsive panels and mandatory login overlay",()=>{
  for(const item of ["Quản lý sản phẩm","Thêm sản phẩm mới","Upload & quản lý ảnh","Banner & Popup","Media","Thêm biến thể"])assert.ok(page.includes(item),item);
  for(const rule of [".sidebar",".auth-overlay",".gallery-grid",".editor-grid",".metric-grid","@media(max-width:780px)"])assert.ok(styles.includes(rule),rule);
  for(const rule of [".auth-modal",".auth-logo img",".first-login-hint span","background:#fff","@media(max-width:480px)"])assert.ok(authStyles.includes(rule),rule);
});
