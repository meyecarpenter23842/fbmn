"use client";

import {useRef,useState,type RefObject} from "react";
import {CatalogProductImage} from "./catalog-product-image";
import {GlassButton,GlassCard,GlassMediaFrame} from "./glass-ui";

/** Native dialog provides focus containment, Escape dismissal and browser zoom.
 * The mobile overview shares the same ref, not a second gallery state.
 */
export default function PublishedImageGallery({items,glass=false,zoomDialogRef,activeIndex,onActiveIndexChange,priority=false}:{
  items:Array<{src:string;alt:string}>;glass?:boolean;
  zoomDialogRef?:RefObject<HTMLDialogElement|null>;
  activeIndex?:number;
  onActiveIndexChange?:(index:number)=>void;
  priority?:boolean;
}){
  const [selected,setSelected]=useState(0);
  const active=activeIndex??selected;
  const choose=(index:number)=>{setSelected(index);onActiveIndexChange?.(index);};
  const localZoomRef=useRef<HTMLDialogElement>(null);
  const zoomRef=zoomDialogRef??localZoomRef;
  const current=items[active]??items[0];
  const openZoom=()=>{if(current?.src&&!zoomRef.current?.open)zoomRef.current?.showModal();};
  const photo=<div className={glass?"fb-song-gallery-photo":"catalogue-gallery-photo"}
    key={current?.src??"empty"}>
    <CatalogProductImage src={current?.src??null} alt={current?.alt??"Sản phẩm Futurebook"}
      priority={priority&&active===0}
      sizes="(max-width: 700px) 94vw, (max-width: 1200px) 48vw, 560px"/>
  </div>;
  const mainImage=glass
    ? <GlassMediaFrame className="fb-song-main-photo">
        <button className="fb-song-gallery-open" type="button" onClick={openZoom}
          disabled={!current?.src} aria-label="Phóng to ảnh sản phẩm">
          {photo}
        </button>
      </GlassMediaFrame>
    : <div className="catalog-detail__image">{photo}</div>;
  const content=<>
    {mainImage}
    {glass&&items.length>1&&<p className="fb-song-gallery-caption">Chọn ảnh để xem lớn</p>}
    {items.length>1&&<div className={glass?"fb-song-gallery-thumbs":"catalogue-gallery-thumbs"}
      role="group" aria-label="Các mẫu ảnh sản phẩm">
      {items.map((img,i)=><button key={img.src} type="button"
        aria-label={"Xem mẫu ảnh "+(i+1)}
        aria-pressed={active===i} onClick={()=>{
          choose(i);
          if(glass&&window.matchMedia("(max-width: 700px)").matches&&
              !zoomRef.current?.open)zoomRef.current?.showModal();
        }}
        className={glass?"fb-song-gallery-thumb":"catalogue-gallery-thumb"}>
        {/* Verified published gallery thumbnail, never decorative media. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt="" width={80} height={100} loading="lazy" decoding="async"
          className={glass?"fb-song-gallery-thumb-image":"catalogue-gallery-thumb__image"}/>
      </button>)}
    </div>}
    {glass&&<dialog ref={zoomRef} className="fb-song-zoom-dialog"
      aria-labelledby="fb-song-zoom-title">
      <header className="fb-glass-dialog-header">
        <h2 id="fb-song-zoom-title" className="fb-glass-dialog-header__title">
          Ảnh sản phẩm
        </h2>
        <GlassButton variant="secondary"
          aria-label="Đóng ảnh phóng to"
          onClick={()=>zoomRef.current?.close()}>Đóng ảnh ✕</GlassButton>
      </header>
      <div className="fb-song-zoom-frame">
        <CatalogProductImage src={current?.src??null}
          alt={current?.alt??"Sản phẩm Futurebook"}/>
      </div>
    </dialog>}
  </>;
  return glass
    ? <GlassCard className="fb-song-gallery" data-has-media={items.length>0?"true":"false"} data-has-multiple={items.length>1?"true":"false"}>{content}</GlassCard>
    : <div className="catalogue-image-gallery">{content}</div>;
}
