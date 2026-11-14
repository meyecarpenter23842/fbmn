"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {usePathname} from "next/navigation";
import { getAppStoreLink,parseAppDownloadConfig,type AppDownloadConfig } from "@/lib/app-download/config";
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
    // CH Play/Google Play mark: four distinctive coloured facets, not the
    // Android robot. Vector only; no external asset or guessed store URL.
    <svg viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="Google Play">
      <path fill="#32B6E9" d="M3.5 2.3c-.35.26-.55.73-.55 1.38v16.65c0 .65.2 1.1.55 1.37l9.05-9.7L3.5 2.3Z"/>
      <path fill="#45CF80" d="M3.5 2.3 14.9 8.8 12.55 12 3.5 2.3Z"/>
      <path fill="#FFCE40" d="m14.9 8.8 5.42 3.1c.63.36.63.77 0 1.13l-5.42 3.1L12.55 12l2.35-3.2Z"/>
      <path fill="#F35B66" d="M3.5 21.7 12.55 12l2.35 4.13L3.5 21.7Z"/>
    </svg>
  );
}

function AppStoreOption({ platform,settings }: { platform: "ios" | "android";settings:AppDownloadConfig|null }) {
  const url = getAppStoreLink(platform,settings);
  const label = platform === "ios" ? "iOS" : "CH Play";
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

function readLastShown(memory: number,intervalMs=APP_PROMPT_INTERVAL_MS): number | null {
  try {
    const raw = window.localStorage.getItem(APP_PROMPT_STORAGE_KEY);
    const stamp = raw === null ? memory : Number(raw);
    return Number.isSafeInteger(stamp) && stamp > 0 && stamp <= Date.now() + intervalMs ? stamp : null;
  } catch {
    return memory > 0 ? memory : null;
  }
}

export function AppDownloadProvider({ children }: { children: ReactNode }) {
  const pathname=usePathname();
  const [settings,setSettings]=useState<AppDownloadConfig|null>(null);
  const isCatalogue=pathname==="/catalogue";
  const isPolicy=pathname==="/policy";
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [source, setSource] = useState<PopupSource>("automatic");
  const lastShownInMemory = useRef(0);
  const returnFocus = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const configRefreshing = useRef(false);
  // Fetch a fresh public setting on route/visibility change so Admin edits take
  // effect without redeploy. Missing API fails closed, never shows an unmanaged popup.
  useEffect(()=>{
    let latest=0;
    let activeRequest:AbortController|null=null;
    const refresh=async()=>{
      // A new visibility/route refresh supersedes every older request.
      // Out-of-order responses may never re-enable an Owner-disabled popup.
      activeRequest?.abort();
      const controller=new AbortController();
      activeRequest=controller;
      const generation=++latest;
      configRefreshing.current=true;
      try{
        const response=await fetch("/api/app-download",{cache:"no-store",signal:controller.signal});
        if(!response.ok)throw Error("config_unavailable");
        const body=await response.json() as {data?:unknown};
        const parsed=parseAppDownloadConfig(body.data);
        if(!parsed)throw Error("invalid_config");
        if(generation===latest&&!controller.signal.aborted)setSettings(parsed);
      }catch{
        if(generation===latest&&!controller.signal.aborted)setSettings(null);
      }finally{
        if(generation===latest&&!controller.signal.aborted)configRefreshing.current=false;
      }
    };
    void refresh();
    const visible=()=>{if(document.visibilityState==="visible")void refresh();};
    document.addEventListener("visibilitychange",visible);
    return ()=>{
      latest++;
      activeRequest?.abort();
      configRefreshing.current=false;
      document.removeEventListener("visibilitychange",visible);
    };
  },[pathname]);

  const showPopup = useCallback((kind: PopupSource) => {
    if(configRefreshing.current)return;
    if(!settings || (kind==="automatic"&&!settings.popupEnabled) ||
       (kind==="menu"&&!settings.buttonEnabled))return;
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
    if(dismissTimeout.current)clearTimeout(dismissTimeout.current);
    dismissTimeout.current=null;
    setClosing(false);
    setSource(kind);
    setOpen(true);
  }, [settings]);

  const dismiss = useCallback(() => {
    if(dismissTimeout.current)return;
    setClosing(true);
    // Keep the popover mounted throughout the shared 220ms exit transition.
    dismissTimeout.current=setTimeout(()=>{
      dismissTimeout.current=null;
      setOpen(false);
      setClosing(false);
      const trigger=returnFocus.current;
      returnFocus.current=null;
      if(trigger?.isConnected)trigger.focus();
    },220);
  }, []);

  useEffect(()=>()=>{if(dismissTimeout.current)clearTimeout(dismissTimeout.current);},[]);

  useEffect(() => {
    if((isCatalogue||isPolicy||!settings?.popupEnabled)&&open&&source==="automatic")dismiss();
    if((isPolicy||!settings?.buttonEnabled)&&open&&source==="menu")dismiss();
  },[isCatalogue,isPolicy,open,source,dismiss,settings]);

  useEffect(() => {
    if (open||isCatalogue||isPolicy||!settings?.popupEnabled) return;
    let timeout: number | undefined;
    const schedule = () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      if (document.visibilityState === "hidden" || configRefreshing.current) return;
      const now = Date.now();
      const saved = readLastShown(lastShownInMemory.current,settings.cooldownMinutes*60_000);
      const delay = getNextAutoPromptDelay(now, saved,settings.firstDelayMs,settings.cooldownMinutes*60_000);
      timeout = window.setTimeout(() => {
        if (document.visibilityState === "hidden" || configRefreshing.current) return;
        const updated = readLastShown(lastShownInMemory.current,settings.cooldownMinutes*60_000);
        if (updated !== null && getNextAutoPromptDelay(Date.now(), updated,settings.firstDelayMs,settings.cooldownMinutes*60_000) > 0) {
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
  }, [open, showPopup, isCatalogue, isPolicy, settings]);

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
    <DownloadContext.Provider value={settings?.buttonEnabled?()=>showPopup("menu"):null}>
      {children}
      {open && !isPolicy && (
        <aside className={"app-download" + (closing ? " app-download--closing" : "")} role="dialog" aria-modal="false" aria-labelledby="app-download-heading" aria-describedby="app-download-subheading">
          <div className="app-download__head">
            <span className="app-download__glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18h3"/>
              </svg>
            </span>
            <span className="app-download__heading">
              <strong id="app-download-heading">{settings?.title??"Ứng dụng Futurebook"}</strong>
              <small id="app-download-subheading">iOS và CH Play</small>
            </span>
            <button type="button" className="app-download__close" ref={closeButton} onClick={dismiss} aria-label="Đóng thông báo tải ứng dụng">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
            </button>
          </div>
          <div className="app-download__stores">
            <AppStoreOption platform="ios" settings={settings} />
            <AppStoreOption platform="android" settings={settings} />
          </div>
          <p className="app-download__note">{settings?.message??"Ứng dụng chưa phát hành. Đường dẫn tải sẽ cập nhật khi có bản chính thức."}</p>
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
      <span>Tải ứng dụng</span><span className="app-download__trigger-platforms" aria-hidden="true"><AppStoreIcon platform="ios"/><AppStoreIcon platform="android"/></span>
    </button>
  );
}
