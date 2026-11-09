"use client";

import Image from "next/image";
import {useEffect,useRef,useState} from "react";
import type {PublicCmsItem} from "@/lib/content/cms";

const MAX_HERO_SLIDES=5;
const AUTO_ADVANCE_MS=7000;
const mediaUrl=(id:string,device:"desktop"|"mobile")=>
 "/api/cms-image?id="+encodeURIComponent(id)+"&device="+device;

/** Approved CMS imagery only. The existing Hero heading and CTA stay outside this visual carousel. */
export default function CmsHeroCarousel({items}:{items:PublicCmsItem[]}){
 const slides=items.slice(0,MAX_HERO_SLIDES);
 const [active,setActive]=useState(0);
 const hovered=useRef(false);
 const focused=useRef(false);
 useEffect(()=>{
  if(slides.length<2)return;
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  const timer=window.setInterval(()=>{
   if(reduce.matches||document.hidden||hovered.current||focused.current)return;
   setActive(previous=>(previous+1)%slides.length);
  },AUTO_ADVANCE_MS);
  return ()=>window.clearInterval(timer);
 },[slides.length]);
 if(!slides.length)return null;
 const move=(direction:-1|1)=>setActive(previous=>
  (previous+direction+slides.length)%slides.length);
 return <div className="cms-hero-carousel" role="region"
  aria-roledescription="carousel" aria-label="Hình ảnh sản phẩm Futurebook"
  onMouseEnter={()=>{hovered.current=true;}}
  onMouseLeave={()=>{hovered.current=false;}}
  onFocusCapture={()=>{focused.current=true;}}
  onBlurCapture={event=>{
   if(!event.currentTarget.contains(event.relatedTarget as Node|null))
    focused.current=false;
  }}>
  <div className="cms-hero-stage" aria-live="off">
   {slides.map((item,index)=><div key={item.id}
     className={"cms-hero-slide"+(index===active?" is-active":"")}
     aria-hidden={index!==active}>
    <picture className="cms-hero-picture">
     {item.hasMobile&&<source media="(max-width: 800px)"
      srcSet={mediaUrl(item.id,"mobile")}/>}
     <Image src={mediaUrl(item.id,"desktop")} alt={item.title}
      width={1200} height={900} sizes="(max-width: 800px) 100vw, 57vw"
      className="cms-hero-image" priority={index===0} unoptimized draggable={false}/>
    </picture>
   </div>)}
  </div>
  {slides.length>1&&<div className="cms-hero-controls" aria-label="Điều khiển ảnh Hero">
   <button type="button" onClick={()=>move(-1)} aria-label="Ảnh trước">‹</button>
   <span aria-live="off">{active+1} / {slides.length}</span>
   <button type="button" onClick={()=>move(1)} aria-label="Ảnh tiếp theo">›</button>
  </div>}
 </div>;
}
