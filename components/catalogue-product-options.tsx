"use client";

import Link from "next/link";
import {useState} from "react";
import type {PublicProduct} from "@/lib/catalog/schema";
import {groupedProductTypes,productType,shortVariantLabel,photosForSku,
  type ProductPhoto} from "@/lib/catalog/selection";
import PublishedImageGallery from "./published-image-gallery";

export default function CatalogueProductOptions({product,photos}:{
  product:PublicProduct;photos:ProductPhoto[];
}){
  const [sku,setSku]=useState(product.variants[0].sku);
  const selected=product.variants.find(v=>v.sku===sku)??product.variants[0];
  const groups=groupedProductTypes(product.variants);
  const activeGroup=productType(selected);
  // Every company code remains selectable, including ones without a group or specs.
  const choices=product.variants.filter(v=>productType(v)===activeGroup);
  const gallery=photosForSku(photos,selected.sku).map(({src,alt})=>({src,alt}));
  const specs=selected.specifications;
  const details:string[]=[];
  if(specs.binding)details.push("Đóng gáy: "+specs.binding);
  if(specs.packaging?.saleUnit)details.push("Đơn vị bán: "+specs.packaging.saleUnit);
  if(specs.packaging?.unitsPerPack!==undefined)
    details.push("Mỗi gói: "+specs.packaging.unitsPerPack+" "+(specs.packaging.saleUnit||"đơn vị"));
  if(specs.packaging?.unitsPerCarton!==undefined)
    details.push("Mỗi thùng: "+specs.packaging.unitsPerCarton+" "+(specs.packaging.saleUnit||"đơn vị"));

  return <div className="catalog-detail">
    <PublishedImageGallery key={selected.sku} items={gallery}/>
    <div className="catalog-detail__info">
      <h1>{product.name}</h1>
      {product.description&&<p className="catalog-detail__description">{product.description}</p>}
      <div className="catalogue-options">
        {groups.length===1&&groups[0]!==""&&<p className="catalogue-single-type">
          Loại / khổ: <strong>{groups[0]}</strong>
        </p>}
        {groups.length>1&&<fieldset className="catalogue-option-group">
          <legend>Loại sản phẩm</legend>
          <div className="catalogue-option-choices">{groups.map(group=>
            <button key={group} type="button" aria-pressed={activeGroup===group}
              onClick={()=>{const first=product.variants.find(v=>productType(v)===group);if(first)setSku(first.sku);}}>
              {group||"Loại khác"}
            </button>)}</div>
        </fieldset>}
        <fieldset className="catalogue-option-group">
          <legend>Chọn quy cách</legend>
          <div className="catalogue-variant-options">
            {choices.map(variant=><button key={variant.sku} type="button"
              className="catalogue-variant-option"
              aria-pressed={selected.sku===variant.sku} onClick={()=>setSku(variant.sku)}>
              <span className="catalogue-variant-option__name">{shortVariantLabel(variant)}</span>
              <span className="catalogue-variant-option__code">Mã {variant.sku}</span>
            </button>)}
          </div>
        </fieldset>
        <span className="catalogue-option-announcement" aria-live="polite" aria-atomic="true">
          Đang chọn: {shortVariantLabel(selected)}, mã sản phẩm {selected.sku}
        </span>
        {details.length>0&&<p className="catalogue-product-extra">{details.join(" · ")}</p>}
      </div>
      {selected.price?.kind==="retail"&&<p className="catalog-detail__price">
        {new Intl.NumberFormat("vi-VN").format(selected.price.amountVnd)+" đ"}
      </p>}
      <Link href="/#contact" className="catalog-button">Liên hệ báo giá</Link>
    </div>
  </div>;
}
