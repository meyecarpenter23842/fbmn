"use client";
import {useState} from "react";
import {CatalogProductImage} from "./catalog-product-image";
export default function PublishedImageGallery({items}:{items:Array<{src:string;alt:string}>}){
  const [selected,setSelected]=useState(0);
  const current=items[selected]??items[0];
  return <div className="catalogue-image-gallery">
    <div className="catalog-detail__image">
      <CatalogProductImage src={current?.src??null} alt={current?.alt??"Sản phẩm Futurebook"}/>
    </div>
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
  </div>;
}
