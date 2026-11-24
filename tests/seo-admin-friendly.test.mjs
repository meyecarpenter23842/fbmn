import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("SEO editor lists published targets from the same canonical website read models",()=>{
 const api=read("app/api/seo-targets/route.ts");
 for(const source of ["getPublicCatalog","getPublicContent","getPublicCategoryDisplay","productMetadata","categoryMetadata","articleMetadata","productApprovedSeoImages"])assert.ok(api.includes(source));
 assert.ok(api.includes('process.env.FBMN_PUBLIC_API_ENABLED!=="true"'));
 assert.ok(api.includes('"X-Robots-Tag":"noindex, nofollow"'));
 assert.ok(api.includes("activeCategories.has(c.id)"));
 assert.doesNotMatch(api,/\.price|internalNotes|FBMN_ADMIN_API/);
 const proxy=read("apps/admin/app/api/website/seo-targets/route.ts");
 assert.ok(proxy.includes('fetch("https://www.fbmn.vn/api/seo-targets"'));
 assert.ok(proxy.includes('redirect:"error"'));
 assert.doesNotMatch(proxy,/Authorization|Bearer/);
});
test("SEO manager joins all saved revisions to published targets and searches across pages",()=>{
 const ui=read("apps/admin/app/seo-settings-manager.tsx");
 for(const s of ["loadTargets()","p<=50","result.hasMore","targets.filter","filtered.slice","existing?.revision??0","??\"auto\"","item.name","searchText","beforeClose"])assert.ok(ui.includes(s),s);
 assert.doesNotMatch(ui,/dán URL hoặc slug|parsePath\(/);
 assert.ok(ui.includes("editing.images.includes(image)"));
 assert.ok(ui.includes('existing?.mode==="noindex"||confirmed'));
 assert.ok(ui.includes('draft.mode==="custom"?draft.title.trim()'));
 assert.ok(ui.includes("Xem trước khi chia sẻ Facebook / Zalo"));
});
