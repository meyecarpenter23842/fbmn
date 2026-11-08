// G06 browser QA: real screenshots, viewport overflow, SKU, gallery, menu and Web Vitals.
// Run with: npm install --no-save playwright && npx playwright install chromium
// G06_BASE_URL=https://fbmn-web.vercel.app node scripts/g06-browser-qa.mjs
// Screenshots need a HUMAN comparison to the two Owner reference illustrations.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

const base = process.env.G06_BASE_URL || "https://fbmn-web.vercel.app";
if (!/^https:\/\/[a-z0-9.-]+\.vercel\.app\/?$/.test(base)) {
  throw new Error("Only an approved Vercel HTTPS Website origin is supported.");
}
const origin = base.replace(/\/$/, "");
const output = resolve(process.env.G06_OUTPUT_DIR || "artifacts/g06");
const widths = [1440, 1280, 768, 390, 360];
const routes = [
  ["home", "/"], ["catalog", "/san-pham"],
  ["song-natural", "/san-pham/sku-3ac08ff247847c1e77bfccb0e806ed29"],
  ["dealer", "/dai-ly"], ["contact", "/lien-he"],
  ["news", "/tin-tuc"], ["promotions", "/khuyen-mai"],
];
const observations = [], failures = [], blockers = new Set();
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  // Inspect native motion in both normal and reduced-motion media modes.
  // A single screenshot with animations disabled cannot certify motion quality.
  for (const reduced of ["no-preference", "reduce"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }, reducedMotion: reduced,
    });
    const page = await context.newPage();
    try {
      await page.goto(origin + "/", {waitUntil:"domcontentloaded",timeout:35000});
      const values = await page.evaluate(() => {
        const card = document.querySelector(".fb-glass-motion-card");
        const nav = document.querySelector(".ref-navigation__link");
        return {
          card: card ? getComputedStyle(card).transitionDuration : null,
          nav: nav ? getComputedStyle(nav).transitionDuration : null,
          matchesReducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        };
      });
      if (reduced === "reduce" && values.card !== "0s" && values.card !== "0s, 0s, 0s") {
        failures.push("Reduced-motion card transition is not disabled: "+values.card);
      }
      if (reduced === "no-preference" && (!values.card || values.card === "0s")) {
        failures.push("Normal-motion card transition is missing");
      }
      observations.push({label:"motion-"+reduced,width:1440, ...values});
    } catch(e) {
      blockers.add("Motion-mode probe unavailable: "+String(e).slice(0,140));
    } finally {
      await context.close();
    }
  }
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: width > 800 ? 900 : 844 },
      locale: "vi-VN", colorScheme: "light", reducedMotion: "reduce",
    });
    for (const [label, path] of routes) {
      if (["dealer","contact","news","promotions"].includes(label) &&
          width !== 1440 && width !== 390) continue;
      const page = await context.newPage();
      const errors = [], images = [];
      page.on("pageerror", e => errors.push(e.message));
      page.on("response", r => {
        if (r.url().includes("/api/decorative-background")) images.push(r.status());
      });
      await page.addInitScript(() => {
        window.__g06 = { lcp: null, cls: 0, inp: null };
        try {
          new PerformanceObserver(list => {
            for (const e of list.getEntries()) window.__g06.lcp = Math.round(e.startTime);
          }).observe({type:"largest-contentful-paint",buffered:true});
          new PerformanceObserver(list => {
            for (const e of list.getEntries()) if (!e.hadRecentInput) window.__g06.cls += e.value;
          }).observe({type:"layout-shift",buffered:true});
          new PerformanceObserver(list => {
            for (const e of list.getEntries()) window.__g06.inp =
              Math.max(window.__g06.inp || 0, Math.round(e.duration));
          }).observe({type:"event", buffered:true, durationThreshold:16});
        } catch { /* unsupported metrics stay null */ }
      });
      const started = performance.now();
      try {
        const response = await page.goto(origin + path, {waitUntil:"domcontentloaded",timeout:35000});
        await page.locator("body").waitFor({state:"visible",timeout:10000});
        await page.waitForTimeout(450);
        const data = await page.evaluate(() => {
          const n = performance.getEntriesByType("navigation")[0];
          const root = document.querySelector(".fb-glass-site");
          const outliers = [...document.querySelectorAll("body *")].filter(el => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.right > innerWidth + 3 || r.left < -3);
          }).slice(0,10).map(el => ({
            tag: el.tagName.toLowerCase(),
            cls: typeof el.className === "string" ? el.className.slice(0,75) : "",
            left: Math.round(el.getBoundingClientRect().left),
            right: Math.round(el.getBoundingClientRect().right),
          }));
          return {
            documentWidth: document.documentElement.scrollWidth,
            overflow: document.documentElement.scrollWidth > innerWidth + 3,
            outliers, backdrop: Boolean(root),
            backgroundConfigured: root?.getAttribute("data-decorative") === "true",
            ttfbMs: n ? Math.round(n.responseStart) : null,
            domLoadedMs: n ? Math.round(n.domContentLoadedEventEnd) : null,
            pageLoadMs: n?.loadEventEnd ? Math.round(n.loadEventEnd) : null,
            brokenImages: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.alt),
            vitals: window.__g06,
          };
        });
        const screenshot = label + "-" + width + ".png";
        await page.screenshot({path:resolve(output,screenshot),fullPage:true,animations:"disabled",timeout:30000});
        const item = {label,path,width,status:response?.status()??null,screenshot,...data,
          backgroundHttp:images.at(-1)??null, pageErrors:errors};
        if (item.status !== 200) failures.push(label+"/"+width+" HTTP "+item.status);
        if (item.overflow) failures.push(label+"/"+width+" horizontal overflow");
        if (!item.backdrop) failures.push(label+"/"+width+" glass backdrop missing");
        if (item.pageErrors.length) failures.push(label+"/"+width+" JS page error");
        if (images.includes(404)) blockers.add("Decorative background GET returned HTTP 404.");
        if (item.brokenImages.length) blockers.add("Some product/brand images are broken.");
        if (label === "song-natural") {
          const variants = page.locator(".fb-song-sku");
          item.skuCount = await variants.count();
          if (item.skuCount > 1) {
            const target = variants.nth(1);
            const sku = (await target.textContent())?.trim();
            await target.click();
            item.sku = {sku,pressed:await target.getAttribute("aria-pressed"),
              summary:(await page.locator(".fb-song-summary-code").textContent())?.trim()};
            if (item.sku.pressed !== "true" || !item.sku.summary?.includes(sku))
              failures.push("SKU selection "+width+" did not update summary");
          } else failures.push("No selectable SKU at "+width);
          const thumbs = page.locator(".fb-song-gallery-thumb");
          item.thumbnailCount = await thumbs.count();
          if (item.thumbnailCount > 1) {
            await thumbs.nth(1).click();
            if (await thumbs.nth(1).getAttribute("aria-pressed") !== "true")
              failures.push("Gallery thumbnail failed at "+width);
          }
          item.quoteHref = await page.locator(".fb-song-quote").first()
            .getAttribute("href").catch(() => null);
          if (item.quoteHref !== "/#contact") failures.push("Quote CTA link changed at "+width);
        }
        if (label === "home" && width <= 768) {
          const toggle = page.locator('button[aria-controls="site-navigation"]');
          if (await toggle.count()) {
            await toggle.click();
            item.menuOpened = await toggle.getAttribute("aria-expanded");
            await page.keyboard.press("Escape");
            item.menuClosed = await toggle.getAttribute("aria-expanded");
            if (item.menuOpened !== "true" || item.menuClosed !== "false")
              failures.push("Mobile menu open/Escape failed at "+width);
          } else failures.push("Mobile menu trigger absent at "+width);
        }
        // Event Timing is asynchronous; sample after the actual SKU/gallery/menu
        // interactions, not from the pre-interaction page snapshot.
        await page.waitForTimeout(180);
        item.vitals = await page.evaluate(() => window.__g06);
        item.backgroundHttp = images.at(-1) ?? null;
        item.elapsedWithScreenshotMs = Math.round(performance.now()-started);
        observations.push(item);
      } catch (e) {
        failures.push(label+"/"+width+" "+String(e).slice(0,200));
        observations.push({label,path,width,error:String(e)});
      } finally {
        await page.close();
      }
    }
    await context.close();
  }
} finally { await browser.close(); }

const report = {
  site:origin, commit:process.env.GITHUB_SHA || null,
  capturedAt:new Date().toISOString(), widths, failures, blockers:[...blockers],
  notes:[
    "Reference comparison is manual; screenshots must be reviewed by Owner.",
    "LCP/CLS/INP are single-run lab observations, not real-user Web Vitals.",
    "elapsedWithScreenshotMs includes image capture and is not navigation speed.",
  ], observations,
};
await writeFile(resolve(output,"report.json"),JSON.stringify(report,null,2)+"\n");
const lines = [
  "# G06 browser QA", "",
  "Site: "+origin, "Screenshots: "+observations.filter(x=>x.screenshot).length,
  "Hard failures: "+failures.length, "Blockers: "+blockers.size,"",
  "| Route | Width | HTTP | Overflow | Background HTTP | LCP ms | CLS |",
  "|---|---:|---:|---|---:|---:|---:|",
  ...observations.map(o => "| "+o.label+" | "+o.width+" | "+(o.status??"—")+" | "+
    (o.overflow === undefined ? "—" : o.overflow ? "YES" : "no")+" | "+
    (o.backgroundHttp??"—")+" | "+(o.vitals?.lcp??"—")+" | "+
    (typeof o.vitals?.cls === "number" ? o.vitals.cls.toFixed(3) : "—")+" |"),
  "", "## Hard failures", ...(failures.length ? failures.map(x=>"- "+x):["- None"]),
  "", "## Blockers", ...([...blockers].length ? [...blockers].map(x=>"- "+x):["- None"]),
  "", "Pixel-perfect parity and real-user speed are NOT certified by this script.",
];
await writeFile(resolve(output,"report.md"),lines.join("\n")+"\n");
console.log(lines.join("\n"));
if (failures.length) process.exitCode=1;
