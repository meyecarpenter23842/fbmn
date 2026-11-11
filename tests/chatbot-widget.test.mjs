import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("chatbot uses user-supplied FBMN image with compact floating launcher", () => {
  const code = read("components/chatbot-widget.tsx"), css = read("app/chatbot.css");
  const layout = read("app/layout.tsx");
  const image = readFileSync(new URL("../public/brand/fbmn-chatbot-avatar.webp", import.meta.url));
  assert.ok(image.byteLength > 1000);
  assert.match(code, /fbmn-chatbot-avatar\.webp/);
  assert.match(layout, /<ChatbotWidget\s*\/>/);
  assert.match(css, /\.fb-chat__launcher\s*\{[^}]*width:\s*56px;\s*height:\s*56px/s);
  assert.match(css, /\.fb-chat__panel\s*\{/);
  assert.match(css, /@media \(max-width:\s*700px\)/);
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
