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
      role="group" aria-label="Các mẫu ảnh sản phẩm"
      style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
      {items.map((img,i)=><button key={img.src} type="button"
        aria-label={"Xem mẫu ảnh "+(i+1)}
        aria-pressed={selected===i}
        onClick={()=>setSelected(i)}
        style={{width:68,height:68,overflow:"hidden",borderRadius:8,
          border:selected===i?"2px solid #7628a4":"1px solid #ddd",
          background:"#fff",padding:3,cursor:"pointer"}}>
        {/* Browser-native image for small gallery thumbs: the server verifies publication. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt="" loading="lazy" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
      </button>)}
    </div>}
  </div>;
}
