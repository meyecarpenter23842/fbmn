"use client";
import {useEffect,useRef} from "react";
import styles from "./content-toast.module.css";
export default function ContentToast({message,variant,notificationId,onClose}:{
 message:string;variant:"success"|"error";notificationId:number;onClose:()=>void;
}){
 const callback=useRef(onClose);
 useEffect(()=>{callback.current=onClose;},[onClose]);
 useEffect(()=>{
  if(!message)return;
  const timeout=window.setTimeout(()=>callback.current(),6000);
  return ()=>window.clearTimeout(timeout);
 },[message,notificationId]);
 if(!message)return null;
 return <div className={[styles.toast,variant==="error"?styles.error:styles.success].join(" ")}
  role={variant==="error"?"alert":"status"} aria-live={variant==="error"?"assertive":"polite"}
  aria-atomic="true">
  <span>{message}</span>
  <button type="button" aria-label="Đóng thông báo" onClick={onClose}>×</button>
 </div>;
}
