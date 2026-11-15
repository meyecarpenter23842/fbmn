import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Next.js 16 navigation resets page scroll instantly while preserving smooth anchor links", () => {
  const layout = source("app/layout.tsx");
  const styles = source("app/globals.css");
  const header = source("components/site-header.tsx");

  // Next.js 16 opts in to temporarily overriding global smooth scroll during
  // route changes only when this attribute is present on the root html node.
  assert.match(layout, /<html lang="vi" data-scroll-behavior="smooth">/);
  assert.match(styles, /html\\s*\\{\\s*scroll-behavior:\\s*smooth;\\s*\\}/);

  // Keep native hash anchors / browser history restoration, not a global
  // scrollTo(0,0) effect or scroll={false} on navigation links.
  assert.match(header, /href: "\\/#home"/);
  assert.match(header, /href: "\\/san-pham"/);
  assert.match(header, /href="\\/lien-he#thong-tin-lien-he"/);
  assert.doesNotMatch(header, /scroll=\\{false\\}/);
  assert.doesNotMatch(layout, /scrollTo\\(|history\\.scrollRestoration/);
});
