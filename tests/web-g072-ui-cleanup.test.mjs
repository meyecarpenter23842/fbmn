import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const gallery=read("components/published-image-gallery.tsx");
const detail=read("app/glass-product-detail.css");
const related=read("components/catalogue-related-products.tsx");
const card=read("components/catalog-ui.tsx");
const heading=read("components/content-ui.tsx");
const footer=read("components/site-footer.tsx");
const footerCSS=read("app/site-footer.css");
const app=read("components/app-download.tsx");
const appCSS=read("app/app-download.css");
const stripComments=s=>s.replace(/\/\*[\s\S]*?\*\//g,"");

test("G07.2 one verified photo: zero thumbnails, zero mobile duplicate and zoom remains reachable",()=>{
  assert.match(gallery,/items\.length>1&&<div className=\{glass\?"fb-song-gallery-thumbs":"catalogue-gallery-thumbs"\}/);
  assert.match(gallery,/glass&&items\.length>1&&<p className="fb-song-gallery-caption"/);
  assert.match(gallery,/data-has-multiple=\{items\.length>1\?"true":"false"\}/);
  assert.match(detail,/\.fb-song-gallery\[data-has-multiple="false"\]\[data-has-media="true"\]\s*\{[^}]*display:\s*contents/);
  assert.match(detail,/@media \(max-width: 700px\)[\s\S]*?\.fb-song-main-photo\s*\{\s*display:\s*none/);
  assert.match(gallery,/<dialog ref=\{zoomRef\} className="fb-song-zoom-dialog"/);
  assert.match(gallery,/zoomRef\.current\?\.showModal\(\)/);
  assert.match(gallery,/zoomRef\.current\?\.close\(\)/);
  const options=read("components/catalogue-product-options.tsx");
  assert.match(options,/className="fb-song-overview-preview"/);
  assert.match(options,/disabled=\{gallery\.length===0\}/);
  assert.match(options,/zoomDialogRef=\{zoomDialogRef\}/);
  assert.match(options,/onActiveIndexChange=\{setPhotoIndex\}/);
});

test("G07.2 suggestions are a conventional grid: 4 desktop, 3 tablet, mobile one horizontal-card column",()=>{
  const css=stripComments(detail);
  const block=css.match(/\.fb-song-related-grid\s*\{([^}]*)\}/)?.[1];
  assert.ok(block);
  assert.match(block,/grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.doesNotMatch(block,/grid-auto-flow|grid-auto-columns|overflow-x|scroll-snap|scrollbar/);
  assert.match(css,/@media \(max-width: 1100px\) and \(min-width: 701px\)[\s\S]*?\.fb-song-related-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3/);
  assert.match(css,/@media \(max-width: 700px\)[\s\S]*?\.fb-song-related-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(css,/@media \(max-width: 700px\)[\s\S]*?\.fb-song-related-hit\s*\{[^}]*display:\s*grid/);
  assert.match(css,/\.fb-song-related-image\s*\{[^}]*height:\s*clamp\(216px, 22vw, 270px\)/);
  assert.doesNotMatch(css,/\.fb-song-related-card:nth-child|\.fb-song-related-grid\s*\{[^}]*display:\s*none/);
  assert.match(related,/items\.map\(product=><ProductCard key=\{product\.id\} product=\{product\} glass=\{glass\}\/>\)/);
  assert.match(card,/<GlassCard hover linkCard className="fb-song-related-card">/);
});

test("G07.2 remove redundant visible page introductions while retaining SEO H1, breadcrumbs and content",()=>{
  assert.match(heading,/export function PageHeading\(\{ title \}/);
  assert.match(heading,/return <h1 className="sr-only">\{title\}<\/h1>/);
  assert.doesNotMatch(heading,/className="content-heading"/);
  assert.match(card,/<h1 className="sr-only">\{heading\}<\/h1>/);
  assert.doesNotMatch(card,/<div className="catalog-page-heading">/);
  const tokens=read("app/globals.css");
  assert.match(tokens,/\.sr-only\s*\{/);
  for(const p of ["app/gioi-thieu/page.tsx","app/dai-ly/page.tsx","app/lien-he/page.tsx",
    "app/tin-tuc/page.tsx","app/khuyen-mai/page.tsx"]){
    const source=read(p);
    assert.match(source,/<PageHeading/);
    assert.match(source,/<ContentBreadcrumb/);
    assert.match(source,/metadata:\s*Metadata/);
  }
  assert.match(read("app/san-pham/page.tsx"),/<CatalogListing/);
  assert.match(read("app/danh-muc/[slug]/page.tsx"),/<CatalogListing/);
  assert.match(read("app/tin-tuc/[slug]/page.tsx"),/<h1>\{item\.title\}<\/h1>/);
});

test("DL7D supersedes G07.2 footer groups while keeping brand, contact and social links",()=>{
  assert.match(footer,/brand\/fbmn-transparent-logo\.webp/);
  assert.match(footer,/<FooterSocialLinks \/>/);
  assert.match(footer,/officialContact as contact/);
  assert.match(footer,/href="\/lien-he#thong-tin-lien-he"/);
  assert.doesNotMatch(footer,/Khám phá Futurebook|Hỗ trợ khách hàng|Fanpage/);
  assert.match(footerCSS,/\.site-footer__logo\s*\{[^}]*width:\s*104px/);
  assert.match(footerCSS,/@media \(max-width: 700px\)[\s\S]*?\.site-footer__grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,1fr\)/);
  assert.match(footerCSS,/\.site-footer__social-icon--facebook/);
  assert.match(footerCSS,/\.site-footer__social-icon--youtube/);
  assert.match(footerCSS,/\.site-footer__social-icon--tiktok/);
  assert.doesNotMatch(footerCSS,/position:\s*fixed|!important/);
});

test("G07.2 glass app popover uses true multicolor CH Play icon and never fabricates store links",()=>{
  assert.match(app,/const label = platform === "ios" \? "iOS" : "CH Play"/);
  assert.match(app,/aria-label="Google Play"/);
  for(const color of ["#32B6E9","#45CF80","#FFCE40","#F35B66"])
    assert.ok(app.includes(color),color);
  assert.match(app,/getAppStoreLink\(platform\)/);
  assert.match(app,/platform="ios"/);
  assert.match(app,/platform="android"/);
  assert.match(app,/aria-disabled="true"/);
  assert.match(app,/Ứng dụng chưa phát hành/);
  assert.doesNotMatch(app,/href="https:\/\/(?:play\.google\.com|apps\.apple\.com)/);
  assert.match(appCSS,/\.app-download\s*\{[^}]*background:\s*linear-gradient\(133deg/);
  assert.match(appCSS,/\.app-download\s*\{[^}]*backdrop-filter:\s*blur/);
  assert.match(appCSS,/\.app-download__head\s*\{[^}]*min-height:\s*52px/);
  assert.match(appCSS,/@media \(max-width: 800px\)[\s\S]*?\.app-download__head\s*\{[^}]*min-height:\s*56px/);
  assert.match(appCSS,/\.app-download__heading strong\s*\{[^}]*font-size:\s*16px/);
  assert.match(appCSS,/app-download-enter var\(--fb-motion-dialog-open\)/);
  assert.match(appCSS,/app-download-exit var\(--fb-motion-dialog-close\)/);
  assert.match(app,/setTimeout\(\(\)=>\{/);
  assert.match(app,/APP_PROMPT_STORAGE_KEY/);
  assert.match(app,/event\.key === "Escape"/);
  assert.match(appCSS,/@media \(prefers-reduced-motion:\s*reduce\)/);
});

test("G07.2 no backend/new R2 paths and no malformed CSS",()=>{
  for(const [name,s]of Object.entries({detail,footerCSS,appCSS})){
    assert.equal((s.match(/\{/g)||[]).length,(s.match(/\}/g)||[]).length,name);
    assert.doesNotMatch(stripComments(s),/!important|background-attachment:\s*fixed/);
  }
  assert.doesNotMatch(app+footer,/DATABASE_URL|NET_PRICE|R2_SECRET|new URL\("https:\/\/.*r2/);
  assert.match(read("app/san-pham/[slug]/page.tsx"),/getPublicCatalog\(\)/);
  assert.match(read("lib/media/decorative-background.ts"),/website: "\/api\/decorative-background"/);
});
