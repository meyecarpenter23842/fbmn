import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("chatbot has a branded animated book mascot rather than a round avatar", () => {
  const code = read("components/chatbot-widget.tsx"), css = read("app/chatbot.css");
  const layout = read("app/layout.tsx");
  const image = readFileSync(new URL("../public/brand/fbmn-transparent-logo.webp", import.meta.url));
  assert.ok(image.byteLength > 1000);
  assert.match(code, /function BookMascot/);
  assert.match(code, /fbmn-transparent-logo\.webp/);
  assert.doesNotMatch(code, /fbmn-chatbot-avatar\.webp/);
  assert.match(layout, /<ChatbotWidget\s*\/>/);
  assert.match(css, /\.fb-chat__launcher\s*\{[\s\S]*?width:96px; height:106px;/);
  assert.match(css, /@keyframes fb-chat-float/);
  assert.match(css, /@keyframes fb-chat-blink/);
  assert.match(css, /@media \(max-width:\s*700px\)/);
  assert.match(css, /\.fb-chat__launcher\s*\{\s*width:76px; height:94px/);
  assert.match(css, /\.fb-chat__launcher \.fb-chat__mascot\s*\{[\s\S]*?scale:\.8/);
  assert.match(css, /\.fb-glass-site:has\(\.fb-song-mobile-cta\) \.fb-chat/);
});
test("widget has real pending state and accessible close", () => {
  const code=read("components/chatbot-widget.tsx");
  assert.match(code, /setTyping\(true\)/);
  assert.match(code, /fetch\("\/api\/chat"/);
  assert.match(code, /fb-chat__typing/);
  assert.match(code, /aria-label="Bot đang nhập tin nhắn"/);
  assert.match(code, /aria-label="Đóng chatbot"/);
  assert.match(code, /event\.key === "Escape"/);
  assert.match(code, /aria-expanded=\{open\}/);
  assert.match(read("app/chatbot.css"), /prefers-reduced-motion/);
});
test("DL10B widget calls same-origin backend and never embeds credentials",()=>{
 const code=read("components/chatbot-widget.tsx");
 assert.match(code,/data-chatbot-mode="live"/);
 assert.match(code,/Google Dialogflow CX/);
 assert.match(code,/fetch\("\/api\/chat"/);
 assert.doesNotMatch(code,/getDemoChatbotReply|localStorage|sessionStorage|Authorization:|private_key/);
 assert.match(code,/tạm thời không phản hồi/);
});
test("app invitation anchors near the header, away from chatbot touch targets", () => {
  const styles=read("app/app-download.css");
  assert.match(styles, /\.app-download\s*\{[^}]*top:\s*96px/);
  assert.match(styles, /@media \(max-width: 800px\)[\s\S]*?\.app-download\s*\{[^}]*top:\s*calc\(78px \+ env\(safe-area-inset-top\)\)/);
  assert.doesNotMatch(styles, /bottom:\s*86px/);
});

test("chat input stays focusable while typing and the popup fits short screens", () => {
  const widget = read("components/chatbot-widget.tsx");
  const downloadCss = read("app/app-download.css");
  assert.match(widget, /readOnly=\{typing\}/);
  assert.doesNotMatch(widget, /onChange=\{event => setDraft\(event.target.value\)\}\s+disabled=\{typing\}/);
  assert.match(downloadCss, /max-height: calc\(100dvh - 112px\)/);
  assert.match(downloadCss, /max-height: calc\(100dvh - 94px - env\(safe-area-inset-top\)\)/);
});

test("book chatbot respects motion, close timing and existing Dialogflow session",()=>{
  const code=read("components/chatbot-widget.tsx"),css=read("app/chatbot.css");
  assert.match(code,/setRenderPanel\(false\)/);
  assert.match(code,/\}, 220\)/);
  assert.match(code,/inert=\{!open\}/);
  assert.match(code,/aria-hidden=\{!open\}/);
  assert.match(code,/session\.current\?\?=crypto\.randomUUID\(\)/);
  assert.match(css,/fb-chat-close 220ms/);
  assert.match(css, /\.fb-chat__header\s*\{[^}]*min-height:52px; height:52px/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.fb-chat__header\s*\{[^}]*min-height:56px; height:56px/);
  assert.match(css,/fb-chat-open 280ms/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});

test("mobile chat sheet fits the visual viewport and keeps the input beside its send button", () => {
  const widget = read("components/chatbot-widget.tsx");
  const css = read("app/chatbot.css");
  assert.match(css, /\.fb-chat__panel\s*\{[\s\S]*?position:fixed; z-index:2; left:12px; right:12px/);
  assert.match(css, /\.fb-chat__composer\s*\{[\s\S]*?grid-template-columns:minmax\(0,1fr\) 44px/);
  assert.match(css, /\.fb-chat__composer input\s*\{[^}]*font-size:16px/);
  assert.match(css, /--fb-chat-keyboard-bottom/);
  assert.match(widget, /window\.visualViewport/);
  assert.match(widget, /viewport\.addEventListener\("resize", syncViewport\)/);
  assert.match(widget, /ref=\{panel\}/);
  assert.doesNotMatch(css, /scale:\.56/);
});
