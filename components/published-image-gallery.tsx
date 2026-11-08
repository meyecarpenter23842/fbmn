"use client";
import {useState} from "react";
import {CatalogProductImage} from "./catalog-product-image";
import {GlassCard,GlassMediaFrame} from "./glass-ui";

export default function PublishedImageGallery({items,glass=false}:{
  items:Array<{src:string;alt:string}>;glass?:boolean;
}){
  const [selected,setSelected]=useState(0);
  const current=items[selected]??items[0];
  const photo=<div className="catalogue-gallery-photo" key={current?.src??"empty"}>
    <CatalogProductImage src={current?.src??null} alt={current?.alt??"Sản phẩm Futurebook"}/>
  </div>;
  const mainImage=glass
    ? <GlassMediaFrame className="catalog-detail__image">{photo}</GlassMediaFrame>
    : <div className="catalog-detail__image">{photo}</div>;
  const content=<>
    {mainImage}
    {items.length>1&&<div className="catalogue-gallery-thumbs"
      role="group" aria-label="Các mẫu ảnh sản phẩm">
      {items.map((img,i)=><button key={img.src} type="button"
        aria-label={"Xem mẫu ảnh "+(i+1)}
        aria-pressed={selected===i}
        onClick={()=>setSelected(i)} className="catalogue-gallery-thumb">
        {/* Browser-native image for small gallery thumbs: the server verifies publication. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt="" loading="lazy" className="catalogue-gallery-thumb__image"/>
      </button>)}
    </div>}
  </>;
  return glass
    ? <GlassCard className="catalogue-image-gallery fb-glass-song-gallery">{content}</GlassCard>
    : <div className="catalogue-image-gallery">{content}</div>;
}
