"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import styles from "./content-toast.module.css";
export default function ContentToast({message,variant,notificationId,onClose}:{
 message:string;variant:"success"|"error";notificationId:number;onClose:()=>void;
}){
 const callback=useRef(onClose);
 const [host,setHost]=useState<HTMLElement|null>(null);
 useEffect(()=>{let active=true;void Promise.resolve().then(()=>{if(active)setHost(document.body)});
  return ()=>{active=false;};},[]);
 useEffect(()=>{callback.current=onClose;},[onClose]);
 useEffect(()=>{
  if(!message)return;
  const timeout=window.setTimeout(()=>callback.current(),6000);
  return ()=>window.clearTimeout(timeout);
 },[message,notificationId]);
 if(!message)return null;
 if(!host)return null;
 return createPortal(<div className={[styles.toast,variant==="error"?styles.error:styles.success].join(" ")}
  role={variant==="error"?"alert":"status"} aria-live={variant==="error"?"assertive":"polite"}
  aria-atomic="true">
  <span>{message}</span>
  <button type="button" aria-label="Đóng thông báo" onClick={onClose}>×</button>
 </div>,host);
}
