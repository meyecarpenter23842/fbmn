import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { officialContact } from "../lib/content/official-contact.ts";

const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("all website shells share one structured footer", () => {
  const siteFooter = read("components/site-footer.tsx");
  for (const path of ["app/page.tsx","components/content-ui.tsx","components/catalog-ui.tsx"]) {
    const source = read(path);
    assert.match(source, /<SiteFooter\s*\/>/, path);
    assert.doesNotMatch(source, /<footer className="(?:ref-footer|catalog-footer|content-footer)"/);
  }
  assert.match(siteFooter, /className="site-footer__brand-link"/);
  assert.match(siteFooter, /brand\/fbmn-transparent-logo\.webp/);
  assert.match(siteFooter, /href="\/lien-he#thong-tin-lien-he"/);
  assert.doesNotMatch(siteFooter, /aria-label="(?:Khám phá Futurebook|Hỗ trợ khách hàng)"/);
});

test("footer logo always smaller than menu/header logo", () => {
  const styles = read("app/site-footer.css");
  assert.match(styles, /\.site-footer__logo\s*\{[^}]*width:\s*104px/s);
  assert.match(styles, /\.site-footer__logo\s*\{\s*width:\s*110px/);
  const headerStyles = read("app/rebaseline.css");
  assert.match(headerStyles, /\.ref-brand__official-image\s*\{[^}]*width:\s*144px/s);
  assert.match(headerStyles, /width:\s*132px/);
  assert.match(read("app/layout.tsx"), /\.\/site-footer\.css/);
});

test("Owner-approved contact is shared across public pages", () => {
  assert.equal(officialContact.email, "info@fbmn.vn");
  assert.equal(officialContact.emailHref, "mailto:info@fbmn.vn");
  assert.equal(officialContact.phone, "84 90 154 77 45");
  assert.equal(officialContact.phoneHref, "tel:+84901547745");
  assert.match(read("components/site-footer.tsx"), /contact\.phoneHref/);
  assert.match(read("app/lien-he/page.tsx"), /contact\.phoneHref/);
  assert.match(read("app/gioi-thieu/page.tsx"), /contact\.phoneHref/);
  assert.match(read("app/site-footer.css"), /display: flex; align-items: baseline;/);
  assert.equal(officialContact.address, "1092A Lê Đức Anh (QL01A), P. Tân Tạo, Ho Chi Minh City, Vietnam, 700000");
  for (const path of ["components/site-footer.tsx", "app/lien-he/page.tsx", "app/gioi-thieu/page.tsx"]) {
    const source = read(path);
    assert.match(source, /officialContact as contact/);
    assert.match(source, /contact\.address/);
    assert.match(source, /contact\.email/);
    assert.doesNotMatch(source, /Fanpage|đang được đối chiếu|1717B|info@futurebook\.vn/);
  }
});

test("official social links: Facebook active, YouTube and TikTok pending", () => {
  const social = read("components/footer-social-links.tsx");
  const config = read("lib/content/social-profiles.ts");
  const footer = read("components/site-footer.tsx");
  const style = read("app/site-footer.css");
  assert.match(footer, /<FooterSocialLinks\s*\/>/);
  assert.match(config, /https:\/\/www\.facebook\.com\/futurebook\.miennam/);
  assert.match(config, /youtube", name: "YouTube", url: null/);
  assert.match(config, /tiktok", name: "TikTok", url: null/);
  assert.match(social, /target="_blank"/);
  assert.match(social, /rel="noopener noreferrer"/);
  assert.match(social, /site-footer__social-icon--pending/);
  assert.match(social, /aria-label=\{profile\.name \+ " — sắp cập nhật đường dẫn"\}/);
  assert.match(social, /Simple Icons/);
  assert.match(style, /\.site-footer__social-icon--facebook/);
  assert.match(style, /\.site-footer__social-icon--youtube/);
  assert.match(style, /\.site-footer__social-icon--tiktok/);
  assert.match(style, /box-shadow:/);
  assert.match(style, /prefers-reduced-motion/);
});
