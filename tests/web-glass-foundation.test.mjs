import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const globals = source("app/globals.css");
const glass = source("app/glass-foundation.css");
const layout = source("app/layout.tsx");

test("Website imports exactly one opt-in G01 glass foundation after legacy styles", () => {
  const importLine = 'import "./glass-foundation.css";';
  assert.equal(layout.split(importLine).length - 1, 1);
  assert.ok(layout.indexOf(importLine) > layout.indexOf('import "./chatbot.css";'));
  assert.doesNotMatch(glass, /(?:^|\n)\s*(?:body|html|\.ref-|\.catalog-|\.fb-admin|\.dv-)\b/m);
});

test("Glass V2 tokens are centralized in globals and keep brand/control geometry", () => {
  const required = [
    "--fb-glass-page:", "--fb-glass-surface:", "--fb-glass-surface-strong:",
    "--fb-glass-surface-fallback:", "--fb-glass-border:", "--fb-glass-border-fallback:",
    "--fb-glass-blur:", "--fb-glass-blur-mobile:", "--fb-glass-card-radius:",
    "--fb-glass-panel-radius:", "--fb-glass-shadow:", "--fb-glass-shadow-hover:",
    "--fb-glass-ink:", "--fb-glass-muted:", "--fb-glass-backdrop-gradient:",
    "--fb-motion-glass-card:", "--fb-motion-glass-lift:",
  ];
  for (const token of required) {
    assert.equal(globals.split(token).length - 1, 1, token);
  }
  for (const token of [
    "--color-primary: #6d249e", "--color-accent: #ec0753",
    "--fb-control-height-compact: 36px", "--fb-control-height-touch: 44px",
    "--fb-field-height: 40px", "--fb-control-font-size: 13px",
    "--fb-control-radius: 9px", "--fb-motion-button: 190ms",
    "--fb-motion-menu: 200ms"
  ]) assert.ok(globals.includes(token), token);

  // The visual foundation must consume tokens, not define a conflicting second source.
  assert.doesNotMatch(glass, /--fb-(?:glass|motion-glass)-[\w-]+\s*:/);
});

test("Glass surface has safe no-blur fallback, responsive blur, and reduced motion", () => {
  for (const selector of [
    ".fb-glass-page", ".fb-glass-backdrop", ".fb-glass-surface",
    ".fb-glass-surface--strong", ".fb-glass-card", ".fb-glass-panel",
    ".fb-glass-motion-card"
  ]) assert.ok(glass.includes(selector), selector);
  assert.match(glass, /background-color: var\(--fb-glass-surface-fallback\)/);
  assert.match(glass, /@supports \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)/);
  assert.match(glass, /backdrop-filter: blur\(var\(--fb-glass-blur\)\)/);
  assert.match(glass, /@media \(max-width: 780px\)/);
  assert.match(glass, /backdrop-filter: blur\(var\(--fb-glass-blur-mobile\)\)/);
  assert.match(glass, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(glass, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(glass, /\.fb-glass-motion-card:focus-visible/);
  assert.doesNotMatch(glass, /transition[^;]*backdrop-filter/);
  assert.doesNotMatch(glass, /https?:\/\/|cloudflarestorage\.com|NEXT_PUBLIC_MEDIA/);
});

test("Website glass foundation does not import or alter Admin styles", () => {
  assert.doesNotMatch(layout, /admin-controls\.css|apps\/admin/);
  assert.doesNotMatch(glass, /@import|\.fb-admin\b|\.fb-product-modal\b/);
});
