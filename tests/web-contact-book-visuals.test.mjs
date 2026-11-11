import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("contact embeds a lazy, privacy-conscious Google map for the official address", () => {
  const contact = read("app/lien-he/page.tsx");
  const css = read("app/content.css");
  assert.match(contact, /officialContact as contact/);
  assert.match(contact, /encodeURIComponent\(contact.address\)/);
  assert.match(contact, /google\.com\/maps\?q=/);
  assert.match(contact, /loading="lazy"/);
  assert.match(contact, /referrerPolicy="no-referrer"/);
  assert.match(contact, /content-outline-panel--contact/);
  assert.match(css, /\.content-outline-panel--contact\s*\{[^}]*display:flex; flex-direction:column/);
  assert.match(css, /\.content-location-map\s*\{[^}]*flex:1 1 auto/);
});

test("outsourcing illustration is decorative and does not increase card height", () => {
  const outsourcing = read("app/gia-cong/page.tsx");
  const css = read("app/content.css");
  const svg = read("public/illustrations/futurebook-paper-craft.svg");
  assert.match(outsourcing, /content-outline-panel--outsourcing/);
  assert.match(outsourcing, /src="\/illustrations\/futurebook-paper-craft\.svg"/);
  assert.match(outsourcing, /alt="Minh họa giấy và sổ theo yêu cầu gia công"/);
  assert.match(css, /\.content-outsourcing-art\s*\{[^}]*position:\s*absolute/);
  assert.match(css, /\.content-outline-panel--outsourcing\s*\{[^}]*overflow:\s*hidden/);
  assert.doesNotMatch(css, /\.content-outline-panel--outsourcing\s*\{[^}]*(?:min-height|height):/);
  assert.match(svg, /<svg[^>]*viewBox="0 0 780 450"/);
  assert.doesNotMatch(svg, /<script|https?:\/\//);
});

test("no new public API, pricing or unverified service promises in this visual update", () => {
  const contact = read("app/lien-he/page.tsx");
  const outsourcing = read("app/gia-cong/page.tsx");
  assert.match(contact, /<ContactRequestForm\s*\/>/);
  assert.match(outsourcing, /<OutsourcingRequestForm\s*\/>/);
  assert.match(outsourcing, /FBMN_DL6_ENABLED/);
  assert.match(outsourcing, /chỉ được xác nhận sau khi Futurebook Miền Nam/);
});
