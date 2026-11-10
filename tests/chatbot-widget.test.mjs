import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getDemoChatbotReply } from "../lib/chatbot/demo-replies.ts";
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
test("widget has typing state, delayed bot response and accessible close", () => {
  const code=read("components/chatbot-widget.tsx");
  assert.match(code, /setTyping\(true\)/);
  assert.match(code, /window\.setTimeout/);
  assert.match(code, /fb-chat__typing/);
  assert.match(code, /aria-label="Bot đang nhập tin nhắn"/);
  assert.match(code, /aria-label="Đóng chatbot"/);
  assert.match(code, /event\.key === "Escape"/);
  assert.match(code, /aria-expanded=\{open\}/);
  assert.match(read("app/chatbot.css"), /prefers-reduced-motion/);
});
test("demo is fully local, doesn't invent backend access or leak user messages", () => {
  const code=read("components/chatbot-widget.tsx");
  const replySource=read("lib/chatbot/demo-replies.ts");
  assert.match(code, /data-chatbot-mode="demo"/);
  assert.match(code, /Hỗ trợ nhanh · Câu trả lời soạn sẵn/);
  assert.match(code, /không gửi lên máy chủ/);
  assert.doesNotMatch(code+replySource, /fetch\s*\(|localStorage|sessionStorage|Authorization:/);
  assert.equal(getDemoChatbotReply("Sản phẩm").href,"/san-pham");
  assert.equal(getDemoChatbotReply("Dành cho đại lý").href,"/dai-ly");
  assert.equal(getDemoChatbotReply("Liên hệ").href,"/lien-he");
  assert.match(getDemoChatbotReply("Một câu hỏi chưa có dữ liệu").text, /chưa có trong phần hỗ trợ nhanh/);
});
test("app invitation anchors near the header, away from chatbot touch targets", () => {
  const styles=read("app/app-download.css");
  assert.match(styles, /\.app-download\s*\{[^}]*top:\s*116px/);
  assert.match(styles, /@media \(max-width: 800px\)[\s\S]*?\.app-download\s*\{[^}]*top:\s*calc\(78px \+ env\(safe-area-inset-top\)\)/);
  assert.doesNotMatch(styles, /bottom:\s*86px/);
});

test("chat input stays focusable while typing and the popup fits short screens", () => {
  const widget = read("components/chatbot-widget.tsx");
  const downloadCss = read("app/app-download.css");
  assert.match(widget, /readOnly=\{typing\}/);
  assert.doesNotMatch(widget, /onChange=\{event => setDraft\(event.target.value\)\}\s+disabled=\{typing\}/);
  assert.match(downloadCss, /max-height: calc\(100dvh - 132px\)/);
  assert.match(downloadCss, /max-height: calc\(100dvh - 94px - env\(safe-area-inset-top\)\)/);
});
