"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect,useReducer,useRef} from "react";
import type {CSSProperties} from "react";
import type {PublicCmsItem} from "@/lib/content/cms";
import {heroSlideReducer,initialHeroSlideState} from "@/lib/media/hero-slide-state";

const MAX_HERO_SLIDES=5;
const DEFAULT_MOTION={enabled:true,autoplay:true,effect:"fade-slide" as const,
 intervalMs:7000,durationMs:480};
const mediaUrl=(id:string,device:"desktop"|"mobile",slide:number)=>
 "/api/cms-image?id="+encodeURIComponent(id)+"&device="+device+
 (slide===1?"":"&slide="+slide);

/** Only the approved, already-published Banner entries may be loaded. */
export default function CmsHeroCarousel({items}:{items:PublicCmsItem[]}){
 const slides=items.flatMap(item=>(item.slides??[1]).map(slide=>({
  id:item.id,slide,title:item.title,ctaUrl:item.ctaUrl,hasMobile:item.hasMobile,
  motion:item.motion??DEFAULT_MOTION
 }))).slice(0,MAX_HERO_SLIDES);
 const [state,dispatch]=useReducer(heroSlideReducer,initialHeroSlideState);
 const hovered=useRef(false),focused=useRef(false);
 const resumeAuto=()=>{
  if(!hovered.current&&!focused.current&&!document.hidden&&
     !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
   dispatch({type:"resume"});
 };
 useEffect(()=>{
  const resumeIfVisible=()=>{
   if(!document.hidden&&!hovered.current&&!focused.current&&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    dispatch({type:"resume"});
  };
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  document.addEventListener("visibilitychange",resumeIfVisible);
  reduce.addEventListener("change",resumeIfVisible);
  return ()=>{
   document.removeEventListener("visibilitychange",resumeIfVisible);
   reduce.removeEventListener("change",resumeIfVisible);
  };
 },[]);
 const index=state.active%Math.max(slides.length,1);
 const current=slides[index];
 useEffect(()=>{
  if(slides.length<2||!current?.motion.enabled||!current.motion.autoplay)return;
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  const timer=window.setInterval(()=>{
   if(reduce.matches||document.hidden||hovered.current||focused.current||
      state.pending!==null)return;
   for(let step=1;step<slides.length;step++){
    const next=(index+step)%slides.length;
    if(!state.failed.includes(next)){
     dispatch({type:"request",index:next,source:"auto"});break;
    }
   }
  },current.motion.intervalMs);
  return ()=>window.clearInterval(timer);
 },[slides.length,index,current?.motion.enabled,current?.motion.autoplay,
  current?.motion.intervalMs,state.pending,state.failed]);
 useEffect(()=>{
  if(slides.length<2||!current?.motion.enabled||!current.motion.autoplay)return;
  // Preload only the next non-failed slide AFTER the initial paint.
  const next=(index+1)%slides.length;
  const warm=window.setTimeout(()=>{
   if(document.hidden||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
   if(!state.failed.includes(next))dispatch({type:"warm",index:next});
  },Math.max(2500,current.motion.intervalMs-2500));
  return ()=>window.clearTimeout(warm);
 },[slides.length,index,current?.motion.enabled,current?.motion.autoplay,
  current?.motion.intervalMs,state.failed]);
 if(!current)return null;
 const style={"--cms-hero-duration":current.motion.enabled?
  current.motion.durationMs+"ms":"0ms"} as CSSProperties;
 return <div className="cms-hero-carousel" role="region"
  aria-roledescription="carousel" aria-label="Hình ảnh sản phẩm Futurebook"
  data-effect={current.motion.effect} data-motion={current.motion.enabled?"on":"off"}
  style={style}
  onMouseEnter={()=>{hovered.current=true;}}
  onMouseLeave={()=>{hovered.current=false;resumeAuto();}}
  onFocusCapture={()=>{focused.current=true;}}
  onBlurCapture={event=>{
   if(!event.currentTarget.contains(event.relatedTarget as Node|null))
    focused.current=false;resumeAuto();
  }}>
  <div className="cms-hero-stage" aria-live="off">
   {slides.map((item,i)=><div key={item.id+":"+item.slide}
     className={"cms-hero-slide"+(i===index?" is-active":"")}
     aria-hidden={i!==index}>
    {state.failed.includes(i)
     ? <div className="cms-hero-picture cms-hero-image-fallback" role="status">
        Ảnh banner đang được cập nhật
       </div>
     : state.prepared.includes(i)&&<picture className="cms-hero-picture">
      {item.hasMobile&&<source media="(max-width: 800px)"
       srcSet={mediaUrl(item.id,"mobile",item.slide)}/>}
      <Image src={mediaUrl(item.id,"desktop",item.slide)} alt={item.title}
       width={1600} height={700} sizes="(max-width: 800px) 100vw, 100vw"
       className="cms-hero-image" priority={i===0}
       loading={i===0?undefined:"eager"} unoptimized draggable={false}
       onLoad={event=>{
        // Image decode completes before a new slide becomes visible.
        const img=event.currentTarget;
        if(typeof img.decode==="function"){
         void img.decode().then(()=>dispatch({type:"loaded",index:i,
            paused:hovered.current||focused.current||document.hidden||
             window.matchMedia("(prefers-reduced-motion: reduce)").matches}))
          .catch(()=>dispatch({type:"failed",index:i}));
        }else dispatch({type:"loaded",index:i,
         paused:hovered.current||focused.current||document.hidden||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches});
       }}
       onError={()=>dispatch({type:"failed",index:i})}/>
     </picture>}
    <Link className="cms-hero-cta" href={item.ctaUrl||"/san-pham"}
     tabIndex={i===index?0:-1}
     aria-label={"Xem sản phẩm Futurebook · Slide "+(i+1)}>
      Xem sản phẩm <span aria-hidden="true">↗</span>
    </Link>
   </div>)}
  </div>
  {slides.length>1&&<div className="cms-hero-controls" role="group" aria-label="Chọn ảnh Hero">
   {slides.map((item,i)=><button key={item.id+":"+item.slide} type="button"
    className={"cms-hero-dot"+(i===index?" is-active":"")}
    aria-label={"Xem Slide "+(i+1)+" / "+slides.length}
    aria-pressed={i===index} disabled={state.failed.includes(i)}
    onClick={()=>dispatch({type:"request",index:i,source:"manual"})}>
     <span aria-hidden="true"/>
    </button>)}
  </div>}
 </div>;
}
