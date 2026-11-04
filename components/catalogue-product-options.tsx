"use client";

import Link from "next/link";
import {useState} from "react";
import type {PublicProduct,PublicVariant} from "@/lib/catalog/schema";
import {chooseVariant,paperSizes,paperWeights,photosForSku,
  type ProductPhoto} from "@/lib/catalog/selection";
import PublishedImageGallery from "./published-image-gallery";

function optionLabel(v:PublicVariant){
  const s=v.specifications;
  return [v.name,s.pageCount?String(s.pageCount)+" trang":null,
    s.ruling,s.coverFinish,"SKU "+v.sku].filter(Boolean).join(" · ");
}
export default function CatalogueProductOptions({product,photos}:{
  product:PublicProduct;photos:ProductPhoto[];
}){
  const [sku,setSku]=useState(product.variants[0].sku);
  const selected=product.variants.find(v=>v.sku===sku)??product.variants[0];
  const specs=selected.specifications;
  const sizes=paperSizes(product.variants);
  const weights=paperWeights(product.variants,specs.paperSize);
  // A real SKU can have missing size/GSM: always permit selecting it directly.
  const candidates=product.variants;
  const gallery=photosForSku(photos,selected.sku).map(({src,alt})=>({src,alt}));
  const select=(dimension:"paperSize"|"paperWeightGsm",value:string|number)=>{
    setSku(chooseVariant(product.variants,selected,dimension,value).sku);
  };
  return <div className="catalog-detail">
    <PublishedImageGallery key={selected.sku} items={gallery}/>
    <div className="catalog-detail__info">
      <p className="catalog-overline">THÔNG TIN SẢN PHẨM ĐÃ XÁC MINH</p>
      <h1>{product.name}</h1>
      {product.description&&<p className="catalog-detail__description">{product.description}</p>}
      <p className="catalog-detail__count">Có {product.variants.length} quy cách đã xác minh</p>
      <div className="catalogue-options">
        {sizes.length>0&&<fieldset className="catalogue-option-group">
          <legend>Khổ giấy</legend>
          <div className="catalogue-option-choices">{sizes.map(size=>
            <button key={size} type="button" aria-pressed={specs.paperSize===size}
              onClick={()=>select("paperSize",size)}>{size}</button>)}</div>
        </fieldset>}
        {weights.length>0&&<fieldset className="catalogue-option-group">
          <legend>Định lượng giấy</legend>
          <div className="catalogue-option-choices">{weights.map(gsm=>
            <button key={gsm} type="button" aria-pressed={specs.paperWeightGsm===gsm}
              onClick={()=>select("paperWeightGsm",gsm)}>{gsm} gsm</button>)}</div>
        </fieldset>}
        <div className="catalogue-option-group">
          <label htmlFor="catalogue-sku">Quy cách / mẫu sản phẩm</label>
          <select id="catalogue-sku" value={selected.sku} onChange={e=>setSku(e.target.value)}>
            {candidates.map(v=><option key={v.sku} value={v.sku}>{optionLabel(v)}</option>)}
          </select>
        </div>
        <p className="catalogue-selected-sku" aria-live="polite">
          Mã sản phẩm đang chọn: <strong>{selected.sku}</strong>
        </p>
        <p className="catalogue-selected-spec">
          {[specs.pageCount?String(specs.pageCount)+" trang":null,specs.ruling,
            specs.coverFinish,specs.packaging?.saleUnit].filter(Boolean).join(" · ")}
        </p>
        <p className="catalogue-cover-note">
          {gallery.length>1?"Chọn ảnh nhỏ để xem mẫu bìa cùng SKU, không tạo mã mới.":
            gallery.length===0?"SKU này chưa có ảnh chính thức.":"Ảnh của SKU đang chọn."}
        </p>
      </div>
      <p className="catalog-detail__price">
        {selected.price?.kind==="retail"?
          new Intl.NumberFormat("vi-VN").format(selected.price.amountVnd)+" đ":"Liên hệ báo giá"}
      </p>
      <Link href="/#contact" className="catalog-button">Liên hệ báo giá</Link>
      <p className="catalog-detail__policy">Giá NET, giá đại lý và giá theo hợp đồng không công khai trên website.</p>
    </div>
  </div>;
}
