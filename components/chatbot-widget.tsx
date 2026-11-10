"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getDemoChatbotReply } from "@/lib/chatbot/demo-replies";
import type { ChatbotReply } from "@/lib/chatbot/demo-replies";

type ChatMessage = { id: number; author: "visitor" | "bot"; text: string; reply?: ChatbotReply };

const quickQuestions = ["Sản phẩm", "Dành cho đại lý", "Liên hệ"];
const welcomeMessage: ChatMessage = {
  id: 0,
  author: "bot",
  text: "Chào anh/chị! Futurebook Miền Nam hỗ trợ tra cứu sản phẩm, hợp tác đại lý và thông tin liên hệ.",
};

function Avatar({ small = false }: { small?: boolean }) {
  return <Image
    src="/brand/fbmn-chatbot-avatar.webp"
    width={small ? 30 : 40}
    height={small ? 30 : 40}
    alt=""
    className="fb-chat__avatar"
    aria-hidden="true"
  />;
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [typing, setTyping] = useState(false);
  const pending = useRef(false);
  const nextId = useRef(1);
  const timer = useRef<number | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const feed = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open && feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [open, typing, messages]);

  useEffect(() => {
    if (!open) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcher.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [open]);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const submitMessage = (raw: string) => {
    const text = raw.trim().slice(0, 300);
    if (!text || pending.current) return;
    pending.current = true;
    setDraft("");
    setMessages(current => [...current, { id: nextId.current++, author: "visitor", text }]);
    setTyping(true);

    // Demo only: local, curated answer. A future server-side Dialogflow CX
    // adapter replaces the reply provider, not the widget or chat protocol.
    const reply = getDemoChatbotReply(text);
    const delay = Math.min(1600, Math.max(850, 650 + text.length * 14));
    timer.current = window.setTimeout(() => {
      setMessages(current => [...current, {
        id: nextId.current++, author: "bot", text: reply.text, reply,
      }]);
      setTyping(false);
      pending.current = false;
      timer.current = null;
    }, delay);
  };

  const close = () => {
    setOpen(false);
    launcher.current?.focus();
  };

  return (
    <div className="fb-chat" data-chatbot-mode="demo">
      {open && (
        <section
          className="fb-chat__panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="fb-chat-title"
          aria-describedby="fb-chat-mode"
          id="fb-chat-panel"
        >
          <header className="fb-chat__header">
            <span className="fb-chat__head-avatar"><Avatar small /></span>
            <span className="fb-chat__heading">
              <strong id="fb-chat-title">Futurebook Miền Nam</strong>
              <small id="fb-chat-mode">Hỗ trợ nhanh · Câu trả lời soạn sẵn</small>
            </span>
            <button type="button" className="fb-chat__close" onClick={close} aria-label="Đóng chatbot">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>
            </button>
          </header>
          <div className="fb-chat__feed" ref={feed} role="log" aria-label="Nội dung trò chuyện" aria-live="polite" aria-relevant="additions text">
            {messages.map(message => (
              <div key={message.id} className={"fb-chat__message fb-chat__message--" + message.author}>
                {message.author === "bot" && <span className="fb-chat__mini-avatar"><Avatar small /></span>}
                <div className="fb-chat__bubble">
                  <p>{message.text}</p>
                  {message.reply?.href && <Link href={message.reply.href} onClick={close}>{message.reply.actionLabel} <span aria-hidden="true">→</span></Link>}
                </div>
              </div>
            ))}
            {typing && (
              <div className="fb-chat__message fb-chat__message--bot">
                <span className="fb-chat__mini-avatar"><Avatar small /></span>
                <div className="fb-chat__typing" role="status" aria-label="Bot đang nhập tin nhắn">
                  <span aria-hidden="true"/><span aria-hidden="true"/><span aria-hidden="true"/>
                  <span className="fb-chat__sr-only">Bot đang nhập…</span>
                </div>
              </div>
            )}
          </div>
          <div className="fb-chat__quick" aria-label="Câu hỏi gợi ý">
            {quickQuestions.map(question => (
              <button key={question} type="button" onClick={() => submitMessage(question)} disabled={typing}>{question}</button>
            ))}
          </div>
          <form className="fb-chat__composer" onSubmit={event => { event.preventDefault(); submitMessage(draft); }}>
            <label className="fb-chat__sr-only" htmlFor="fb-chat-input">Nhập tin nhắn</label>
            <input id="fb-chat-input" ref={input} autoComplete="off" placeholder="Nhập tin nhắn..." maxLength={300} value={draft} onChange={event => setDraft(event.target.value)} readOnly={typing} />
            <button type="submit" disabled={!draft.trim() || typing} aria-label="Gửi tin nhắn">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 11 18-8-8 18-3-8-7-2zM10 13l11-10"/></svg>
            </button>
          </form>
          <p className="fb-chat__notice">Tin nhắn chỉ ở phiên trang này, không gửi lên máy chủ. Hỗ trợ theo câu trả lời soạn sẵn.</p>
        </section>
      )}
      <button
        ref={launcher}
        className="fb-chat__launcher"
        type="button"
        aria-label={open ? "Đóng chat Futurebook" : "Mở chat Futurebook"}
        aria-expanded={open}
        aria-controls="fb-chat-panel"
        onClick={() => open ? close() : setOpen(true)}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>
        ) : <Avatar />}
      </button>
    </div>
  );
}
