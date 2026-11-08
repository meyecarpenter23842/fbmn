import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = p => readFileSync(new URL("../"+p,import.meta.url),"utf8");
const card = read("components/catalog-ui.tsx");
const detail = read("components/catalogue-product-options.tsx");
const gallery = read("components/published-image-gallery.tsx");
const css = read("app/glass-product-detail.css");
const listingCss = read("app/catalog.css");
const related = read("components/catalogue-related-products.tsx");
const core = read("app/glass-foundation.css");
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, "");

test("G07: one accessible full-card link, no nested links, redundant detail action removed",()=>{
  const block=card.slice(card.indexOf("export function ProductCard("),card.indexOf("export function formatRetail"));
  assert.match(block, /const content = <Link href=\{href\} prefetch=\{false\}/);
  assert.match(block, /aria-label=\{"Xem sản phẩm " \+ product.name\}/);
  assert.match(block, /className=\{glass \? "fb-song-related-hit" : "catalog-product__hit"\}/);
  assert.equal((block.match(/<Link\b/g)||[]).length,1);
  assert.equal((block.match(/<GlassButtonLink\b/g)||[]).length,0);
  assert.doesNotMatch(block, /Xem chi tiết|onClick=\{/);
  assert.match(block, /<GlassCard hover linkCard className="fb-song-related-card">/);
  assert.match(block, /<article className="catalog-product">/);
  assert.match(block, /getPublishedProductImageUrl\(media.r2Key, process.env.NEXT_PUBLIC_MEDIA_BASE_URL\)/);
  assert.match(related, /items\.map\(product=><ProductCard key=\{product\.id\} product=\{product\} glass=\{glass\}\/>\)/);
  assert.match(core, /\.fb-glass-card--link > a:focus-visible\s*\{[^}]*outline:\s*3px solid/);
  assert.match(listingCss, /\.catalog-product__hit:focus-visible\s*\{[^}]*outline:\s*3px solid/);
});

test("G07: mobile catalogue stacks compact horizontal cards and preserves all rows",()=>{
  assert.match(listingCss, /@media \(max-width: 700px\)[\s\S]*?\.catalog-grid\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.fb-song-related-hit\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(85px, 36%\) minmax\(0,1fr\)/);
  assert.match(css, /\.fb-song-related-image\s*\{[^}]*height:\s*160px/);
  assert.match(css, /\.fb-song-related-body h3\s*\{[^}]*-webkit-line-clamp:\s*2/);
  assert.doesNotMatch(css, /\.fb-song-related-grid\s*>\s*\.fb-song-related-card:nth-child/);
  assert.match(listingCss, /\.catalog-empty-image\.catalog-image-compact\s*\{/);
  assert.doesNotMatch(stripComments(css), /!important|background-attachment:\s*fixed/);
});

test("G07: compact published-image preview and SKU controls precede large gallery on mobile",()=>{
  assert.match(detail, /const \[sku,setSku\]=useState\(product\.variants\[0\]\.sku\)/);
  assert.match(detail, /const gallery=photosForSku\(photos,selected\.sku\)/);
  assert.match(detail, /className="fb-song-overview-preview"/);
  assert.match(detail, /src=\{gallery\[photoIndex\]\?\.src\?\?gallery\[0\]\?\.src\?\?null\}/);
  assert.match(detail, /disabled=\{gallery.length===0\}/);
  assert.match(detail, /zoomDialogRef=\{zoomDialogRef\}/);
  assert.match(detail, /activeIndex=\{photoIndex\}/);
  assert.match(detail, /onActiveIndexChange=\{setPhotoIndex\}/);
  assert.match(detail, /const selectSku=\(nextSku:string\)=>\{setSku\(nextSku\);setPhotoIndex\(0\);\}/);
  assert.match(gallery, /const active=activeIndex\?\?selected/);
  assert.match(core, /\.fb-glass-card--link\s*\{\s*padding:\s*0/);
  assert.match(core, /\.fb-glass-card--link > a\s*\{[^}]*padding:\s*clamp/);
  // Cascade-aware guard: shared :link variant must NOT override the page's
  // desktop flex and mobile grid modes with higher-specificity display:block.
  const sharedHit = stripComments(core).match(/\.fb-glass-card--link > a\s*\{([^}]*)\}/)?.[1];
  assert.ok(sharedHit);
  assert.doesNotMatch(sharedHit, /display\s*:/);
  assert.match(css, /\.fb-song-related-hit\s*\{[^}]*display:\s*flex/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.fb-song-related-hit\s*\{[^}]*display:\s*grid/);
  assert.doesNotMatch(css, /\.fb-song-related-card:focus-within/);
  assert.match(css, /\.fb-song-info\s*\{\s*order:\s*0/);
  assert.match(css, /\.fb-song-gallery\s*\{\s*order:\s*1/);
  assert.match(css, /\.fb-song-overview\s*\{[^}]*grid-template-columns:\s*104px minmax\(0,1fr\)/);
  assert.match(css, /\.fb-song-overview-preview\s*\{[^}]*height:\s*124px/);
  assert.match(css, /\.fb-song-sku-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit, minmax\(65px, 1fr\)\)/);
  assert.match(detail, /choices\.map\(variant=><VariantChoice key=\{variant\.sku\}/);
  assert.match(detail, /onClick=\{\(\)=>selectSku\(variant\.sku\)\}/);
  assert.match(detail, /aria-live="polite" aria-atomic="true"/);
});

test("G07: one native zoom dialog, working thumbnails, Escape/focus handled by browser",()=>{
  assert.match(gallery, /zoomDialogRef\?:RefObject<HTMLDialogElement\|null>/);
  assert.match(gallery, /<dialog ref=\{zoomRef\} className="fb-song-zoom-dialog"/);
  assert.match(gallery, /zoomRef\.current\?\.showModal\(\)/);
  assert.match(gallery, /zoomRef\.current\?\.close\(\)/);
  assert.match(gallery, /onClick=\{openZoom\}/);
  assert.match(gallery, /aria-pressed=\{active===i\}/);
  assert.match(gallery, /choose\(i\)/);
  assert.match(gallery, /current\?\.src\?\?null/);
  assert.match(css, /\.fb-song-zoom-dialog::backdrop/);
  assert.doesNotMatch(gallery, /document\.addEventListener|window\.addEventListener|onKeyDown/);
  assert.doesNotMatch(gallery, /unsplash|mockup|imagegen|\.r2\.dev/);
});

test("G07: sticky quote appears only offscreen, retains company SKU and real contact URL",()=>{
  assert.match(detail, /const \[showMobileQuote,setShowMobileQuote\]=useState\(false\)/);
  assert.match(detail, /new IntersectionObserver/);
  assert.match(detail, /setShowMobileQuote\(!entry\.isIntersecting\)/);
  assert.match(detail, /observer\.disconnect\(\)/);
  assert.match(detail, /ref=\{primaryQuoteRef\} href="\/#contact"/);
  assert.match(detail, /glass&&showMobileQuote&&<div className="fb-song-mobile-cta"/);
  assert.match(detail, /Mã <strong>\{selected\.sku\}<\/strong>/);
  assert.match(detail, /<GlassButtonLink href="\/#contact" pill>Liên hệ báo giá<\/GlassButtonLink>/);
  assert.match(css, /\.fb-song-mobile-cta\s*\{\s*display:\s*none/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.fb-song-mobile-cta\s*\{[^}]*position:\s*fixed/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);

  // The chatbot is a separate fixed 52px control, 12px from the right edge.
  // The G07 quote bar must reserve 92px, leaving >=16px between hit targets.
  const chat = read("app/chatbot.css");
  assert.match(chat, /\.fb-chat\s*\{[^}]*z-index:\s*120/);
  assert.match(chat, /@media \(max-width: 700px\)[\s\S]*?\.fb-chat\s*\{[^}]*right:\s*12px/);
  assert.match(chat, /\.fb-chat__launcher\s*\{[^}]*width:\s*52px/);
  assert.match(css, /width:\s*min\(440px, calc\(100% - 92px\)\)/);
  assert.match(css, /left:\s*10px/);
  assert.match(css, /\.fb-song-mobile-cta > span\s*\{[^}]*text-overflow:\s*ellipsis/);
  for (const viewport of [360,390]) {
    const quoteRight=10+Math.min(440,viewport-92);
    const chatbotLeft=viewport-12-52;
    assert.ok(chatbotLeft-quoteRight>=16,"float controls overlap at "+viewport);
  }

  assert.match(core, /@media \(max-width: 780px\)/);
  assert.doesNotMatch(css, /bottom-navigation|bottom-dock|\.fb-glass-button\s*\{/);
});

test("G07: zoom dialog respects 280ms opening, 220ms closing and reduced motion with Escape",()=>{
  const tokens=read("app/globals.css");
  assert.match(tokens, /--fb-motion-dialog-open:\s*280ms/);
  assert.match(tokens, /--fb-motion-dialog-close:\s*220ms/);
  assert.match(css, /\.fb-song-zoom-dialog\s*\{[^}]*opacity:\s*0;[^}]*transition:[^}]*var\(--fb-motion-dialog-close\)/);
  assert.match(css, /\.fb-song-zoom-dialog\[open\]\s*\{[^}]*opacity:\s*1;[^}]*var\(--fb-motion-dialog-open\)/);
  assert.match(css, /\.fb-song-zoom-dialog::backdrop\s*\{[^}]*var\(--fb-motion-dialog-close\)/);
  assert.match(css, /\.fb-song-zoom-dialog\[open\]::backdrop\s*\{[^}]*var\(--fb-motion-dialog-open\)/);
  assert.match(css, /@starting-style\s*\{[\s\S]*?\.fb-song-zoom-dialog\[open\]/);
  assert.match(css, /overlay var\(--fb-motion-dialog-close\) allow-discrete/);
  assert.match(css, /display var\(--fb-motion-dialog-close\) allow-discrete/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.fb-song-zoom-dialog::backdrop\s*\{[^}]*transition:\s*none/);
  assert.match(gallery, /zoomRef\.current\?\.close\(\)/);
  assert.match(gallery, /zoomRef\.current\?\.showModal\(\)/);
  assert.doesNotMatch(gallery, /onCancel=.*preventDefault|onKeyDown=/);
});

test("G07 image zoom inherits the shared 52/56px visible popup header",()=>{
  assert.match(gallery, /<dialog ref=\{zoomRef\} className="fb-song-zoom-dialog"[\s\S]*?aria-labelledby="fb-song-zoom-title"/);
  assert.match(gallery, /<header className="fb-glass-dialog-header">/);
  assert.match(gallery, /<h2 id="fb-song-zoom-title" className="fb-glass-dialog-header__title">/);
  assert.match(gallery, /<GlassButton variant="secondary"[\s\S]*?onClick=\{\(\)=>zoomRef.current\?\.close\(\)\}/);
  assert.match(core, /\.fb-glass-dialog-header\s*\{[^}]*min-height:\s*52px/);
  assert.match(core, /\.fb-glass-dialog-header__title\s*\{[^}]*font-size:\s*16px/);
  assert.match(core, /@media \(max-width: 780px\)[\s\S]*?\.fb-glass-dialog-header\s*\{[^}]*min-height:\s*56px/);
  assert.match(core, /border-inline-start:\s*3px solid var\(--color-primary\)/);
  assert.match(core, /background:\s*linear-gradient\(105deg, rgba\(245, 236, 253/);
  assert.doesNotMatch(css, /\.fb-glass-dialog-header\s*\{/);
  assert.doesNotMatch(css, /\.fb-song-zoom-close\s*\{/);
});

test("G07: style ownership and source-backed content remain unchanged",()=>{
  assert.doesNotMatch(stripComments(css), /\.catalogue-|\.catalog-|\.fb-glass-card\s*\{|\.fb-glass-chip\s*\{/);
  assert.doesNotMatch(detail, /fetch\(|localStorage|sessionStorage|NET_PRICE|R2_SECRET/);
  for(const [path,s] of Object.entries({css,listingCss,core})){
    assert.equal((s.match(/\{/g)||[]).length,(s.match(/\}/g)||[]).length,path+" braces");
  }
  assert.match(read("app/san-pham/[slug]/page.tsx"), /getPublicCatalog\(\)/);
  assert.match(read("app/san-pham/[slug]/page.tsx"), /getProductBySlug\(catalog, slug\)/);
});
