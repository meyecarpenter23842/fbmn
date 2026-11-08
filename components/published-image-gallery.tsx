"use client";

import {useState} from "react";
import {CatalogProductImage} from "./catalog-product-image";
import {GlassCard,GlassMediaFrame} from "./glass-ui";

export default function PublishedImageGallery({items,glass=false}:{
  items:Array<{src:string;alt:string}>;glass?:boolean;
}){
  const [selected,setSelected]=useState(0);
  const current=items[selected]??items[0];
  const photo=<div className={glass?"fb-song-gallery-photo":"catalogue-gallery-photo"}
    key={current?.src??"empty"}>
    <CatalogProductImage src={current?.src??null} alt={current?.alt??"Sản phẩm Futurebook"}/>
  </div>;
  const mainImage=glass
    ? <GlassMediaFrame className="fb-song-main-photo">{photo}</GlassMediaFrame>
    : <div className="catalog-detail__image">{photo}</div>;
  const content=<>
    {mainImage}
    {items.length>1&&<div className={glass?"fb-song-gallery-thumbs":"catalogue-gallery-thumbs"}
      role="group" aria-label="Các mẫu ảnh sản phẩm">
      {items.map((img,i)=><button key={img.src} type="button"
        aria-label={"Xem mẫu ảnh "+(i+1)}
        aria-pressed={selected===i} onClick={()=>setSelected(i)}
        className={glass?"fb-song-gallery-thumb":"catalogue-gallery-thumb"}>
        {/* Verified published gallery thumbnail; do not replace with decorative images. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt="" loading="lazy"
          className={glass?"fb-song-gallery-thumb-image":"catalogue-gallery-thumb__image"}/>
      </button>)}
    </div>}
  </>;
  return glass
    ? <GlassCard className="fb-song-gallery">{content}</GlassCard>
    : <div className="catalogue-image-gallery">{content}</div>;
}
