import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Owner single-artwork Hero has one full-width CMS/fallback image and SEO-only heading",()=>{
 const page=read("app/page.tsx"),css=read("app/rebaseline.css");
 assert.match(page,/<h1 id="hero-heading" className="sr-only">/);
 assert.match(page,/hasCmsHero[\s\S]*<CmsBannerSlot items=\{cms\} slot="home\.hero"\/>/);
 assert.match(page,/asset=\{approvedSiteMedia\.heroBanner\}/);
 assert.match(page,/className="cms-hero-cta" href="\/san-pham"/);
 assert.doesNotMatch(page,/ref-hero__copy|ref-hero__brush|ref-hero__benefits|NotebookArt|ref-hero__rays/);
 assert.match(css,/\.ref-hero__inner \{ position:relative; display:block;/);
 assert.match(css,/\.ref-hero__fallback \{[^}]*aspect-ratio:16\/7/s);
 assert.match(css,/\.ref-hero__fallback \{ aspect-ratio:4\/5; \}/);
 assert.doesNotMatch(css,/grid-template-columns: 43% 57%/);
});

test("all published Hero slides preserve approved images and one keyboard-accessible CTA",()=>{
 const tsx=read("components/cms-hero-carousel.tsx");
 const css=read("app/cms-public.css");
 assert.match(tsx,/ctaUrl:item\.ctaUrl/);
 assert.match(tsx,/href=\{item\.ctaUrl\|\|"\/san-pham"\}/);
 assert.match(tsx,/tabIndex=\{i===index\?0:-1\}/);
 assert.match(tsx,/aria-hidden=\{i!==index\}/);
 assert.match(tsx,/aria-label=\{"Xem sản phẩm Futurebook/);
 assert.match(tsx,/media="\(max-width: 800px\)"/);
 assert.match(tsx,/state\.prepared\.includes\(i\)/);
 assert.match(tsx,/current\.motion\.intervalMs/);
 assert.match(tsx,/prefers-reduced-motion: reduce/);
 assert.match(css,/\.cms-hero-stage\{[^}]*aspect-ratio:16\/7/s);
 assert.match(css,/\.cms-hero-stage\{aspect-ratio:4\/5\}/);
 assert.match(css,/\.cms-hero-image\{[^}]*object-fit:contain/s);
 assert.doesNotMatch(css,/mix-blend-mode:multiply/);
 assert.match(css,/\.cms-hero-cta:focus-visible\{outline:3px solid #fff/);
 assert.match(css,/\.cms-hero-cta\{left:50%;bottom:60px/);
 assert.match(css,/\.cms-hero-controls/);
});

test("Owner Admin preview uses same single frame and CTA as public Website",()=>{
 const scene=read("apps/admin/app/cms-website-scene.tsx");
 const stylesheet=read("apps/admin/app/cms-website-scene.css");
 const manager=read("apps/admin/app/cms-manager.tsx");
 const slideEditor=read("apps/admin/app/cms-slide-editor.tsx");
 assert.match(scene,/slot==="home\.hero"\?image:/);
 assert.match(scene,/cms-site-hero-cta/);
 assert.doesNotMatch(scene,/cms-site-hero-copy/);
 assert.match(stylesheet,/\.cms-site-hero\{[^}]*aspect-ratio:16\/7/s);
 assert.match(stylesheet,/\.cms-site-frame--mobile \.cms-site-hero\{aspect-ratio:4\/5\}/);
 assert.doesNotMatch(stylesheet,/grid-template-columns:43% minmax\(0,57%\)/);
 assert.match(manager,/Liên kết nút Xem sản phẩm \(Hero\)/);
 assert.match(manager,/Để trống, nút mở \/san-pham/);
 assert.match(slideEditor,/Nút Xem sản phẩm là nút HTML/);
 assert.match(manager,/pendingSlides/);
 assert.match(slideEditor,/orderMove/);
});
