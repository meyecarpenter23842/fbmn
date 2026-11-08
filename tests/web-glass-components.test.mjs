import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const components = source("components/glass-ui.tsx");
const css = source("app/glass-foundation.css");
const globals = source("app/globals.css");
const layout = source("app/layout.tsx");

test("G02 Website-only primitives are exported and reuse the G01 foundation", () => {
  for (const name of [
    "GlassPageBackdrop", "GlassHeader", "GlassCard", "GlassPanel",
    "GlassMediaFrame", "GlassButton", "GlassButtonLink",
    "GlassChip", "GlassChipLink"
  ]) assert.match(components, new RegExp("export function " + name + "\\("));
  for (const name of [
    "fb-glass-backdrop", "fb-glass-surface", "fb-glass-card",
    "fb-glass-panel", "fb-glass-motion-card", "fb-glass-header",
    "fb-glass-media-frame", "fb-glass-button", "fb-glass-chip"
  ]) assert.ok(components.includes('"' + name + '"'), name);
  assert.equal(layout.split('import "./glass-foundation.css";').length - 1, 1);
  assert.doesNotMatch(components, /apps\/admin|admin-controls\.css|dai-viet/);
});

test("Button actions and navigation are real native button or Next Link elements", () => {
  assert.match(components, /type GlassButtonProps = Omit<ComponentPropsWithoutRef<"button">/);
  assert.match(components, /type = "button"/);
  assert.match(components, /disabled=\{disabled \|\| loading\}/);
  assert.match(components, /aria-busy=\{loading \|\| undefined\}/);
  assert.match(components, /data-loading=\{loading \? "true" : undefined\}/);
  assert.match(components, /return <button[\s\S]*?className=\{buttonClasses\(variant, pill, className\)\}/);
  assert.match(components, /export function GlassButtonLink[\s\S]*?return <Link \{\.\.\.rest\}/);
  assert.doesNotMatch(components, /href=["']#["']|onClick=\{\(\) => \{\}\}/);
});

test("SKU selection chips use native accessibility semantics", () => {
  assert.match(components, /export function GlassChip[\s\S]*?<button[\s\S]*?aria-pressed=\{selected\}/);
  assert.match(components, /data-selected=\{selected \? "true" : "false"\}/);
  assert.match(components, /export function GlassChipLink[\s\S]*?return <Link[\s\S]*?aria-current=\{selected \? "true" : rest\["aria-current"\]\}/);
  assert.match(components, /disabled=\{disabled\}/);
});

test("Unified G02 CSS supports all states and G01 motion without global overrides", () => {
  for (const selector of [
    ".fb-glass-header", ".fb-glass-media-frame", ".fb-glass-button",
    ".fb-glass-button--primary", ".fb-glass-button--secondary",
    ".fb-glass-button--ghost", ".fb-glass-button--pill",
    ".fb-glass-chip", '.fb-glass-chip[data-selected="true"]',
    ".fb-glass-button:focus-visible", ".fb-glass-chip:focus-visible",
    ".fb-glass-button:disabled", ".fb-glass-chip:disabled",
    '.fb-glass-button[data-loading="true"]'
  ]) assert.ok(css.includes(selector), selector);
  for (const token of [
    "--fb-control-height-compact", "--fb-control-height-touch",
    "--fb-control-radius", "--fb-control-font-size",
    "--fb-motion-button", "--fb-easing-open", "--fb-glass-shadow"
  ]) assert.ok(css.includes("var(" + token + ")"), token);
  assert.match(css, /@media \(max-width: 780px\)/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:button|a|article|section|header|body|html)\s*\{/m);
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:\.fb-admin|\.ref-|\.catalog-|\.dv-)/m);
  assert.doesNotMatch(css, /https?:\/\/|cloudflarestorage\.com/);
  assert.doesNotMatch(css, /--fb-(?:glass|motion-glass)-[\w-]+\s*:/);
  assert.ok(globals.includes("--fb-glass-surface:"));
});
