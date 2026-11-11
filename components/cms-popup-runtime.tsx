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
function withinPublishedWindow(item:PublicCmsItem,now:number){
 const published=Date.parse(item.publishedAt);
 if(!Number.isFinite(published)||published>now)return false;
 if(item.startsAt!==null){
  const start=Date.parse(item.startsAt);
  if(!Number.isFinite(start)||start>now)return false;
 }
 if(item.endsAt!==null){
  const end=Date.parse(item.endsAt);
  if(!Number.isFinite(end)||end<now)return false;
 }
 return true;
}
function canOpen(item:PublicCmsItem,now:number){
 if(!UUID.test(item.id)||!withinPublishedWindow(item,now)||
    countFor(item.id)>=item.popupMaxPerSession)return false;
 try{
  const last=Number(localStorage.getItem(key(item.id,"dismissed"))||"0");
  if(last>now||last>0&&now-last<item.popupCooldownMinutes*60_000)return false;
 }catch{/* Browser privacy settings: session limits remain best-effort. */}
 return true;
}
async function currentPublicCms(signal:AbortSignal):Promise<PublicCmsItem[]|null>{
 const res=await fetch("/api/cms",{cache:"no-store",credentials:"omit",signal});
 if(!res.ok||signal.aborted)return null;
 const envelope=await res.json() as {data?:{items?:PublicCmsItem[]}};
 return !signal.aborted&&Array.isArray(envelope.data?.items)?envelope.data.items:null;
}

export default function CmsPopupRuntime(){
 const path=usePathname()||"/";
 // Key by route visit: an old popup cannot reappear via Back/Forward with stale state.
 if(path==="/policy")return null;
 return <CmsPopupSession key={path} path={path}/>;
}
function CmsPopupSession({path}:{path:string}){
 const [show,setShow]=useState<{path:string;item:PublicCmsItem}|null>(null);
 const selected=show?.path===path?show.item:null;
 const dialog=useRef<HTMLDialogElement>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const close=()=>{
  const shown=selected,element=dialog.current;
  if(!shown||!element?.open||element.classList.contains("is-closing"))return;
  try{localStorage.setItem(key(shown.id,"dismissed"),String(Date.now()));}
  catch{/* storage optional */}
  // Retain the native dialog and backdrop for the mandatory 220ms exit animation.
  element.classList.add("is-closing");
  const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
  if(closeTimer.current)clearTimeout(closeTimer.current);
  closeTimer.current=setTimeout(()=>{
   element.close();
   setShow(null);
   closeTimer.current=null;
  },reduce?0:220);
 };
 useEffect(()=>{
  if(timer.current){clearTimeout(timer.current);timer.current=null;}
  if(closeTimer.current){clearTimeout(closeTimer.current);closeTimer.current=null;}
  // A route change invalidates any old popup and delayed timers immediately.
  if(dialog.current?.open)dialog.current.close();
  const controller=new AbortController();
  (async()=>{
   try{
    const current=await currentPublicCms(controller.signal);
    if(!current||controller.signal.aborted)return;
    const candidate=current.find(item=>matches(item,path)&&canOpen(item,Date.now()));
    if(!candidate)return;
    timer.current=setTimeout(()=>{
     // The Owner may hide/withdraw this popup during its delay.
     // Re-fetch the fresh public view before exposing any text, CTA or image.
     void (async()=>{
      try{
       if(controller.signal.aborted)return;
       const latest=await currentPublicCms(controller.signal);
       if(!latest||controller.signal.aborted)return;
       const published=latest.find(item=>item.id===candidate.id&&
        matches(item,path)&&canOpen(item,Date.now()));
       if(!published)return;
       setShow({path,item:published});
       try{sessionStorage.setItem(key(published.id,"count"),
        String(countFor(published.id)+1));}catch{/* session storage optional */}
      }catch{/* fail closed: no delayed popup when CMS is unavailable */}
     })();
    },Math.max(0,Math.min(120,candidate.popupDelaySeconds))*1000);
   }catch{/* CMS unavailable fails closed; never show unapproved popup. */}
  })();
  return ()=>{
   controller.abort();
   if(timer.current){clearTimeout(timer.current);timer.current=null;}
   if(closeTimer.current){clearTimeout(closeTimer.current);closeTimer.current=null;}
  };
 },[path]);
 useEffect(()=>{
  const element=dialog.current;
  if(!element)return;
  if(selected&&!element.open)element.showModal();
  if(!selected&&element.open)element.close();
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
