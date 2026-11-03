import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("user-defined list code and name replace fixed prices as default Admin workflow",()=>{
 const ui=read("apps/admin/app/catalogue-side-workspace.tsx");
 const list=read("apps/admin/app/catalogue-managed-prices.tsx");
 assert.match(ui,/useState<"lists"\|"products"\|"excel">\("lists"\)/);
 assert.match(ui,/>Bảng giá<\/button>/);
 assert.match(ui,/<CatalogueManagedPriceLists/);
 assert.match(list,/Mã bảng giá/);
 assert.match(list,/Tên bảng giá/);
 assert.match(list,/list_code/);
 assert.match(list,/channel_codes/);
 assert.match(list,/scope_customer_id/);
 assert.match(list,/Áp dụng cho một khách hàng/);
 assert.match(list,/approval_state==="approved"/);
 assert.match(list,/Áp dụng/);
 assert.match(list,/>Áp dụng<\/button>/);
 assert.doesNotMatch(list,/Duyệt bảng giá|Duyệt mức giá/);
 assert.match(list,/Kênh sử dụng bảng giá/);
 assert.doesNotMatch(list,/localStorage|sessionStorage|console\.log/);
});
test("price list API authenticates Owner and scopes are not public",()=>{
 const client=read("apps/admin/app/api/pricing/managed/[[...path]]/route.ts");
 const backend=read("backend/admin-api/managed-price-lists-service.mjs");
 assert.match(client,/origin_forbidden/);
 assert.match(client,/Bearer/);
 assert.match(client,/private, no-store/);
 assert.match(client,/POST_ACTIONS/);
 assert.match(backend,/actor\?\.role!=="owner"/);
 assert.match(backend,/scope_customer_type/);
 assert.match(backend,/valid_from/);
 assert.match(backend,/price_required/);
 assert.match(backend,/if\(action==="apply"\)/);
 assert.match(backend,/source_document/);
});
test("shared button geometry is consistent and retains mobile hit target",()=>{
 const controls=read("apps/admin/app/admin-controls.css");
 const layout=read("apps/admin/app/layout.tsx");
 assert.match(controls,/--fb-control-height-compact:\s*36px/);
 assert.match(controls,/--fb-control-height-touch:\s*44px/);
 assert.match(controls,/\.fb-admin :is\(\.btn,\s*\.import-btn,\s*\.catalogue-actions-trigger,\s*\.fb-ui-button\)/);
 assert.match(controls,/align-items:\s*center/);
 assert.match(layout,/import "\.\/admin-controls\.css"/);
});

test("channel preview never reappears after Owner changes SKU/channel/customer/date",()=>{
 const source=read("apps/admin/app/catalogue-managed-prices.tsx");
 assert.match(source,/const scopeGeneration=useRef\(0\)/);
 assert.match(source,/const generation=\+\+scopeGeneration\.current/);
 assert.match(source,/if\(scopeGeneration\.current===generation\)setScopeResult\(result\)/);
 assert.equal((source.match(/scopeGeneration\.current\+=1;setScopeResult\(null\)/g)||[]).length,4);
});

test("channel preview displays VAT inclusive/exclusive status and rejects stale results",()=>{
 const source=read("apps/admin/app/catalogue-managed-prices.tsx");
 assert.match(source,/scopeResult\.vat_included===true\?"Đã gồm VAT"/);
 assert.match(source,/scopeResult\.vat_included===false\?"Chưa gồm VAT"/);
 assert.match(source,/scopeGeneration\.current===generation\)setScopeResult\(result\)/);
 assert.match(source,/scopeResult\.matched_list_code/);
});

test("Owner-created price list is the only bulk import target; no hardcoded four price kinds",()=>{
 const nav=read("apps/admin/app/catalogue-side-workspace.tsx");
 const page=read("apps/admin/app/catalogue-managed-prices.tsx");
 const importUi=read("apps/admin/app/catalogue-managed-price-import.tsx");
 assert.match(nav,/>Bảng giá<\/button>/);
 assert.match(nav,/>Nhập \/ xuất Excel<\/button>/);
 assert.doesNotMatch(nav,/>Excel giá hiện có<\/button>/);
 assert.doesNotMatch(nav,/>Giá theo SKU hiện có<\/button>/);
 assert.match(page,/onOpenImport\?\.\(chosen\.id\)/);
 assert.match(nav,/setChosenManagedListId\(id\);setPricingView\("excel"\)/);
 assert.match(importUi,/list_id:selected\.id/);
 assert.match(importUi,/const chosenId=selectedListId/);
 assert.doesNotMatch(importUi,/setChosenId|initialListId/);
 assert.match(nav,/Bảng giá đang làm việc/);
 assert.match(importUi,/bulk-preview/);
 assert.match(importUi,/bulk-apply/);
 assert.match(importUi,/preview_fingerprint:preview\.preview_fingerprint/);
 assert.match(importUi,/XAC_NHAN_GIA_NHAP/);
 assert.doesNotMatch(importUi,/net_internal|retail_public|dealer_contract|price_kind/);
});
test("explicit multiple channel checkboxes and business-ready labels",()=>{
 const list=read("apps/admin/app/catalogue-managed-prices.tsx");
 const backend=read("backend/admin-api/managed-price-lists-service.mjs");
 const migration=read("backend/neon/migrations/20261103_admin_l03_multi_channel_lists.up.sql");
 assert.match(list,/Kênh sử dụng bảng giá/);
 assert.match(list,/type="checkbox"/);
 assert.match(list,/toggleChannel\(code,e\.target\.checked\)/);
 assert.match(list,/audience:Audience=dealer&&consumer\?"mixed"/);
 assert.match(backend,/audience==="mixed"/);
 assert.match(backend,/l\.audience IN \('consumer','mixed'\)/);
 assert.match(backend,/l\.audience IN \('dealer','mixed'\)/);
 assert.match(migration,/audience='mixed'/);
 assert.match(migration,/scope_customer_type IS NULL AND scope_customer_id IS NULL/);
 assert.doesNotMatch(list,/Tên do anh lựa chọn|Phạm vi bảo mật|Tạo bảng giá mới/);
});
test("three tabs share one selected list and price editors live only in responsive drawer",()=>{
 const nav=read("apps/admin/app/catalogue-side-workspace.tsx");
 const list=read("apps/admin/app/catalogue-managed-prices.tsx");
 const importUi=read("apps/admin/app/catalogue-managed-price-import.tsx");
 const style=read("apps/admin/app/managed-price-lists.css");
 assert.match(nav,/>Bảng giá<\/button>/);
 assert.match(nav,/>Giá sản phẩm<\/button>/);
 assert.match(nav,/>Nhập \/ xuất Excel<\/button>/);
 assert.match(nav,/selectedListId=\{chosenManagedListId\}/);
 assert.match(nav,/onSelectedListIdChange=\{setChosenManagedListId\}/);
 assert.match(nav,/skuNames=\{skuNames\}/);
 assert.match(list,/view==="products"/);
 assert.match(list,/onOpenPrices\?\.\(chosen\.id\)/);
 assert.match(list,/className="fb-managed-drawer-backdrop"/);
 assert.match(list,/role="dialog" aria-modal="true"/);
 assert.match(list,/skuNames\?\.\[priceForm\.sku_cong_ty\]/);
 assert.match(importUi,/selectedListId:string/);
 assert.match(importUi,/list_id:selected\.id/);
 assert.doesNotMatch(importUi,/setChosenId/);
 assert.match(style,/position:fixed;inset:0/);
 assert.match(style,/width:min\(580px,100vw\)/);
 assert.match(style,/@media\(max-width:780px\)/);
});

test("file preview is dropped after any VAT or Excel mapping change",()=>{
 const ui=read("apps/admin/app/catalogue-managed-price-import.tsx");
 assert.match(ui,/const version=\+\+generation\.current/);
 assert.match(ui,/if\(version!==generation\.current\)return/);
 assert.match(ui,/if\(version===generation\.current\)/);
 assert.match(ui,/disabled=\{busy\} onChange=\{e=>\{invalidate\(\);setVat/);
});
test("scoped price-list export allows CSV and XLSX but disallows dangerous CSV formulas",()=>{
 const code=read("apps/admin/app/api/pricing/managed-export/route.ts");
 const backend=read("backend/admin-api/managed-price-lists-service.mjs");
 assert.match(code,/prices-export\?list_id/);
 assert.match(code,/unsafe_csv_sku/);
 assert.match(code,/rows\.some\(\(\[sku\]\)=>/);
 assert.match(code,/sh\.getColumn\(1\)\.numFmt="@"/);
 assert.match(backend,/LIMIT 10001/);
 assert.match(backend,/export_too_large/);
});

test("two-column Excel export and import share exactly the selected effective date",()=>{
 const ui=read("apps/admin/app/catalogue-managed-price-import.tsx");
 const ex=read("apps/admin/app/api/pricing/managed-export/route.ts");
 const service=read("backend/admin-api/managed-price-lists-service.mjs");
 const bulk=read("backend/admin-api/managed-price-import-service.mjs");
 assert.match(ui,/value=\{priceDate\|\|selected\?\.valid_from\|\|""\}/);
 assert.match(ui,/valid_from:priceDate\|\|selected\.valid_from/);
 assert.match(ui,/period:priceDate\|\|selected\.valid_from/);
 assert.match(ex,/period=url\.searchParams\.get\("period"\)/);
 assert.match(ex,/period="\+encodeURIComponent\(period\)/);
 assert.match(service,/p\.valid_from=\$2::date/);
 assert.match(bulk,/period_outside_price_list/);
});
