"use client";
import {useEffect,useId,useRef} from "react";
import type {ReactNode} from "react";
import {createPortal} from "react-dom";

export default function ProductModal({title,onClose,children,wide=false,locked=false}:{
  title:string;onClose:()=>void;children:ReactNode;wide?:boolean;locked?:boolean
}){
  const titleId=useId();
  const dialog=useRef<HTMLDivElement>(null);
  const onCloseRef=useRef(onClose);
  const lockedRef=useRef(locked);
  useEffect(()=>{onCloseRef.current=onClose},[onClose]);
  useEffect(()=>{lockedRef.current=locked},[locked]);
  useEffect(()=>{
    const restore=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const focus=window.setTimeout(()=>dialog.current?.querySelector<HTMLElement>(
      "input:not([disabled]),button:not([disabled]),select:not([disabled]),[tabindex='0']"
    )?.focus(),0);
    function keydown(event:KeyboardEvent){
      if(event.key==="Escape"){event.preventDefault();if(!lockedRef.current)onCloseRef.current();return;}
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
    return ()=>{window.clearTimeout(focus);document.removeEventListener("keydown",keydown);
      document.body.style.overflow=previous;restore?.focus();}
  },[]);
  return createPortal(<div className="fb-product-modal-overlay"
    onMouseDown={e=>{if(e.target===e.currentTarget&&!locked)onClose();}}>
    <div ref={dialog} className={"fb-product-modal"+(wide?" fb-product-modal-wide":"")}
      role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
      <header className="fb-product-modal-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" aria-label="Đóng popup" onClick={onClose} disabled={locked}
          className="fb-product-modal-close">×</button>
      </header>
      <div className="fb-product-modal-content">{children}</div>
      <div className="fb-product-modal-toast-stack" aria-label="Thông báo thao tác"/>
    </div>
  </div>,document.body);
}
