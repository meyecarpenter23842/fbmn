"use client";
import {useEffect,useRef,useState} from "react";
import type {CSSProperties} from "react";
import {createPortal} from "react-dom";

export type AdminToastVariant="success"|"error"|"info";
const EXIT_MS=190;

/** Single Admin notification primitive, including the modal-safe focus-trap host. */
export default function AdminToast({message,onClose,duration=4800,variant="success",notificationId}:{
  message:string;onClose:()=>void;duration?:number;variant?:AdminToastVariant;notificationId?:number;
}){
  const anchor=useRef<HTMLSpanElement>(null);
  const onCloseRef=useRef(onClose);
  const [host,setHost]=useState<HTMLElement|null>(null);
  const [closing,setClosing]=useState<{message:string;notificationId?:number}|null>(null);
  const exiting=Boolean(message&&closing?.message===message&&closing?.notificationId===notificationId);
  const lifespan=Math.max(1000,duration);
  useEffect(()=>{onCloseRef.current=onClose;},[onClose]);
  useEffect(()=>{
    // Toast controls inside a dialog must remain inside its keyboard focus trap.
    const modalHost=anchor.current?.closest(".fb-product-modal")
      ?.querySelector<HTMLElement>(".fb-product-modal-toast-stack");
    const sharedHost=modalHost||document.getElementById("fb-admin-toast-root");
    let active=true;
    void Promise.resolve().then(()=>{if(active)setHost(sharedHost);});
    return ()=>{active=false;};
  },[]);
  useEffect(()=>{
    // Privacy: only a generic failure event, never the displayed message.
    if(message&&variant==="error")window.dispatchEvent(new Event("fbmn-admin-operation-error"));
  },[message,variant]);
  useEffect(()=>{
    // Re-arm on every notification identity, including repeated identical text.
    // A cleared/replaced message also cancels any exit currently in flight.
    let active=true;
    void Promise.resolve().then(()=>{if(active)setClosing(null);});
    if(!message)return ()=>{active=false;};
    const timer=window.setTimeout(()=>setClosing({message,notificationId}),lifespan);
    return ()=>{active=false;window.clearTimeout(timer);};
  },[message,notificationId,lifespan]);
  useEffect(()=>{
    if(!exiting)return;
    const timer=window.setTimeout(()=>{setClosing(null);onCloseRef.current();},EXIT_MS);
    return ()=>window.clearTimeout(timer);
  },[exiting]);
  const content=message?<div
    className={"fb-toast-slot"+(exiting?" fb-toast-slot--exiting":"")}
    style={{"--fb-toast-lifespan":String(lifespan)+"ms"} as CSSProperties}>
    <div className={"catalogue-toast catalogue-toast--"+variant+(exiting?" catalogue-toast--exiting":"")}
      role={variant==="error"?"alert":"status"}
      aria-live={variant==="error"?"assertive":"polite"} aria-atomic="true">
      <span className="catalogue-toast-icon" aria-hidden="true">
        {variant==="success"?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.1 2.3 2.3 4.8-5.1"/></svg>:
          variant==="error"?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v6"/><path d="M12 17h.01" strokeWidth="2.6"/></svg>:
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 10.5v6"/><path d="M12 7.5h.01" strokeWidth="2.6"/></svg>}
      </span>
      <span className="catalogue-toast-text">{message}</span>
      <button type="button" className="catalogue-toast-close"
        onClick={()=>setClosing({message,notificationId})} aria-label="Đóng thông báo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18"/></svg>
      </button>
      <span key={notificationId??message} className="catalogue-toast-progress" aria-hidden="true"/>
    </div>
  </div>:null;
  return <>
    <span ref={anchor} className="catalogue-toast-anchor" aria-hidden="true"/>
    {host&&content?createPortal(content,host):null}
  </>;
}
