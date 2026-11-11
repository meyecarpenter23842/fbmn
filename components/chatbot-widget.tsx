"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {trackWebEvent} from "@/lib/analytics/web-client";

type ChatMessage = { id: number; author: "visitor" | "bot"; text: string; contact?: boolean };

const quickQuestions = ["Sản phẩm", "Dành cho đại lý", "Liên hệ"];
const welcomeMessage: ChatMessage = {
  id: 0,
  author: "bot",
  text: "Chào anh/chị! Futurebook Miền Nam hỗ trợ tra cứu sản phẩm, hợp tác đại lý và thông tin liên hệ.",
};

/** Decorative book mascot; real Dialogflow chat behavior remains unchanged. */
function BookMascot({ compact = false }: { compact?: boolean }) {
  return <span className={"fb-chat__mascot" + (compact ? " fb-chat__mascot--compact" : "")} aria-hidden="true">
    <span className="fb-chat__mascot-arm fb-chat__mascot-arm--left" />
    <span className="fb-chat__mascot-arm fb-chat__mascot-arm--right" />
    <span className="fb-chat__mascot-leg fb-chat__mascot-leg--left" />
    <span className="fb-chat__mascot-leg fb-chat__mascot-leg--right" />
    <span className="fb-chat__mascot-pages" />
    <span className="fb-chat__mascot-cover">
      <Image src="/brand/fbmn-transparent-logo.webp" width={300} height={84}
        className="fb-chat__mascot-logo" alt="" />
      <span className="fb-chat__mascot-face"><span className="fb-chat__mascot-eye"/><span className="fb-chat__mascot-eye"/></span>
      <span className="fb-chat__mascot-smile" />
    </span>
  </span>;
}

export function ChatbotWidget() {
  const pathname=usePathname();
  return pathname==="/policy"?null:<ChatbotConversation/>;
}

function ChatbotConversation() {
  const [open, setOpen] = useState(false);
  const [renderPanel, setRenderPanel] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [typing, setTyping] = useState(false);
  const pending = useRef(false);
  const nextId = useRef(1);
  const session = useRef<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const closingTimer = useRef<number | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const feed = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    if (closingTimer.current) window.clearTimeout(closingTimer.current);
    closingTimer.current = window.setTimeout(() => {
      setRenderPanel(false);
      closingTimer.current = null;
    }, 220);
    launcher.current?.focus();
  }, []);

  const show = () => {
    if (closingTimer.current) window.clearTimeout(closingTimer.current);
    closingTimer.current = null;
    setRenderPanel(true);
    setOpen(true);
    trackWebEvent("web_chat_open");
  };

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open && feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [open, typing, messages]);

  // Keep the chat composer above the mobile virtual keyboard (especially iOS Safari).
  useEffect(() => {
    if (!open || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const syncViewport = () => {
      const top = Math.max(0, viewport.offsetTop);
      const keyboard = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      panel.current?.style.setProperty("--fb-chat-visual-top", `${Math.round(top)}px`);
      panel.current?.style.setProperty("--fb-chat-visual-height", `${Math.round(viewport.height)}px`);
      // Inline the visible height as well: mobile browsers can retain a cached calc() height
      // when only the visual viewport changes while the layout viewport stays fixed.
      if (window.matchMedia("(max-width: 700px)").matches) {
        panel.current?.style.setProperty("height", `calc(${Math.round(viewport.height)}px - max(10px,env(safe-area-inset-top)) - max(10px,env(safe-area-inset-bottom)))`);
      } else {
        panel.current?.style.removeProperty("height");
      }
      panel.current?.style.setProperty("--fb-chat-keyboard-bottom", `${Math.round(keyboard)}px`);
    };
    syncViewport();
    viewport.addEventListener("resize", syncViewport);
    viewport.addEventListener("scroll", syncViewport);
    return () => {
      viewport.removeEventListener("resize", syncViewport);
      viewport.removeEventListener("scroll", syncViewport);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [open, close]);

  useEffect(() => () => {
    controller.current?.abort();
    if (closingTimer.current) window.clearTimeout(closingTimer.current);
  }, []);

  const submitMessage = async (raw: string) => {
    const text = raw.trim().slice(0, 300);
    if (!text || pending.current) return;
    pending.current = true;
    setDraft("");
    setMessages(current => [...current, { id: nextId.current++, author: "visitor", text }]);
    setTyping(true);

    const abort=new AbortController();
    controller.current=abort;
    session.current??=crypto.randomUUID();
    try{
      const response=await fetch("/api/chat",{method:"POST",cache:"no-store",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},signal:abort.signal,
        body:JSON.stringify({session:session.current,text})});
      const result=await response.json() as {ok?:boolean;text?:unknown};
      if(abort.signal.aborted)return;
      if(!response.ok||result.ok!==true||typeof result.text!=="string")
        throw Error(response.status===429?"rate":"unavailable");
      setMessages(current=>[...current,{id:nextId.current++,author:"bot",text:result.text as string}]);
    }catch(error){
      if(!abort.signal.aborted)setMessages(current=>[...current,{id:nextId.current++,author:"bot",
        text:error instanceof Error&&error.message==="rate"?"Bạn gửi tin nhắn hơi nhanh. Vui lòng thử lại sau ít phút.":"Chatbot hiện chưa kết nối hoặc tạm thời không phản hồi. Anh/chị có thể liên hệ Futurebook để được hỗ trợ.",contact:true}]);
    }finally{
      if(!abort.signal.aborted)setTyping(false);
      pending.current=false;controller.current=null;
    }
  };

  return (
    <div className="fb-chat" data-chatbot-mode="live">
      {renderPanel && (
        <section
          className="fb-chat__panel"
          ref={panel}
          data-state={open ? "open" : "closing"}
          aria-hidden={!open}
          inert={!open}
          role="dialog"
          aria-modal="false"
          aria-labelledby="fb-chat-title"
          aria-describedby="fb-chat-mode"
          id="fb-chat-panel"
        >
          <header className="fb-chat__header">
            <span className="fb-chat__head-avatar"><BookMascot compact /></span>
            <span className="fb-chat__heading">
              <strong id="fb-chat-title">Futurebook Miền Nam</strong>
              <small id="fb-chat-mode">Trợ lý Futurebook · Dialogflow CX</small>
            </span>
            <button type="button" className="fb-chat__close" onClick={close} aria-label="Đóng chatbot">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>
            </button>
          </header>
          <div className="fb-chat__feed" ref={feed} role="log" aria-label="Nội dung trò chuyện" aria-live="polite" aria-relevant="additions text">
            {messages.map(message => (
              <div key={message.id} className={"fb-chat__message fb-chat__message--" + message.author}>
                {message.author === "bot" && <span className="fb-chat__mini-avatar"><span className="fb-chat__mini-book" aria-hidden="true" /></span>}
                <div className="fb-chat__bubble">
                  <p>{message.text}</p>
                  {message.contact && <Link href="/lien-he" onClick={close}>Liên hệ Futurebook <span aria-hidden="true">→</span></Link>}
                </div>
              </div>
            ))}
            {typing && (
              <div className="fb-chat__message fb-chat__message--bot">
                <span className="fb-chat__mini-avatar"><span className="fb-chat__mini-book" aria-hidden="true" /></span>
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
          <p className="fb-chat__notice">Tin nhắn được gửi tới Google Dialogflow CX để trả lời. Không nhập mật khẩu, giá NET hoặc thông tin cá nhân. Futurebook lưu nội dung trò chuyện để hỗ trợ khách hàng.</p>
        </section>
      )}
      <button
        ref={launcher}
        className={"fb-chat__launcher" + (open ? " fb-chat__launcher--active" : "")}
        type="button"
        aria-label={open ? "Đóng chat Futurebook" : "Mở chat Futurebook"}
        aria-expanded={open}
        aria-controls="fb-chat-panel"
        onClick={() => { if (open) close(); else show(); }}
      >
        <BookMascot />
      </button>
    </div>
  );
}
