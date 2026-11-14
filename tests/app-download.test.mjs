import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getAppStoreLink, appStoreLinks } from "../lib/app-download/config.ts";
import {
  APP_PROMPT_INTERVAL_MS,
  APP_PROMPT_FIRST_VISIT_DELAY_MS,
  APP_PROMPT_STORAGE_KEY,
  getNextAutoPromptDelay,
} from "../lib/app-download/schedule.ts";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("app destinations remain empty until verified store listings are provided", () => {
  assert.equal(appStoreLinks.ios, null);
  assert.equal(appStoreLinks.android, null);
  assert.equal(getAppStoreLink("ios"), null);
  assert.equal(getAppStoreLink("android"), null);
});

test("app promotion is limited to once per two hours per browser", () => {
  const now = 1_800_000_000_000;
  assert.equal(APP_PROMPT_INTERVAL_MS, 7_200_000);
  assert.match(APP_PROMPT_STORAGE_KEY, /last-shown/);
  assert.ok(APP_PROMPT_FIRST_VISIT_DELAY_MS >= 500);
  assert.equal(getNextAutoPromptDelay(now, null), APP_PROMPT_FIRST_VISIT_DELAY_MS);
  assert.equal(getNextAutoPromptDelay(now, now), APP_PROMPT_INTERVAL_MS);
  assert.equal(getNextAutoPromptDelay(now, now - 3_600_000), 3_600_000);
  assert.equal(getNextAutoPromptDelay(now, now - 7_200_000), 0);
  assert.equal(getNextAutoPromptDelay(now, -1), APP_PROMPT_FIRST_VISIT_DELAY_MS);
});

test("menu action and popup are global, dismissible and have recognized brand marks", () => {
  const layout = read("app/layout.tsx"), footer = read("components/site-footer.tsx");
  const ui = read("components/app-download.tsx");
  const css = read("app/app-download.css");
  assert.match(layout, /<AppDownloadProvider>/);
  assert.match(footer, /<AppDownloadMenuButton/);
  assert.match(ui, /aria-haspopup="dialog"/);
  assert.match(ui, /aria-label="Đóng thông báo tải ứng dụng"/);
  assert.match(ui, /APP_PROMPT_STORAGE_KEY/);
  assert.match(ui, /"visibilitychange"/);
  assert.match(ui, /"storage"/);
  assert.match(ui, /event\.key === "Escape"/);
  assert.match(ui, /platform="ios"/);
  assert.match(ui, /platform="android"/);
  assert.match(ui, /Simple Icons/);
  assert.match(ui, /"CH Play"/);
  assert.match(ui, /aria-label="Google Play"/);
  assert.doesNotMatch(ui, /M18\.4395 5\.5586/);
  assert.match(ui, /app-download--closing/);
  assert.match(css, /app-download-enter var\(--fb-motion-dialog-open\)/);
  assert.match(css, /app-download-exit var\(--fb-motion-dialog-close\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /z-index:\s*110/);
  assert.doesNotMatch(ui, /href="https:\/\/(?:apps\.apple\.com|play\.google\.com)/);
});

 test("automatic app prompt does not obscure catalogue or policy; manual menu retained",()=>{
 const ui=read("components/app-download.tsx");
 assert.match(ui,/isCatalogue=pathname==="\/catalogue"/);
 assert.match(ui,/if \(open\|\|isCatalogue\|\|isPolicy\|\|!settings\?\.popupEnabled\) return/);
 assert.match(ui,/\(isCatalogue\|\|isPolicy\|\|!settings\?\.popupEnabled\)&&open&&source==="automatic"\)dismiss\(\)/);
 assert.match(ui,/showPopup\("menu"\)/);
 assert.match(ui,/isPolicy=pathname==="\/policy"/);
 assert.match(ui,/open && !isPolicy/);
 });

test("App popup public settings are refreshed on route/visibility without a new Website release",()=>{
 const ui=read("components/app-download.tsx");
 assert.match(ui,/fetch\("\/api\/app-download"/);
 assert.match(ui,/parseAppDownloadConfig/);
 assert.match(ui,/settings\.cooldownMinutes\*60_000/);
 assert.match(ui,/settings\?\.buttonEnabled/);
});
