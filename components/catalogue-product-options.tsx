"use client";

import Link from "next/link";
import {useState} from "react";
import type {PublicProduct} from "@/lib/catalog/schema";
import {availableVariantFacets,moveVariantFacet,variantAudience,variantPaperFormat,
  visibleVariants,shortVariantLabel,photosForSku,type ProductPhoto} from "@/lib/catalog/selection";
import PublishedImageGallery from "./published-image-gallery";
import {GlassPanel, GlassChip, GlassButton, GlassButtonLink} from "./glass-ui";

function BookIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 5c-2.7-1.6-5.7-1.8-9-1v14c3.3-.8 6.3-.6 9 1.1M12 5c2.7-1.6 5.7-1.8 9-1v14c-3.3-.8-6.3-.6-9 1.1M12 5v14.1"/>
</svg>}

/** Presentation-only switches; SKU/facet handlers remain owned by the existing page. */
function FacetChoice({glass,active,label,onClick}:{
  glass:boolean;active:boolean;label:string;onClick:()=>void;
}) {
  return glass
    ? <GlassChip selected={active} onClick={onClick}>{label}</GlassChip>
    : <button type="button" aria-pressed={active} onClick={onClick}>{label}</button>;
}

function VariantChoice({glass,variant,active,onClick}:{
  glass:boolean;variant:PublicProduct["variants"][number];active:boolean;onClick:()=>void;
}) {
  const label="Chọn mã "+variant.sku+": "+shortVariantLabel(variant);
  const children=<>
    <BookIcon/>
    <span className="catalogue-variant-option__name">{shortVariantLabel(variant)}</span>
    <span className="catalogue-variant-option__code">Mã {variant.sku}</span>
    <span className="catalogue-variant-option__mark" aria-hidden="true">{active?"✓":""}</span>
  </>;
  return glass
    ? <GlassChip className="catalogue-variant-option" aria-label={label}
        selected={active} onClick={onClick}>{children}</GlassChip>
    : <button type="button" className="catalogue-variant-option" aria-label={label}
        aria-pressed={active} onClick={onClick}>{children}</button>;
}

export default function CatalogueProductOptions({product,photos,glass=false}:{
  product:PublicProduct;photos:ProductPhoto[];glass?:boolean;
}){
  const [sku,setSku]=useState(product.variants[0].sku);
  const [audience,setAudience]=useState("");
  const [format,setFormat]=useState("");
  const selected=product.variants.find(v=>v.sku===sku)??product.variants[0];
  const facets=availableVariantFacets(product.variants);
  // Without a filter, all company codes remain reachable, including missing facet data.
  const choices=visibleVariants(product.variants,audience,format);
  const gallery=photosForSku(photos,selected.sku).map(({src,alt})=>({src,alt}));
  const selectFacet=(facet:"audience"|"format",value:string)=>{
    const next=moveVariantFacet(product.variants,selected,facet,value,audience,format);
    setAudience(next.audience);setFormat(next.format);setSku(next.sku);
  };
  const selectedName=shortVariantLabel(selected);
  const selectedAudience=variantAudience(selected);
  const selectedFormat=variantPaperFormat(selected);
  const quoteLabel=<>Liên hệ báo giá <span aria-hidden="true">→</span></>;
  const specs=selected.specifications;
  const extraInfo:{label:string;value:string}[]=[];
  if(specs.binding)extraInfo.push({label:"Đóng gáy",value:specs.binding});
  if(specs.packaging?.saleUnit)extraInfo.push({label:"Đơn vị bán",value:specs.packaging.saleUnit});
  if(specs.packaging?.unitsPerPack!==undefined)
    extraInfo.push({label:"Đơn vị/gói",value:String(specs.packaging.unitsPerPack)});
  if(specs.packaging?.unitsPerCarton!==undefined)
    extraInfo.push({label:"Đơn vị/thùng",value:String(specs.packaging.unitsPerCarton)});
  const info=<>
      <p className="catalog-overline">SẢN PHẨM FUTUREBOOK</p>
      <h1>{product.name}</h1>
      {product.description&&<p className="catalog-detail__description">{product.description}</p>}
      <p className="catalog-detail__count">{product.variants.length} mã sản phẩm</p>
      <div className="catalogue-options">
        {(facets.audiences.length>0||facets.formats.length>0)&&<div className="catalogue-facets">
          {facets.audiences.length>0&&<fieldset className="catalogue-option-group">
            <legend>Nhóm sản phẩm</legend>
            <div className="catalogue-option-choices">
              {facets.audiences.map(group=><FacetChoice key={group} glass={glass} label={group}
                active={audience===group} onClick={()=>selectFacet("audience",group)}/>)}
            </div>
          </fieldset>}
          {facets.formats.length>0&&<fieldset className="catalogue-option-group">
            <legend>Khổ giấy</legend>
            <div className="catalogue-option-choices">
              {facets.formats.map(size=><FacetChoice key={size} glass={glass} label={size}
                active={format===size} onClick={()=>selectFacet("format",size)}/>)}
            </div>
          </fieldset>}
          {(audience||format)&&(glass
            ? <GlassButton variant="secondary" className="catalogue-facets__reset"
                onClick={()=>{setAudience("");setFormat("");}} aria-label="Bỏ lọc, xem toàn bộ mã sản phẩm">
                Bỏ lọc
              </GlassButton>
            : <button type="button" className="catalogue-facets__reset"
                onClick={()=>{setAudience("");setFormat("");}} aria-label="Bỏ lọc, xem toàn bộ mã sản phẩm">
                Bỏ lọc
              </button>)}
        </div>}
        <fieldset className="catalogue-option-group">
          <legend>Chọn mã sản phẩm</legend>
          <div className="catalogue-variant-options">
            {choices.map(variant=><VariantChoice key={variant.sku} glass={glass} variant={variant}
              active={selected.sku===variant.sku} onClick={()=>setSku(variant.sku)}/>)}
          </div>
        </fieldset>
        <div className="catalogue-selected-summary" aria-live="polite" aria-atomic="true">
          <span className="catalogue-selected-summary__label"><span aria-hidden="true">✓</span> Đang chọn</span>
          <strong className="catalogue-selected-summary__code">Mã {selected.sku}</strong>
          <strong className="catalogue-selected-summary__name">{selectedName}</strong>
          {selectedAudience&&<span>{selectedAudience}</span>}
          {selectedFormat&&<span>{selectedFormat}</span>}
          {glass
            ? <GlassButtonLink href="/#contact" pill className="catalogue-selected-summary__action">{quoteLabel}</GlassButtonLink>
            : <Link href="/#contact" className="catalog-button catalogue-selected-summary__action">{quoteLabel}</Link>}
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
  </>;
  return <div className="catalog-detail">
    <PublishedImageGallery key={selected.sku} items={gallery} glass={glass}/>
    {glass
      ? <GlassPanel strong className="catalog-detail__info fb-glass-song-info">{info}</GlassPanel>
      : <div className="catalog-detail__info">{info}</div>}
  </div>;
}
