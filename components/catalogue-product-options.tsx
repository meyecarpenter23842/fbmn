"use client";

import Link from "next/link";
import {useState} from "react";
import type {PublicProduct} from "@/lib/catalog/schema";
import {availableVariantFacets,moveVariantFacet,variantAudience,variantPaperFormat,
  visibleVariants,shortVariantLabel,photosForSku,type ProductPhoto} from "@/lib/catalog/selection";
import PublishedImageGallery from "./published-image-gallery";

function BookIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 5c-2.7-1.6-5.7-1.8-9-1v14c3.3-.8 6.3-.6 9 1.1M12 5c2.7-1.6 5.7-1.8 9-1v14c-3.3-.8-6.3-.6-9 1.1M12 5v14.1"/>
</svg>}

export default function CatalogueProductOptions({product,photos}:{
  product:PublicProduct;photos:ProductPhoto[];
}){
  const [sku,setSku]=useState(product.variants[0].sku);
  const [audience,setAudience]=useState("");
  const [format,setFormat]=useState("");
  const selected=product.variants.find(v=>v.sku===sku)??product.variants[0];
  const facets=availableVariantFacets(product.variants);
  // "Tất cả" keeps every company code reachable, including records missing either facet.
  const choices=visibleVariants(product.variants,audience,format);
  const gallery=photosForSku(photos,selected.sku).map(({src,alt})=>({src,alt}));
  const selectFacet=(facet:"audience"|"format",value:string)=>{
    const next=moveVariantFacet(product.variants,selected,facet,value,audience,format);
    setAudience(next.audience);setFormat(next.format);setSku(next.sku);
  };
  const selectedName=shortVariantLabel(selected);
  const selectedAudience=variantAudience(selected);
  const selectedFormat=variantPaperFormat(selected);
  const specs=selected.specifications;
  const extraInfo:{label:string;value:string}[]=[];
  if(specs.binding)extraInfo.push({label:"Đóng gáy",value:specs.binding});
  if(specs.packaging?.saleUnit)extraInfo.push({label:"Đơn vị bán",value:specs.packaging.saleUnit});
  if(specs.packaging?.unitsPerPack!==undefined)
    extraInfo.push({label:"Đơn vị/gói",value:String(specs.packaging.unitsPerPack)});
  if(specs.packaging?.unitsPerCarton!==undefined)
    extraInfo.push({label:"Đơn vị/thùng",value:String(specs.packaging.unitsPerCarton)});
  return <div className="catalog-detail">
    <PublishedImageGallery key={selected.sku} items={gallery}/>
    <div className="catalog-detail__info">
      <p className="catalog-overline">SẢN PHẨM FUTUREBOOK</p>
      <h1>{product.name}</h1>
      {product.description&&<p className="catalog-detail__description">{product.description}</p>}
      <p className="catalog-detail__count">{product.variants.length} mã sản phẩm</p>
      <div className="catalogue-options">
        {(facets.audiences.length>0||facets.formats.length>0)&&<div className="catalogue-facets">
          {facets.audiences.length>0&&<fieldset className="catalogue-option-group">
            <legend>Nhóm sản phẩm</legend>
            <div className="catalogue-option-choices">
              <button type="button" aria-pressed={audience===""} onClick={()=>selectFacet("audience","")}>Tất cả</button>
              {facets.audiences.map(group=><button key={group} type="button"
                aria-pressed={audience===group} onClick={()=>selectFacet("audience",group)}>{group}</button>)}
            </div>
          </fieldset>}
          {facets.formats.length>0&&<fieldset className="catalogue-option-group">
            <legend>Khổ giấy</legend>
            <div className="catalogue-option-choices">
              <button type="button" aria-pressed={format===""} onClick={()=>selectFacet("format","")}>Tất cả</button>
              {facets.formats.map(size=><button key={size} type="button"
                aria-pressed={format===size} onClick={()=>selectFacet("format",size)}>{size}</button>)}
            </div>
          </fieldset>}
        </div>}
        <fieldset className="catalogue-option-group">
          <legend>Chọn mã sản phẩm</legend>
          <div className="catalogue-variant-options">
            {choices.map(variant=><button type="button" key={variant.sku}
              className="catalogue-variant-option"
              aria-label={"Chọn mã "+variant.sku+": "+shortVariantLabel(variant)}
              aria-pressed={selected.sku===variant.sku} onClick={()=>setSku(variant.sku)}>
              <BookIcon/>
              <span className="catalogue-variant-option__name">{shortVariantLabel(variant)}</span>
              <span className="catalogue-variant-option__code">Mã {variant.sku}</span>
              <span className="catalogue-variant-option__mark" aria-hidden="true">{selected.sku===variant.sku?"✓":""}</span>
            </button>)}
          </div>
        </fieldset>
        <div className="catalogue-selected-summary" aria-live="polite" aria-atomic="true">
          <span className="catalogue-selected-summary__label"><span aria-hidden="true">✓</span> Đang chọn</span>
          <strong className="catalogue-selected-summary__code">Mã {selected.sku}</strong>
          <strong className="catalogue-selected-summary__name">{selectedName}</strong>
          {selectedAudience&&<span>{selectedAudience}</span>}
          {selectedFormat&&<span>{selectedFormat}</span>}
          <Link href="/#contact" className="catalog-button catalogue-selected-summary__action">Liên hệ báo giá <span aria-hidden="true">→</span></Link>
        </div>
        {extraInfo.length>0&&<details className="catalogue-extra-details">
          <summary>Thông tin thêm</summary>
          <dl>{extraInfo.map(row=><div key={row.label}>
            <dt>{row.label}</dt><dd>{row.value}</dd>
          </div>)}</dl>
        </details>}
        {selected.price?.kind==="retail"&&<p className="catalog-detail__price">
          {new Intl.NumberFormat("vi-VN").format(selected.price.amountVnd)+" đ"}
        </p>}
      </div>
    </div>
  </div>;
}
