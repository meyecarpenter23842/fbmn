import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("rebaselined desktop sections follow the new approved screenshot", () => {
  const page = read("app/page.tsx");
  const order = ["ref-hero", "ref-categories", "ref-featured", "ref-promos", "ref-trust", "      <SiteFooter />"];
  const offsets = order.map(s => page.indexOf(s));
  assert.ok(offsets.every(n => n >= 0), "Missing required desktop section");
  assert.deepEqual([...offsets].sort((a,b) => a-b), offsets);
  assert.match(page, /VỞ VIẾT/);
  assert.match(page, /FUTUREBOOK/);
  assert.match(page, /Vở A4/);
  assert.match(page, /Vở B5/);
});

test("DL1 desktop main nav has six links and approved purple theme", () => {
  const header = read("components/site-header.tsx");
  const css = read("app/rebaseline.css");
  assert.doesNotMatch(header, /ref-navigation__catalog/);
  assert.match(header, /href: "\/gia-cong"/);
  assert.match(header, /href: "\/bang-tin"/);
  assert.match(header, /href: "\/catalogue"/);
  assert.match(header, /ref-header__dealer-cta/);
  assert.match(css, /\.ref-navigation \{ background: rgba\(255,255,255,\.12\)/);
  assert.match(css, /\.ref-navigation__link--active \{[^}]*background: linear-gradient\(115deg, var\(--color-primary\)/);
  assert.match(css, /@media \(max-width: 800px\)/);
  assert.doesNotMatch(css, /ref-bottom-nav|position:\s*fixed/);
});

test("mockup phone, price, code and popularity labels are not offered as true data", () => {
  const source = read("app/page.tsx") + read("lib/ui-preview.ts") + read("components/site-header.tsx");
  assert.doesNotMatch(source, /19\.500|28\.500|14\.500|32\.500|M483|M494|M885|M439|0901\.567\.890/);
  assert.doesNotMatch(source, />Bán chạy<|>Mới Mở<|>Sản phẩm chính hãng</);
  assert.match(source, /MẪU UI|MẪU GIAO DIỆN/);
  assert.match(source, /Liên hệ báo giá/);
  assert.match(source, /đang cập nhật|đang hoàn thiện/i);
});

test("unsupported search, cart and account actions remain disabled", () => {
  const header = read("components/site-header.tsx");
  const home = read("app/page.tsx");
  assert.match(header, /action="\/san-pham" method="get"/);
  assert.match(header, /type="search" name="q"/);
  assert.doesNotMatch(header, /type="button" disabled title="Giỏ hàng chưa mở"/);
  assert.match(header, /ref-header__dealer-cta/);
  assert.match(home, /type="button" disabled title="Giỏ hàng chưa mở"/);
  assert.match(home, /href="#categories"/);
  assert.match(home, /id="categories"/);
});
