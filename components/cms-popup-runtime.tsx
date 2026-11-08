"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import Image from "next/image";
import type {PublicCmsItem} from "@/lib/content/cms";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function matches(item:PublicCmsItem,path:string){
 return item.kind==="popup"&&(item.slot==="all.entry"||
  (item.slot==="home.entry"&&path==="/")||
  (item.slot==="category.entry"&&(path==="/san-pham"||path.startsWith("/danh-muc/"))));
}
function key(id:string,suffix:string){return "fbmn:cms-popup:"+id+":"+suffix;}
function countFor(id:string){
 try{const n=Number(sessionStorage.getItem(key(id,"count"))||"0");
  return Number.isSafeInteger(n)&&n>=0?n:0;}catch{return 0;}
}
function canOpen(item:PublicCmsItem,now:number){
 if(!UUID.test(item.id)||countFor(item.id)>=item.popupMaxPerSession)return false;
 try{
  const last=Number(localStorage.getItem(key(item.id,"dismissed"))||"0");
  if(last>now||last>0&&now-last<item.popupCooldownMinutes*60_000)return false;
 }catch{/* Browser privacy setting: still enforce session count when possible. */}
 return true;
}
export default function CmsPopupRuntime(){
 const path=usePathname()||"/";
 const [show,setShow]=useState<{path:string;item:PublicCmsItem}|null>(null);
 const selected=show?.path===path?show.item:null;
 const dialog=useRef<HTMLDialogElement>(null);
 const active=useRef<AbortController|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const close=()=>{
  const shown=selected;
  if(shown){
   try{localStorage.setItem(key(shown.id,"dismissed"),String(Date.now()));}catch{/* storage optional */}
  }
  dialog.current?.close();
  setShow(null);
 };
 useEffect(()=>{
  if(timer.current){clearTimeout(timer.current);timer.current=null;}
  active.current?.abort();
  // Route change invalidates an existing popup; close without creating extra exposure.
  const d=dialog.current;if(d?.open)d.close();
  const controller=new AbortController();active.current=controller;
  (async()=>{
   try{
    const res=await fetch("/api/cms",{cache:"no-store",credentials:"omit",signal:controller.signal});
    if(!res.ok)return;
    const envelope=await res.json() as {data?:{items?:PublicCmsItem[]}};
    if(!Array.isArray(envelope.data?.items))return;
    const now=Date.now();
    const candidate=envelope.data.items.find(item=>matches(item,path)&&canOpen(item,now));
    if(!candidate||controller.signal.aborted)return;
    timer.current=setTimeout(()=>{
     if(controller.signal.aborted)return;
     setShow({path,item:candidate});
     try{sessionStorage.setItem(key(candidate.id,"count"),
      String(countFor(candidate.id)+1));}catch{/* session fallback */}
    },Math.max(0,Math.min(120,candidate.popupDelaySeconds))*1000);
   }catch{/* CMS unavailable fails closed; never show stale or unapproved popup. */}
  })();
  return ()=>{controller.abort();if(timer.current)clearTimeout(timer.current);};
 },[path]);
 useEffect(()=>{
  const d=dialog.current;
  if(!d)return;
  if(selected&&!d.open)d.showModal();
  if(!selected&&d.open)d.close();
 },[selected]);
 if(!selected)return null;
 return <dialog ref={dialog} className="cms-web-popup-dialog"
   aria-label="Thông tin Futurebook" onCancel={event=>{event.preventDefault();close();}}
   onClick={event=>{if(event.target===dialog.current)close();}}>
  <div className="cms-web-popup-heading">
   <strong>Thông tin Futurebook</strong>
   <button type="button" onClick={close} aria-label="Đóng thông báo">×</button>
  </div>
  <div className="cms-web-popup-body">
   <picture className="cms-web-popup-image">
    {selected.hasMobile&&<source media="(max-width: 800px)"
      srcSet={"/api/cms-image?id="+encodeURIComponent(selected.id)+"&device=mobile"}/>}
    <Image src={"/api/cms-image?id="+encodeURIComponent(selected.id)+"&device=desktop"}
      alt={selected.title} width={640} height={500} className="cms-web-popup-img" unoptimized/>
   </picture>
   <h2>{selected.title}</h2>
   {selected.summary&&<p>{selected.summary}</p>}
   {selected.ctaUrl&&<a href={selected.ctaUrl} onClick={close} className="cms-web-popup-cta">Xem thêm</a>}
  </div>
 </dialog>;
}
