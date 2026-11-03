"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";

export type AdminToastVariant="success"|"error"|"info";
/** Transient action feedback, stacked within the owning modal without covering other toasts. */
export default function AdminToast({message,onClose,duration=4800,variant="success"}:{
  message:string;onClose:()=>void;duration?:number;variant?:AdminToastVariant;
}){
  const anchor=useRef<HTMLSpanElement>(null);
  const [target,setTarget]=useState<{host:HTMLElement|null}|null>(null);
  useEffect(()=>{
    // Keep notifications inside the modal focus trap for keyboard accessibility.
    const host=anchor.current?.closest(".fb-product-modal")
      ?.querySelector<HTMLElement>(".fb-product-modal-toast-stack")||null;
    let active=true;
    void Promise.resolve().then(()=>{if(active)setTarget({host});});
    return ()=>{active=false;};
  },[]);
  useEffect(()=>{
    if(!message)return;
    const timer=window.setTimeout(onClose,duration);
    return ()=>window.clearTimeout(timer);
  },[message,onClose,duration]);
  const content=message?<div className={"catalogue-toast catalogue-toast--"+variant}
    role={variant==="error"?"alert":"status"}
    aria-live={variant==="error"?"assertive":"polite"} aria-atomic="true">
    <span className="catalogue-toast-icon" aria-hidden="true">
      {variant==="error"?"!":variant==="success"?"✓":"i"}
    </span>
    <span className="catalogue-toast-text">{message}</span>
    <button type="button" onClick={onClose} aria-label="Đóng thông báo">×</button>
  </div>:null;
  return <>
    <span ref={anchor} className="catalogue-toast-anchor" aria-hidden="true"/>
    {target&&(target.host?createPortal(content,target.host):content)}
  </>;
}
