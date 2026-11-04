"use client";
import Link from "next/link";
import {useRef} from "react";
import {CatalogProductImage} from "./catalog-product-image";

export interface SuggestedProduct {
  id:string;slug:string;name:string;detail:string;src:string|null;alt:string;
}
export default function CatalogueRelatedProducts({items,title}:{
  items:SuggestedProduct[];title:string;
}){
  const strip=useRef<HTMLDivElement>(null);
  if(items.length===0)return null;
  const scroll=(direction:number)=>{
    const el=strip.current;
    if(!el)return;
    const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({left:direction*Math.max(240,el.clientWidth*.8),behavior:reduce?"auto":"smooth"});
  };
  return <section className="catalogue-related" aria-labelledby="catalogue-related-heading">
    <div className="catalogue-related__header">
      <h2 id="catalogue-related-heading">{title}</h2>
      {items.length>1&&<div className="catalogue-related__controls">
        <button type="button" onClick={()=>scroll(-1)} aria-label="Xem sản phẩm trước">‹</button>
        <button type="button" onClick={()=>scroll(1)} aria-label="Xem sản phẩm tiếp theo">›</button>
      </div>}
    </div>
    <div className="catalogue-related__track" ref={strip} role="list" aria-label={title}>
      {items.map(item=><article className="catalogue-related-card" role="listitem" key={item.id}>
        <Link className="catalogue-related-card__photo" href={"/san-pham/"+encodeURIComponent(item.slug)}
          prefetch={false} aria-label={"Xem "+item.name}>
          <CatalogProductImage src={item.src} alt={item.alt}/>
        </Link>
        <div className="catalogue-related-card__content">
          <h3><Link href={"/san-pham/"+encodeURIComponent(item.slug)} prefetch={false}>{item.name}</Link></h3>
          <p>{item.detail}</p>
          <Link className="catalogue-related-card__link" href={"/san-pham/"+encodeURIComponent(item.slug)} prefetch={false}>Xem chi tiết <span aria-hidden="true">→</span></Link>
        </div>
      </article>)}
    </div>
  </section>;
}
