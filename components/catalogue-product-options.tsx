"use client";

import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import type {PublicProduct} from "@/lib/catalog/schema";
import {availableVariantFacets,moveVariantFacet,variantAudience,variantPaperFormat,
  visibleVariants,shortVariantLabel,photosForSku,type ProductPhoto} from "@/lib/catalog/selection";
import PublishedImageGallery from "./published-image-gallery";
import {CatalogProductImage} from "./catalog-product-image";
import {GlassPanel,GlassChip,GlassButton,GlassButtonLink} from "./glass-ui";
import {trackWebEvent} from "@/lib/analytics/web-client";

function BookIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 5c-2.7-1.6-5.7-1.8-9-1v14c3.3-.8 6.3-.6 9 1.1M12 5c2.7-1.6 5.7-1.8 9-1v14c-3.3-.8-6.3-.6-9 1.1M12 5v14.1"/>
</svg>}

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
  if(glass) {
    // G03: visible content is the exact company code only; full specs remain accessible
    // and appear in the selected summary. No legacy catalogue classes on glass controls.
    return <GlassChip className="fb-song-sku" selected={active} aria-label={label}
      onClick={onClick}>{variant.sku}</GlassChip>;
  }
  return <button type="button" className="catalogue-variant-option"
    aria-label={label} aria-pressed={active} onClick={onClick}>
    <BookIcon/>
    <span className="catalogue-variant-option__name">{shortVariantLabel(variant)}</span>
    <span className="catalogue-variant-option__code">Mã {variant.sku}</span>
    <span className="catalogue-variant-option__mark" aria-hidden="true">{active?"✓":""}</span>
  </button>;
}

export default function CatalogueProductOptions({product,photos,glass=false,initialSku}:{
  product:PublicProduct;photos:ProductPhoto[];glass?:boolean;initialSku?:string;
}){
  const [sku,setSku]=useState(initialSku && product.variants.some(v=>v.sku===initialSku)?initialSku:product.variants[0].sku);
  const [photoIndex,setPhotoIndex]=useState(0);
  const selectSku=(nextSku:string)=>{setSku(nextSku);setPhotoIndex(0);};
  useEffect(()=>{trackWebEvent("web_sku_view",{product_key:product.slug,sku});},[product.slug,sku]);
  const [audience,setAudience]=useState("");
  const [format,setFormat]=useState("");
  const zoomDialogRef=useRef<HTMLDialogElement>(null);
  const primaryQuoteRef=useRef<HTMLAnchorElement>(null);
  const [showMobileQuote,setShowMobileQuote]=useState(false);
  // Show the quick CTA only when the primary one is outside the viewport.
  useEffect(()=>{
    if(!glass||typeof IntersectionObserver==="undefined")return;
    const target=primaryQuoteRef.current;
    if(!target)return;
    const observer=new IntersectionObserver(([entry])=>{
      setShowMobileQuote(!entry.isIntersecting);
    },{threshold:.3});
    observer.observe(target);
    return ()=>observer.disconnect();
  },[glass]);
  const selected=product.variants.find(v=>v.sku===sku)??product.variants[0];
  const facets=availableVariantFacets(product.variants);
  // Keep all real company codes reachable, including codes with incomplete facet data.
  const choices=visibleVariants(product.variants,audience,format);
  const gallery=photosForSku(photos,selected.sku).map(({src,alt})=>({src,alt}));
  const selectFacet=(facet:"audience"|"format",value:string)=>{
    const next=moveVariantFacet(product.variants,selected,facet,value,audience,format);
    setAudience(next.audience);setFormat(next.format);selectSku(next.sku);
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
    <div className={glass?"fb-song-overview":undefined}>
      {glass&&<button type="button" className="fb-song-overview-preview"
        onClick={()=>zoomDialogRef.current?.showModal()}
        disabled={gallery.length===0}
        aria-label="Phóng to ảnh sản phẩm đang chọn">
        <CatalogProductImage src={gallery[photoIndex]?.src??gallery[0]?.src??null}
          alt={gallery[photoIndex]?.alt??gallery[0]?.alt??product.name} className="catalog-image-compact"/>
      </button>}
      <div className={glass?"fb-song-overview-copy":undefined}>
        <p className={glass?"fb-song-overline":"catalog-overline"}>SẢN PHẨM FUTUREBOOK</p>
        <h1 className={glass?"fb-song-title":undefined}>{product.name}</h1>
        {product.description&&<p className={glass?"fb-song-description":"catalog-detail__description"}>{product.description}</p>}
        <p className={glass?"fb-song-count":"catalog-detail__count"}>{product.variants.length} mã sản phẩm</p>
      </div>
    </div>
    <div className={glass?"fb-song-options":"catalogue-options"}>
      {(facets.audiences.length>0||facets.formats.length>0)&&
        <div className={glass?"fb-song-facets":"catalogue-facets"}>
          {facets.audiences.length>0&&
            <fieldset className={glass?"fb-song-fieldset":"catalogue-option-group"}>
              <legend>Nhóm sản phẩm</legend>
              <div className={glass?"fb-song-facet-choices":"catalogue-option-choices"}>
                {facets.audiences.map(group=><FacetChoice key={group} glass={glass}
                  label={group} active={audience===group}
                  onClick={()=>selectFacet("audience",group)}/>)}
              </div>
            </fieldset>}
          {facets.formats.length>0&&
            <fieldset className={glass?"fb-song-fieldset":"catalogue-option-group"}>
              <legend>Khổ giấy</legend>
              <div className={glass?"fb-song-facet-choices":"catalogue-option-choices"}>
                {facets.formats.map(size=><FacetChoice key={size} glass={glass}
                  label={size} active={format===size}
                  onClick={()=>selectFacet("format",size)}/>)}
              </div>
            </fieldset>}
          {(audience||format)&&(glass
            ? <GlassButton variant="secondary" onClick={()=>{setAudience("");setFormat("");}}
                aria-label="Bỏ lọc, xem toàn bộ mã sản phẩm">Bỏ lọc</GlassButton>
            : <button type="button" className="catalogue-facets__reset"
                onClick={()=>{setAudience("");setFormat("");}}
                aria-label="Bỏ lọc, xem toàn bộ mã sản phẩm">Bỏ lọc</button>)}
        </div>}
      <fieldset className={glass?"fb-song-fieldset":"catalogue-option-group"}>
        <legend>Chọn mã sản phẩm</legend>
        <div className={glass?"fb-song-sku-grid":"catalogue-variant-options"}>
          {choices.map(variant=><VariantChoice key={variant.sku} glass={glass}
            variant={variant} active={selected.sku===variant.sku}
            onClick={()=>selectSku(variant.sku)}/>)}
        </div>
      </fieldset>
      <div className={glass?"fb-song-summary":"catalogue-selected-summary"}
        aria-live="polite" aria-atomic="true">
        <span className={glass?"fb-song-summary-label":"catalogue-selected-summary__label"}>
          {!glass&&<span aria-hidden="true">✓</span>} Đang chọn
        </span>
        <strong className={glass?"fb-song-summary-code":"catalogue-selected-summary__code"}>
          Mã {selected.sku}
        </strong>
        <strong className={glass?"fb-song-summary-name":"catalogue-selected-summary__name"}>
          {selectedName}
        </strong>
        {selectedAudience&&<span>{selectedAudience}</span>}
        {selectedFormat&&<span>{selectedFormat}</span>}
        {glass
          ? <GlassButtonLink ref={primaryQuoteRef} href="/#contact" pill className="fb-song-quote">
              {quoteLabel}
            </GlassButtonLink>
          : <Link href="/#contact" className="catalog-button catalogue-selected-summary__action">
              {quoteLabel}
            </Link>}
      </div>
      {extraInfo.length>0&&<details className={glass?"fb-song-details":"catalogue-extra-details"}>
        <summary>Thông tin thêm</summary>
        <dl>{extraInfo.map(row=><div key={row.label}>
          <dt>{row.label}</dt><dd>{row.value}</dd>
        </div>)}</dl>
      </details>}
      {selected.price?.kind==="retail"&&<p className={glass?"fb-song-price":"catalog-detail__price"}>
        {new Intl.NumberFormat("vi-VN").format(selected.price.amountVnd)+" đ"}
      </p>}
    </div>
  </>;

  return <>
    <div className={glass?"fb-song-detail":"catalog-detail"}>
      <PublishedImageGallery key={selected.sku} items={gallery} glass={glass}
        zoomDialogRef={zoomDialogRef} activeIndex={photoIndex}
        onActiveIndexChange={setPhotoIndex}/>
      {glass
        ? <GlassPanel strong={false} className="fb-song-info">{info}</GlassPanel>
        : <div className="catalog-detail__info">{info}</div>}
    </div>
    {glass&&showMobileQuote&&<div className="fb-song-mobile-cta">
      <span>Mã <strong>{selected.sku}</strong></span>
      <GlassButtonLink href="/#contact" pill>Liên hệ báo giá</GlassButtonLink>
    </div>}
  </>;
}
