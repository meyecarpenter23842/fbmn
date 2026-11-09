import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {cmsPublishIssues,cmsPublishWarnings} from "../apps/admin/app/cms-publish-readiness.ts";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const ready={
 kind:"banner",title:"Vở Futurebook",slug:"vo-futurebook",
 summary:"Có lựa chọn phù hợp",cta_url:"/san-pham",
 source_ref:"Chiến dịch nội bộ FBMN đã duyệt",
 channel_targets:["public_web"],placements:{public_web:"home.hero"},
 has_desktop:true,has_mobile:true,starts_at:null,ends_at:null
};
test("CMS preflight names every missing hard condition before publish",()=>{
 const bad={...ready,source_ref:"",has_mobile:false,placements:{},channel_targets:["public_web","dealer_app"]};
 const problems=cmsPublishIssues(bad);
 assert.deepEqual(problems.map(x=>x.code),["source","channel","placement","mobile"]);
 assert.deepEqual(problems.map(x=>x.step),[0,1,1,2]);
 assert.equal(cmsPublishIssues(ready).length,0);
 assert.equal(cmsPublishIssues({...ready,kind:"promotion",ends_at:null}).some(x=>x.code==="expiry"),true);
 assert.equal(cmsPublishIssues({...ready,ends_at:"2020-01-01T00:00:00Z"},Date.parse("2026-11-09")).some(x=>x.code==="expired"),true);
});
test("CMS warnings are nonblocking and never invent a source",()=>{
 const vague={...ready,summary:"",cta_url:""};
 assert.equal(cmsPublishIssues(vague).length,0);
 assert.equal(cmsPublishWarnings(vague).length,2);
 assert.equal(cmsPublishIssues({...ready,source_ref:""}).some(x=>x.code==="source"),true);
});
test("Hero CMS is one visual composition with low-motion safe carousel",()=>{
 const slot=read("components/cms-web-content.tsx");
 const carousel=read("components/cms-hero-carousel.tsx");
 const css=read("app/cms-public.css");
 assert.match(slot,/slot==="home.hero"/);
 assert.match(slot,/CmsHeroCarousel/);
 assert.match(carousel,/intervalMs:7000/);
 assert.match(carousel,/current\.motion\.intervalMs/);
 assert.match(carousel,/prefers-reduced-motion: reduce/);
 assert.match(carousel,/document\.hidden/);
 assert.match(carousel,/onFocusCapture/);
 assert.match(carousel,/aria-label=\{"Xem Slide "/);
 assert.match(carousel,/aria-pressed=\{i===index\}/);
 assert.doesNotMatch(carousel,/\{index\+1\} \/ \{slides\.length\}/);
 assert.match(carousel,/media="\(max-width: 800px\)"/);
 assert.match(css,/\.cms-hero-image\{[^}]*object-fit:contain/s);
 assert.match(css,/\.cms-hero-image\{[^}]*mix-blend-mode:multiply/s);
 assert.match(css,/\.cms-hero-slide\.is-active/);
 assert.match(css,/\.cms-hero-dot:focus-visible/);
 assert.match(css,/\.cms-hero-controls\{position:absolute;z-index:3;left:50%/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(slot,/cms-web-banners--home-hero.*cms-web-banner-copy/s);
});
test("CMS list/media readiness and Admin scene follow same Hero composition",()=>{
 const service=read("backend/admin-api/cms-service.mjs");
 const manager=read("apps/admin/app/cms-manager.tsx");
 const scene=read("apps/admin/app/cms-website-scene.tsx");
 assert.match(service,/AS has_desktop/);
 assert.match(service,/AS has_mobile/);
 assert.match(manager,/cmsPublishIssues\(item\)/);
 assert.match(manager,/Nguồn \/ ghi chú duyệt/);
 assert.match(manager,/Kiểm tra trước khi xuất bản/);
 assert.match(scene,/cms-site-hero-cms-media/);
 assert.doesNotMatch(scene,/slot==="home\.hero"&&slotView/);
});
