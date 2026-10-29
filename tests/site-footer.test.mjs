import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fanpageContactReference } from "../lib/content/contact-reference.ts";

const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("all website shells share one structured footer", () => {
  const siteFooter = read("components/site-footer.tsx");
  for (const path of ["app/page.tsx","components/content-ui.tsx","components/catalog-ui.tsx"]) {
    const source = read(path);
    assert.match(source, /<SiteFooter\s*\/>/, path);
    assert.doesNotMatch(source, /<footer className="(?:ref-footer|catalog-footer|content-footer)"/);
  }
  assert.match(siteFooter, /className="site-footer__brand-link"/);
  assert.match(siteFooter, /brand\/fbmn-official-logo\.webp/);
  assert.match(siteFooter, /href="\/lien-he"/);
  assert.match(siteFooter, /href="\/dai-ly"/);
  assert.match(siteFooter, /href="\/san-pham"/);
});

test("footer logo always smaller than menu/header logo", () => {
  const styles = read("app/site-footer.css");
  assert.match(styles, /\.site-footer__logo\s*\{[^}]*width:\s*158px/s);
  assert.match(styles, /\.site-footer__logo\s*\{\s*width:\s*125px/);
  const headerStyles = read("app/rebaseline.css");
  assert.match(headerStyles, /\.ref-brand__official-image\s*\{[^}]*width:\s*min\(213px/s);
  assert.match(headerStyles, /width:\s*clamp\(145px/);
  assert.match(read("app/layout.tsx"), /\.\/site-footer\.css/);
});

test("contact reference is sourced and not misrepresented as official business record", () => {
  assert.equal(fanpageContactReference.status, "reference");
  assert.equal(fanpageContactReference.email, "info@futurebook.vn");
  assert.equal(fanpageContactReference.phone, "090 154 77 45");
  assert.match(fanpageContactReference.source, /Fanpage/);
  assert.ok(!("hours" in fanpageContactReference));
  const footer = read("components/site-footer.tsx");
  assert.match(footer, /Nguồn tham khảo: Fanpage/);
  const contact = read("app/lien-he/page.tsx");
  assert.match(contact, /đang được đối chiếu/);
});
