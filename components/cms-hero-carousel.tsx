"use client";

import Image from "next/image";
import {useEffect,useRef,useState} from "react";
import type {CSSProperties} from "react";
import type {PublicCmsItem} from "@/lib/content/cms";

const MAX_HERO_SLIDES=5;
const DEFAULT_MOTION={enabled:true,autoplay:true,effect:"fade-slide" as const,
 intervalMs:7000,durationMs:480};
const mediaUrl=(id:string,device:"desktop"|"mobile",slide:number)=>
 "/api/cms-image?id="+encodeURIComponent(id)+"&device="+device+
 (slide===1?"":"&slide="+slide);

/** Flatten already-approved Banner records to a bounded five-slide visual carousel. */
export default function CmsHeroCarousel({items}:{items:PublicCmsItem[]}){
 const slides=items.flatMap(item=>(item.slides??[1]).map(slide=>({
  id:item.id,slide,title:item.title,hasMobile:item.hasMobile,
  motion:item.motion??DEFAULT_MOTION
 }))).slice(0,MAX_HERO_SLIDES);
 const [active,setActive]=useState(0);
 const hovered=useRef(false),focused=useRef(false);
 const index=active%Math.max(slides.length,1);
 const current=slides[index];
 useEffect(()=>{
  if(slides.length<2||!current?.motion.enabled||!current.motion.autoplay)return;
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  const timer=window.setInterval(()=>{
   if(reduce.matches||document.hidden||hovered.current||focused.current)return;
   setActive(previous=>(previous+1)%slides.length);
  },current.motion.intervalMs);
  return ()=>window.clearInterval(timer);
 },[slides.length,index,current?.motion.enabled,current?.motion.autoplay,current?.motion.intervalMs]);
 if(!current)return null;
 const style={"--cms-hero-duration":current.motion.enabled?
  current.motion.durationMs+"ms":"0ms"} as CSSProperties;
 return <div className="cms-hero-carousel" role="region"
  aria-roledescription="carousel" aria-label="Hình ảnh sản phẩm Futurebook"
  data-effect={current.motion.effect} data-motion={current.motion.enabled?"on":"off"}
  style={style}
  onMouseEnter={()=>{hovered.current=true;}}
  onMouseLeave={()=>{hovered.current=false;}}
  onFocusCapture={()=>{focused.current=true;}}
  onBlurCapture={event=>{
   if(!event.currentTarget.contains(event.relatedTarget as Node|null))
    focused.current=false;
  }}>
  <div className="cms-hero-stage" aria-live="off">
   {slides.map((item,i)=><div key={item.id+":"+item.slide}
     className={"cms-hero-slide"+(i===index?" is-active":"")}
     aria-hidden={i!==index}>
    <picture className="cms-hero-picture">
     {item.hasMobile&&<source media="(max-width: 800px)"
      srcSet={mediaUrl(item.id,"mobile",item.slide)}/>}
     <Image src={mediaUrl(item.id,"desktop",item.slide)} alt={item.title}
      width={1200} height={900} sizes="(max-width: 800px) 100vw, 57vw"
      className="cms-hero-image" priority={i===0} unoptimized draggable={false}/>
    </picture>
   </div>)}
  </div>
  {slides.length>1&&<div className="cms-hero-controls" role="group" aria-label="Chọn ảnh Hero">
   {slides.map((item,i)=><button key={item.id+":"+item.slide} type="button"
    className={"cms-hero-dot"+(i===index?" is-active":"")}
    aria-label={"Xem Slide "+(i+1)+" / "+slides.length}
    aria-pressed={i===index}
    onClick={()=>setActive(i)}>
     <span aria-hidden="true"/>
    </button>)}
  </div>}
 </div>;
}
