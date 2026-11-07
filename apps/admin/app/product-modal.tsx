"use client";
import {createContext,useContext,useEffect,useId,useRef,useState} from "react";
import type {ReactNode} from "react";
import {createPortal} from "react-dom";

const ModalCloseContext=createContext<()=>void>(()=>{});
export function useProductModalClose(){return useContext(ModalCloseContext);}

export default function ProductModal({title,onClose,beforeClose,children,footer,wide=false,locked=false}:{
  title:string;onClose:()=>void;beforeClose?:()=>boolean;children:ReactNode;footer?:ReactNode;wide?:boolean;locked?:boolean
}){
  const titleId=useId();
  const dialog=useRef<HTMLDivElement>(null);
  const onCloseRef=useRef(onClose);
  const lockedRef=useRef(locked);
  const beforeCloseRef=useRef(beforeClose);
  const [exiting,setExiting]=useState(false);
  const exitingRef=useRef(false);
  const exitTimer=useRef<number|null>(null);
  const requestCloseRef=useRef<()=>void>(()=>{});
  const requestClose=()=>{
    if(lockedRef.current||exitingRef.current||beforeCloseRef.current?.()===false)return;
    exitingRef.current=true;setExiting(true);
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){onCloseRef.current();return;}
    exitTimer.current=window.setTimeout(()=>onCloseRef.current(),220);
  };
  useEffect(()=>{requestCloseRef.current=requestClose;});
  useEffect(()=>{onCloseRef.current=onClose},[onClose]);
  useEffect(()=>{lockedRef.current=locked},[locked]);
  useEffect(()=>{beforeCloseRef.current=beforeClose},[beforeClose]);
  useEffect(()=>{
    const restore=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const focus=window.setTimeout(()=>dialog.current?.querySelector<HTMLElement>(
      "input:not([disabled]),button:not([disabled]),select:not([disabled]),[tabindex='0']"
    )?.focus(),0);
    function keydown(event:KeyboardEvent){
      if(event.key==="Escape"){event.preventDefault();requestCloseRef.current();return;}
      if(event.key!=="Tab")return;
      const nodes=Array.from(dialog.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]'
      )||[]).filter(el=>el.getClientRects().length>0);
      if(!nodes.length)return;
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    document.addEventListener("keydown",keydown);
    return ()=>{window.clearTimeout(focus);if(exitTimer.current!==null)window.clearTimeout(exitTimer.current);document.removeEventListener("keydown",keydown);
      document.body.style.overflow=previous;restore?.focus();}
  },[]);
  return createPortal(<div className={"fb-product-modal-overlay"+(exiting?" fb-modal-exiting":"")}
    onMouseDown={e=>{if(e.target===e.currentTarget)requestClose();}}>
    <div ref={dialog} className={"fb-product-modal"+(wide?" fb-product-modal-wide":"")}
      role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
      <header className="fb-product-modal-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" aria-label="Đóng popup" onClick={requestClose} disabled={locked||exiting}
          className="fb-product-modal-close">×</button>
      </header>
      <ModalCloseContext.Provider value={requestClose}>
        <div className="fb-product-modal-content">{children}</div>
        {footer&&<footer className="fb-product-modal-footer">{footer}</footer>}
        <div className="fb-product-modal-toast-stack" aria-label="Thông báo thao tác"/>
      </ModalCloseContext.Provider>
    </div>
  </div>,document.body);
}
