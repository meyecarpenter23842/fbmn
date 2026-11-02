"use client";

import {useEffect} from "react";

export default function AdminToast({message,onClose,duration=4800}:{
  message:string;onClose:()=>void;duration?:number
}){
  useEffect(()=>{
    if(!message)return;
    const timer=window.setTimeout(onClose,duration);
    return ()=>window.clearTimeout(timer);
  },[message,onClose,duration]);
  if(!message)return null;
  // Keep the status and dismiss button within the owning modal focus trap.
  return (
    <div className="catalogue-toast" role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Đóng thông báo">×</button>
    </div>
  );
}
