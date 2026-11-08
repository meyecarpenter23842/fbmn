import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const layout = read("app/layout.tsx");
const site = read("app/globals.css");
const foundation = read("app/glass-foundation.css");
const header = read("components/site-header.tsx");
const home = read("app/page.tsx");
const homeCss = read("app/rebaseline.css");
const listing = read("components/catalog-ui.tsx");
const catalogue = read("app/catalog.css");
const detail = read("app/san-pham/[slug]/page.tsx");
const content = read("app/content.css");
const footer = read("app/site-footer.css");
const categories = read("app/category-navigation.css");
const cfg = read("lib/media/decorative-background.ts");

test("G05 puts exactly ONE Owner-approved R2 decorative backdrop across all Website routes", () => {
  assert.match(layout, /<GlassPageBackdrop className="fb-glass-site"/);
  assert.match(layout, /decorativeReadPath=\{publicDecorativeBackground\.website \?\? undefined\}/);
  assert.equal((layout.match(/<GlassPageBackdrop/g) || []).length, 1);
  assert.match(cfg, /website: "\/api\/decorative-background"/);
  assert.match(cfg, /website: "\/api\/decorative-background" \| null/);
  assert.match(foundation, /\.fb-glass-site\s*\{[^}]*min-height:\s*100vh/);
  assert.match(foundation, /var\(--fb-glass-backdrop-overlay\),\s*var\(--fb-glass-decorative-image\),\s*var\(--fb-glass-backdrop-gradient\)/);
  assert.doesNotMatch(detail, /GlassPageBackdrop|decorativeReadPath|NEXT_PUBLIC_MEDIA_BASE_URL.*decorative/);
  assert.doesNotMatch(layout, /r2\.dev|cloudflarestorage\.com|R2_SECRET|private\/|https?:\/\/.*decorative/);
});

test("G05 glass visual materials use Website tokens with a no-blur fallback and soft green hint", () => {
  for (const t of [
    "--fb-glass-panel-layer:", "--fb-glass-surface-layer:",
    "--fb-glass-stroke:", "--fb-glass-display-font:", "--fb-glass-ui-blur:"
  ]) assert.ok(site.includes(t), t);
  assert.match(site, /--fb-glass-panel-layer:\s*var\(--fb-glass-surface-fallback\)/);
  assert.match(site, /@supports \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)/);
  assert.match(site, /--fb-glass-backdrop-gradient:[^;]*rgba\(176, 211, 150, \.26\)/);
  assert.match(site, /--color-primary: #6d249e/);
  assert.match(site, /--color-accent: #ec0753/);
  for (const css of [homeCss,catalogue,content]) {
    assert.match(css, /--fb-glass-panel-layer/);
    assert.match(css, /--fb-glass-ui-blur/);
    assert.doesNotMatch(css, /background-attachment:\s*fixed|transition[^;]*backdrop-filter/);
  }
});

test("G05 home, catalogue, editorial and footer share glass styling but retain their structure", () => {
  for (const route of ["app/gioi-thieu/page.tsx","app/dai-ly/page.tsx",
    "app/lien-he/page.tsx","app/tin-tuc/page.tsx","app/khuyen-mai/page.tsx"]) {
    assert.match(read(route), /<ContentShell>/, route);
  }
  for (const route of ["app/san-pham/page.tsx","app/danh-muc/[slug]/page.tsx"]) {
    assert.match(read(route), /<CatalogShell>/, route);
  }
  assert.match(home, /<GlassCard hover className="fb-glass-home-product"/);
  assert.doesNotMatch(home, /<Card className="ref-product-card"/);
  assert.match(listing, /<ProductCard key=\{product\.id\} product=\{product\} glass\/>/);
  assert.match(detail, /const glass=true/);
  assert.match(detail, /<CatalogueProductOptions product=\{product\} photos=\{images\} glass=\{glass\}\/>/);
  assert.match(detail, /<CatalogueRelatedProducts items=\{recommendations\.items\} glass=\{glass\}\/>/);
  assert.match(homeCss, /\.ref-featured__intro\s*\{[^}]*var\(--fb-glass-panel-layer\)/);
  assert.match(catalogue, /\.catalog-filters\s*\{[^}]*var\(--fb-glass-panel-layer\)/);
  assert.match(content, /\.content-intro-panel\s*\{[^}]*var\(--fb-glass-panel-layer\)/);
  assert.match(categories, /\.category-nav__link\s*\{[^}]*var\(--fb-glass-surface-layer\)/);
  assert.match(footer, /\.site-footer\s*\{[^}]*linear-gradient\(118deg,#391950/);
  assert.match(read("components/site-footer.tsx"), /aria-label="Khám phá Futurebook"/);
});

test("G05 does not fabricate commerce capabilities, claims, prices or product photos", () => {
  const navbarLinks=["/gioi-thieu","/san-pham","/khuyen-mai","/dai-ly","/tin-tuc","/lien-he"];
  for (const href of navbarLinks) assert.ok(header.includes('href: "'+href+'"'), href);
  assert.match(header, /type="button" disabled title="Giỏ hàng chưa mở"/);
  assert.match(header, /aria-controls="site-navigation"/);
  assert.match(home, /MẪU GIAO DIỆN/);
  assert.match(home, /Liên hệ báo giá/);
  assert.match(detail, /getPublishedProductImageUrl\(media\.r2Key,process\.env\.NEXT_PUBLIC_MEDIA_BASE_URL\)/);
  assert.match(detail, /getProductBySlug\(catalog, slug\)/);
  assert.match(detail, /getPublicCatalog\(\)/);
  assert.match(detail, /generateMetadata/);
  assert.doesNotMatch(home+detail, /mockup\.com|unsplash\.com|imagegen|NET_PRICE/);
  assert.match(read("app/lien-he/page.tsx"), /fieldset disabled/);
  assert.doesNotMatch(layout, /apps\/admin|admin-controls\.css|MobileBottomNavigation/);
});

test("G05 keeps desktop and mobile controls accessible without layout animation or bottom dock", () => {
  assert.match(homeCss, /\.ref-navigation--open\s*\{[\s\S]*?visibility: visible/);
  assert.match(homeCss, /@media \(max-width: 800px\)/);
  assert.match(homeCss, /\.ref-navigation__link\s*\{\s*color: var\(--fb-glass-ink\); background: transparent;/);
  assert.match(homeCss, /\.ref-navigation__catalog\s*\{\s*color: #fff;\s*background: linear-gradient\(115deg, var\(--color-primary\)/);
  assert.match(homeCss, /\.ref-navigation__link--active\s*\{\s*color: #fff;\s*background: linear-gradient\(115deg, var\(--color-primary\)/);

  // P1 review: button and selected link must keep WCAG-readable colours on hover/focus.
  const downloadCss = read("app/app-download.css");
  const downloadBase = downloadCss.match(/\.ref-navigation__download\s*\{([^}]*)\}/)?.[1];
  const downloadHover = downloadCss.match(/\.ref-navigation__download:hover\s*\{([^}]*)\}/)?.[1];
  const downloadFocus = downloadCss.match(/\.ref-navigation__download:focus-visible\s*\{([^}]*)\}/)?.[1];
  assert.ok(downloadBase && downloadHover && downloadFocus);
  assert.match(downloadBase, /background:\s*rgba\(255,255,255,\.47\)/);
  assert.match(downloadBase, /color:\s*var\(--color-primary-strong\)/);
  assert.match(downloadHover, /background:\s*rgba\(255,255,255,\.8\)/);
  assert.match(downloadFocus, /outline:\s*3px solid var\(--color-primary\)/);
  const mobileDownload = downloadCss.match(/@media \(max-width: 800px\)\s*\{[\s\S]*?\.ref-navigation__download\s*\{([^}]*)\}/)?.[1];
  assert.match(mobileDownload || "", /min-height:\s*var\(--fb-control-height-touch\)/);
  const selectedStates = homeCss.match(/\.ref-navigation__link--active:hover,\s*\.ref-navigation__link--active:focus-visible,\s*\.ref-navigation__catalog:hover,\s*\.ref-navigation__catalog:focus-visible\s*\{([^}]*)\}/)?.[1];
  assert.ok(selectedStates);
  assert.match(selectedStates, /color:\s*#fff/);
  assert.match(selectedStates, /background:\s*linear-gradient\(115deg, var\(--color-primary\), var\(--color-primary-strong\)\)/);
  assert.match(homeCss, /\.ref-navigation__link:not\(\.ref-navigation__link--active\):focus-visible\s*\{[^}]*color:\s*var\(--color-primary-strong\)/);

  assert.match(homeCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(categories, /overflow-x:\s*auto/);
  assert.match(categories, /scroll-snap-type:\s*x mandatory/);
  assert.match(content, /\.content-contact-form input:disabled/);
  assert.match(catalogue, /min-height: var\(--fb-field-height\)/);
  assert.match(foundation, /\.fb-glass-chip\[data-selected="true"\]/);
  assert.match(foundation, /@media \(max-width: 780px\)/);
  assert.doesNotMatch(homeCss + footer, /ref-bottom-nav|position:\s*fixed/);
});

test("G05 CSS and glass primitive styles have no accidental second style owner", () => {
  // G03 and G02 share geometry through the primitive; homepage custom class is layout only.
  const block=homeCss.match(/\.fb-glass-home-product\s*\{([^}]*)\}/)?.[1];
  assert.ok(block);
  assert.doesNotMatch(block, /background|color:|border:|box-shadow|backdrop-filter|transition|padding:|border-radius/);
  assert.doesNotMatch(foundation, /(?:^|\n)\s*(?:\.ref-|\.catalog-|\.content-|\.site-footer|\.fb-admin)/m);
  for (const [name,css] of Object.entries({homeCss,catalogue,content,footer,categories,foundation})) {
    assert.doesNotMatch(css, /(?:^|[;\s{])[a-z]+[A-Z][A-Za-z]*\s*:/m, name+": invalid camelCase declaration");
    assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,name+": unbalanced rules");
  }
});
