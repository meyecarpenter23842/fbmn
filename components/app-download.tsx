"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { getAppStoreLink } from "@/lib/app-download/config";
import {
  APP_PROMPT_INTERVAL_MS,
  APP_PROMPT_STORAGE_KEY,
  getNextAutoPromptDelay,
} from "@/lib/app-download/schedule";

type PopupSource = "automatic" | "menu";
const DownloadContext = createContext<(() => void) | null>(null);

function AppStoreIcon({ platform }: { platform: "ios" | "android" }) {
  // Platform brand silhouettes from Simple Icons (simple-icons/simple-icons).
  // Apple® and Android™ are trademarks of their respective owners.
  return platform === "ios" ? (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z" />
    </svg>
  );
}

function AppStoreOption({ platform }: { platform: "ios" | "android" }) {
  const url = getAppStoreLink(platform);
  const label = platform === "ios" ? "iOS" : "Android";
  const content = (
    <>
      <span className={"app-download__store-icon app-download__store-icon--" + platform}><AppStoreIcon platform={platform} /></span>
      <span className="app-download__store-copy">
        <strong>{label}</strong>
        <small>{url ? "Xem cửa hàng ứng dụng" : "Link đang cập nhật"}</small>
      </span>
      {!url && <span className="app-download__soon">Sắp có</span>}
    </>
  );
  return url ? (
    <a className="app-download__store" href={url} target="_blank" rel="noopener noreferrer" aria-label={"Tải ứng dụng Futurebook cho " + label}>{content}</a>
  ) : (
    <div className="app-download__store app-download__store--unavailable" aria-disabled="true" aria-label={label + " — chưa có đường dẫn tải"}>
      {content}
    </div>
  );
}

function readLastShown(memory: number): number | null {
  try {
    const raw = window.localStorage.getItem(APP_PROMPT_STORAGE_KEY);
    const stamp = raw === null ? memory : Number(raw);
    return Number.isSafeInteger(stamp) && stamp > 0 && stamp <= Date.now() + APP_PROMPT_INTERVAL_MS ? stamp : null;
  } catch {
    return memory > 0 ? memory : null;
  }
}

export function AppDownloadProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<PopupSource>("automatic");
  const lastShownInMemory = useRef(0);
  const returnFocus = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const showPopup = useCallback((kind: PopupSource) => {
    if (kind === "menu") {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    } else {
      returnFocus.current = null;
    }
    const now = Date.now();
    lastShownInMemory.current = now;
    try {
      window.localStorage.setItem(APP_PROMPT_STORAGE_KEY, String(now));
    } catch {
      // Storage can be unavailable in private browsing. In-memory cooldown still applies.
    }
    setSource(kind);
    setOpen(true);
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    const trigger = returnFocus.current;
    returnFocus.current = null;
    if (trigger?.isConnected) {
      window.requestAnimationFrame(() => trigger.focus());
    }
  }, []);

  useEffect(() => {
    if (open) return;
    let timeout: number | undefined;
    const schedule = () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      const saved = readLastShown(lastShownInMemory.current);
      const delay = getNextAutoPromptDelay(now, saved);
      timeout = window.setTimeout(() => {
        if (document.visibilityState === "hidden") return;
        const updated = readLastShown(lastShownInMemory.current);
        if (updated !== null && getNextAutoPromptDelay(Date.now(), updated) > 0) {
          schedule();
          return;
        }
        showPopup("automatic");
      }, delay);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === APP_PROMPT_STORAGE_KEY || event.key === null) schedule();
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    window.addEventListener("storage", onStorage);
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", schedule);
      window.removeEventListener("storage", onStorage);
    };
  }, [open, showPopup]);

  useEffect(() => {
    if (!open) return;
    if (source === "menu") closeButton.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open, source, dismiss]);

  return (
    <DownloadContext.Provider value={() => showPopup("menu")}>
      {children}
      {open && (
        <aside className="app-download" role="dialog" aria-modal="false" aria-labelledby="app-download-heading" aria-describedby="app-download-subheading">
          <div className="app-download__head">
            <span className="app-download__glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18h3"/>
              </svg>
            </span>
            <span className="app-download__heading">
              <strong id="app-download-heading">Futurebook trên điện thoại</strong>
              <small id="app-download-subheading">Chọn hệ điều hành để tải ứng dụng</small>
            </span>
            <button type="button" className="app-download__close" ref={closeButton} onClick={dismiss} aria-label="Đóng thông báo tải ứng dụng">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
            </button>
          </div>
          <div className="app-download__stores">
            <AppStoreOption platform="ios" />
            <AppStoreOption platform="android" />
          </div>
          <p className="app-download__note">Đường dẫn App Store và Google Play sẽ được cập nhật khi ứng dụng phát hành.</p>
          {source === "automatic" && <button className="app-download__later" type="button" onClick={dismiss}>Để sau</button>}
        </aside>
      )}
    </DownloadContext.Provider>
  );
}

export function AppDownloadMenuButton({ onOpen }: { onOpen?: () => void }) {
  const openDownload = useContext(DownloadContext);
  if (!openDownload) return null;
  return (
    <button
      className="ref-navigation__download"
      type="button"
      aria-haspopup="dialog"
      onClick={() => { onOpen?.(); openDownload(); }}
    >
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4.5" y="2" width="15" height="20" rx="3"/>
        <path d="M12 6v9m-3-3 3 3 3-3M10 19h4"/>
      </svg>
      <span>Tải app</span>
    </button>
  );
}
