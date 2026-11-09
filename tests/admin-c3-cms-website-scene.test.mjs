import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CMS_PLACEMENTS} from "../backend/admin-api/cms-placement-contract.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const map=read("apps/admin/app/cms-website-scene-map.ts");
const scene=read("apps/admin/app/cms-website-scene.tsx");
const style=read("apps/admin/app/cms-website-scene.css");
const preview=read("apps/admin/app/cms-visual-preview.tsx");
const layout=read("apps/admin/app/layout.tsx");
const shell=read("components/site-header.tsx");
const home=read("app/page.tsx");
const news=read("app/tin-tuc/page.tsx");
const promos=read("app/khuyen-mai/page.tsx");
const catalogue=read("components/catalog-ui.tsx");
const content=read("components/content-ui.tsx");

test("C3 maps every public_web slot exactly, no native App slot and no fake live renderer",()=>{
 const list=Object.values(CMS_PLACEMENTS).flatMap(v=>v.public_web);
 assert.equal(list.length,10);
 assert.equal(new Set(list).size,10);
 const entries=[...map.matchAll(/^ "([a-z_.]+)":\{/gm)].map(x=>x[1]);
 assert.deepEqual([...entries].sort(),[...list].sort());
 for(const slot of list)assert.match(map,new RegExp('"'+slot.replaceAll(".","\\.")+'":\\{'));
 assert.match(map,/placementReady:false/g);
 assert.doesNotMatch(map,/placementReady:true/);
 assert.match(map,/CMS_SLOTS\[kind\]\.public_web/);
 assert.match(map,/not yet in app\/page\.tsx/);
});

test("C3 keeps real homepage section order and correct category/layout sources",()=>{
 assert.match(home,/className="ref-hero"/);
 assert.match(home,/id="collections" className="ref-featured"/);
 assert.doesNotMatch(home,/className="ref-promos"/);
 assert.match(home,/CmsBannerSlot items=\{cms\} slot="home\.after_products"/);
 assert.match(scene,/className="cms-site-hero"/);
 assert.match(scene,/className="cms-site-categories"/);
 assert.match(scene,/className="cms-site-featured"/);
 assert.match(scene,/slot==="home\.after_products"/);
 assert.match(scene,/className="cms-site-promo-row"/);
 assert.match(map,/ref-featured → ref-promos/);
 assert.match(map,/catalog-breadcrumb → catalog-layout/);
 assert.match(catalogue,/className="catalog-breadcrumb"/);
 assert.match(catalogue,/className="catalog-layout"/);
 assert.match(scene,/cms-site-catalog-layout/);
 assert.match(scene,/cms-site-filter/);
 assert.match(scene,/cms-site-results/);
});

test("C3 uses official header and real editorial list structure, never fake dates/images",()=>{
 for(const label of ["Trang chủ","Giới thiệu","Sản phẩm","Khuyến mãi","Dành cho đại lý","Tin tức","Liên hệ"])
  assert.ok(scene.includes('"'+label+'"'),label);
 assert.match(shell,/fbmn-official-logo\.webp/);
 assert.match(scene,/src="\/brand\/fbmn-official-logo\.webp"/);
 assert.match(news,/ArticlePreview/);
 assert.match(promos,/PromotionPreview/);
 assert.match(content,/className="content-article-card"/);
 assert.match(content,/className="content-card-grid"|className="content-breadcrumb"/);
 assert.doesNotMatch(content,/className="content-article-card"[^]*<img/);
 assert.match(scene,/Ngày đăng khi được duyệt/);
 assert.match(scene,/Thẻ trên Website chỉ có nội dung chữ/);
 assert.match(style,/\.cms-site-story-grid\{display:grid;grid-template-columns:repeat\(2/);
 assert.match(style,/\.cms-site-frame--mobile \.cms-site-story-grid\{grid-template-columns:1fr/);
});

test("C3 shows only real draft/persisted R2 image and never crops product/banner photos",()=>{
 assert.match(preview,/cmsMediaKey\(current,device\)/);
 assert.match(preview,/CmsImagePreview/);
 assert.match(preview,/webOnly\?\s*<div className="cms-simulation-viewport">/);
 assert.match(preview,/CmsWebsiteScene kind=\{kind\} slot=\{slot\}/);
 assert.match(scene,/className="cms-site-banner-art"\>\{image\}/);
 assert.match(style,/\.cms-site-banner-art \.cms-media-image\{[^}]*object-fit:contain/);
 assert.doesNotMatch(style,/\.cms-site-banner-art \.cms-media-image\{[^}]*object-fit:cover/);
 assert.doesNotMatch(scene,/fake_price|NET_PRICE|DEMO_SKU|\/api\/cms\/publish/);
 assert.match(layout,/import "\.\/cms-website-scene\.css"/);
});

test("C3 popup illustrates only marketing overlay and respects Website device mode",()=>{
 for(const slot of ["home.entry","category.entry","all.entry"])assert.ok(map.includes('"'+slot+'":{'));
 assert.match(scene,/kind==="popup"/);
 assert.match(scene,/className="cms-site-overlay"/);
 assert.match(scene,/Popup toàn Website: khung này dùng trang chủ làm đại diện/);
 assert.match(scene,/className=\{"cms-site-frame cms-site-frame--"\+device\}/);
 assert.match(style,/\.cms-site-frame--mobile \.cms-site-header/);
 assert.match(style,/\.cms-site-frame--mobile \.cms-site-catalog-layout\{grid-template-columns:1fr/);
 assert.match(style,/\.cms-site-frame--mobile \.cms-site-category-tiles\{display:flex/);
 assert.match(style,/\.cms-site-frame--mobile \.cms-site-promo-row\{display:flex/);
 assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);
});

test("C3 does not claim CMS live or change authoring/publish routes",()=>{
 const manager=read("apps/admin/app/cms-manager.tsx");
 assert.match(scene,/Chỉ xem trước trong Admin — không phải Website đã xuất bản/);
 assert.match(scene,/CMS chưa xuất bản/);
 assert.match(preview,/không phải ảnh chụp live hoặc renderer CMS đã triển khai/);
 assert.match(manager,/Chờ kết nối Website/);
 assert.match(manager,/channel="public_web" device=\{previewDevice\} webOnly/);
 assert.match(manager,/Lưu bản nháp & ảnh/);
 assert.doesNotMatch(scene,/fetch\(|setInterval\(|navigator\.serviceWorker/);
});
