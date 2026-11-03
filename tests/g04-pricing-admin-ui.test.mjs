import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("G04 pricing proxy requires private JWT and blocks cross-origin writes",()=>{
 const source=read("apps/admin/app/api/pricing/entries/route.ts");
 assert.match(source,/^export const runtime="nodejs";/);
 assert.match(source,/private, no-store/);
 assert.match(source,/origin_forbidden/);
 assert.match(source,/method:"GET"\|"POST"\|"PATCH"/);
 assert.match(source,/request.headers.get\("origin"\)!==url.origin/);
 assert.match(source,/if\(!\/\^Bearer /);
 assert.match(source,/invalid_bearer/);
 assert.match(source,/\["?200/); // bounded Worker response statuses
 assert.doesNotMatch(source,/pricebook_entries|select \* from|localStorage|sessionStorage/);
});
test("G04 UI keeps price memory private, gates by verified Admin session, and requires Owner for writes",()=>{
 const panel=read("apps/admin/app/catalogue-pricebook-panel.tsx");
 const parent=read("apps/admin/app/catalogue-product-workspace.tsx");
 assert.match(parent,/<CataloguePricebookPanel key=\{selectedSku\}/);
 assert.match(panel,/fetch\("\/api\/admin\/session"/);
 assert.match(panel,/if\(prices.status===403\|\|session.status===403\)/);
 assert.match(panel,/setOwner\(identity.data\?\.role==="owner"\)/);
 assert.match(panel,/if\(!owner\|\|saving\|\|loading\)return/);
 assert.match(panel,/Chưa có giá cho loại này. Không có giá không có nghĩa là 0 đồng/);
 assert.match(panel,/Chưa được duyệt hoặc công khai/);
 assert.match(panel,/Giá NET/);
 assert.match(panel,/Giá bán lẻ/);
 assert.match(panel,/Giá đại lý/);
 assert.match(panel,/source_document:form.source.trim\(\)/);
 assert.match(panel,/effective_from:effectiveFrom/);
 assert.match(panel,/Date\.now\(\)\+7\*60\*60\*1000/);
 assert.doesNotMatch(panel,/!form\.date\|\|/);
 assert.match(panel,/expected_revision:editing.revision/);
 assert.match(panel,/confirm:"LUU_GIA_NHAP"/);
 assert.match(panel,/confirm:"CAP_NHAT_GIA_NHAP"/);
 assert.doesNotMatch(panel,/localStorage|sessionStorage|window\.location|console\.log/);
});
test("G04 source/VAT must be explicit and never infer retail price from NET",()=>{
 const panel=read("apps/admin/app/catalogue-pricebook-panel.tsx");
 assert.match(panel,/vatIncluded:"" as ""\|"yes"\|"no"/);
 assert.match(panel,/if\(form.vatIncluded===""\)/);
 assert.match(panel,/!form.source.trim\(\)/);
 assert.match(panel,/form.until<effectiveFrom/);
 assert.match(panel,/!validUuid\(form.customerId\)/);
 assert.doesNotMatch(panel,/price_kind:"retail_public".*net_internal/);
 assert.doesNotMatch(panel,/\/\s*1\.08|\*\s*1\.08/);
 const css=read("apps/admin/app/catalogue-workspace.css");
 assert.match(css,/\.catalogue-pricebook-form-grid/);
 assert.match(css,/@media\(max-width:760px\)/);
});

test("Admin price save feedback uses top-right toast without hiding reload after transient failures",()=>{
 const panel=read("apps/admin/app/catalogue-pricebook-panel.tsx");
 const toast=read("apps/admin/app/admin-toast.tsx");
 const css=read("apps/admin/app/admin-refinement.css");
 assert.match(panel,/<AdminToast message=\{error\|\|notice\}/);
 assert.doesNotMatch(panel,/className="catalogue-pricebook-inline-(success|error)"/);
 assert.match(panel,/const \[loadFailed,setLoadFailed\]=useState\(false\)/);
 assert.match(panel,/if\(!loading&&!authorized&&!loadFailed\)return null/);
 assert.match(panel,/setLoadFailed\(true\)/);
 assert.match(panel,/Dữ liệu giá chưa tải được\. Chọn Làm mới để thử lại/);
 assert.match(toast,/variant==="error"\?"alert":"status"/);
 assert.match(css,/\.catalogue-toast \{ position:fixed; right:12px; top:12px/);
 assert.match(css,/\.catalogue-toast--error/);
});

test("Concurrent price and media toasts stack within the modal focus trap",()=>{
 const toast=read("apps/admin/app/admin-toast.tsx");
 const modal=read("apps/admin/app/product-modal.tsx");
 const css=read("apps/admin/app/admin-refinement.css");
 assert.match(toast,/createPortal\(content,target.host\)/);
 assert.match(toast,/closest\("\.fb-product-modal"\)/);
 assert.match(modal,/className="fb-product-modal-toast-stack"/);
 assert.match(css,/\.fb-product-modal-toast-stack \{/);
 assert.match(css,/flex-direction:column/);
});
