"use client";
import Image from "next/image";
import type {ReactNode} from "react";
import type {CmsDevice} from "./cms-media-editor";
import type {CmsKind} from "./cms-placement-options";
import {cmsWebsiteSceneSpec} from "./cms-website-scene-map";

type Props={
 kind:CmsKind;slot:string;title:string;summary:string;ctaUrl:string;
 device:CmsDevice;image:ReactNode;
};

const NAV=["Trang chủ","Giới thiệu","Sản phẩm","Khuyến mãi","Dành cho đại lý","Tin tức","Liên hệ"];

function SiteHeaderScene({device}:{device:CmsDevice}){
 return <header className="cms-site-header">
  <div className="cms-site-header-row">
   <Image src="/brand/fbmn-official-logo.webp" width={300} height={84} alt="Futurebook Miền Nam"
    className="cms-site-logo" unoptimized/>
   {device==="desktop"?<>
    <div className="cms-site-search">Tìm sản phẩm: vở A4, vở B5, sổ tay...</div>
    <div className="cms-site-actions"><span>Thông tin liên hệ<br/><strong>Đang cập nhật</strong></span>
     <span>Tài khoản</span><span>Giỏ hàng</span></div>
   </>:<span className="cms-site-mobile-tools" aria-hidden="true">⌕　▢　☰</span>}
  </div>
  {device==="desktop"&&<nav className="cms-site-navigation" aria-label="Các mục điều hướng Website trong bản xem trước">
   <span className="cms-site-catalog-link">☰ Danh mục sản phẩm</span>
   {NAV.map(item=><span key={item}>{item}</span>)}
   <span>Tải app</span>
  </nav>}
 </header>;
}

function SiteFooterScene(){
 return <footer className="cms-site-footer">
  <strong>Futurebook Miền Nam</strong>
  <span>Khám phá: Giới thiệu · Danh mục sản phẩm · Tin tức · Khuyến mãi</span>
  <span>Hỗ trợ: Dành cho đại lý · Liên hệ</span>
 </footer>;
}

function WebsiteStory({kind,title,summary}:{kind:CmsKind;title:string;summary:string}){
 const promotion=kind==="promotion";
 return <article className="cms-site-story-card">
  <p className="cms-site-story-eyebrow">{promotion?"CHƯƠNG TRÌNH ĐÃ DUYỆT":"Ngày đăng khi được duyệt"}</p>
  <h3>{title.trim()||"Tiêu đề nội dung chưa nhập"}</h3>
  <p>{summary.trim()||"Chưa có mô tả ngắn"}</p>
  <span className="cms-site-story-link">{promotion?"Xem chương trình":"Đọc bài viết"}</span>
 </article>;
}

function BannerAsset({title,summary,ctaUrl,image}:{title:string;summary:string;ctaUrl:string;image:ReactNode}){
 return <div className="cms-site-banner">
  <div className="cms-site-banner-art">{image}</div>
  <div className="cms-site-banner-copy">
   <strong>{title.trim()||"Tiêu đề banner chưa nhập"}</strong>
   {summary.trim()&&<p>{summary}</p>}
   {ctaUrl.trim()&&<span className="cms-site-banner-action">Xem thêm</span>}
  </div>
 </div>;
}
function CmsSlot({kind,title,summary,ctaUrl,image,caption}:Omit<Props,"slot"|"device">&{caption:string}){
 return <div className="cms-site-slot" data-visual-status="planned">
  <span className="cms-site-slot-tag">{caption} · CMS chưa xuất bản</span>
  {kind==="banner"||kind==="popup"?
   <BannerAsset title={title} summary={summary} ctaUrl={ctaUrl} image={image}/>:
   <WebsiteStory kind={kind} title={title} summary={summary}/>}
 </div>;
}

function ProductContext(){
 return <div className="cms-site-products-context" aria-label="Bố cục thẻ sản phẩm, không có dữ liệu SKU minh họa">
  {[1,2,3].map(n=><div className="cms-site-product-frame" aria-hidden="true" key={n}>
   <span className="cms-site-product-image"/><span className="cms-site-product-line"/>
   <span className="cms-site-product-line cms-site-product-line--short"/>
  </div>)}
 </div>;
}

export default function CmsWebsiteScene({kind,slot,title,summary,ctaUrl,image,device}:Props){
 const spec=cmsWebsiteSceneSpec(kind,slot);
 if(!spec)return <div className="cms-site-no-slot" role="status">
  {slot?"Vị trí CMS chưa hợp lệ với loại nội dung này.":"Chưa chọn vị trí. Chọn Trang và Vị trí ở bước 2 để xem đúng bố cục."}
 </div>;
 const home=spec.page==="home",category=spec.page==="category";
 const article=spec.page==="news",promotion=spec.page==="promotions";
 const popup=kind==="popup";
 const featured=slot==="home.news_featured"||slot==="home.promotion_featured";
 const slotView=(caption:string)=><CmsSlot kind={kind} title={title} summary={summary}
  ctaUrl={ctaUrl} image={image} caption={caption}/>;
 return <div className={"cms-site-frame cms-site-frame--"+device} data-cms-preview-slot={slot}
  aria-label={"Bố cục Website Futurebook: "+spec.path}>
  <SiteHeaderScene device={device}/>
  <main className="cms-site-body">
   {home&&<>
    <section className="cms-site-hero" aria-label="Hero cố định của Website">
     <div className="cms-site-hero-copy">
      <span>FUTUREBOOK MIỀN NAM</span>
      <h2>VỞ VIẾT<br/>FUTUREBOOK<br/>MIỀN NAM</h2>
      <p>Đồng hành cùng tri thức<br/>Kiến tạo tương lai</p>
      <small>Thông tin rõ ràng · Mẫu mã đa dạng · Dành cho đại lý</small>
     </div>
     <div className="cms-site-hero-art">
      {slot==="home.hero"?<div className="cms-site-hero-cms-media" aria-label="Ảnh CMS trong vùng Hero">
       {image}
      </div>:<span>Vùng hình Hero cố định trên Website</span>}
     </div>
    </section>
    <section className="cms-site-categories" aria-label="Dải danh mục theo Website">
     <div className="cms-site-category-tiles">
      {["Vở A4","Vở B5","Vở kẻ ngang","Vở góc phố","Vở bìa bồi","Văn phòng phẩm"]
       .map(label=><span key={label}>{label}</span>)}
     </div>
    </section>
    <section className="cms-site-featured">
     <h2>Sản phẩm nổi bật</h2>
     <ProductContext/>
    </section>
    {slot==="home.after_products"&&slotView("Sau Sản phẩm nổi bật")}
    {featured&&<section className="cms-site-featured-planned">
     <h2>{kind==="article"?"Tin nổi bật":"Khuyến mãi nổi bật"}</h2>
     {slotView("Mục nổi bật chưa tồn tại trên Website live")}
    </section>}
    <div className="cms-site-promo-row"><span>Vở A4</span><span>Vở B5</span></div>
   </>}
   {category&&<div className="cms-site-content-wrap">
    <div className="cms-site-breadcrumb">Trang chủ / Sản phẩm / Danh mục</div>
    {slot==="category.header"&&slotView("Trước khu lọc và sản phẩm")}
    <div className="cms-site-catalog-layout">
     <aside className="cms-site-filter">
      <strong>Lọc sản phẩm</strong>
      <span>Tìm theo tên hoặc SKU</span><span>Nhóm sản phẩm</span>
      <span>Khổ giấy</span><span>Định lượng giấy (gsm)</span>
     </aside>
     <section className="cms-site-results">
      <h2>Sản phẩm đã xác minh</h2><ProductContext/>
     </section>
    </div>
   </div>}
   {(article||promotion)&&<div className="cms-site-content-wrap">
    <div className="cms-site-breadcrumb">Trang chủ / {article?"Tin tức":"Khuyến mãi"}</div>
    <div className="cms-site-story-grid">
     {slotView(article?"Thẻ Tin tức trong danh sách":"Thẻ Khuyến mãi trong danh sách")}
    </div>
    <p className="cms-site-story-note">Thẻ trên Website chỉ có nội dung chữ. Ảnh CMS được quản lý riêng phía trên.</p>
   </div>}
   {popup&&<div className="cms-site-overlay">
    <div className="cms-site-popup" role="group" aria-label="Mô phỏng Popup marketing">
     <div className="cms-site-popup-top"><strong>Thông tin</strong><span aria-hidden="true">×</span></div>
     {slotView("Popup marketing dự kiến")}
    </div>
   </div>}
  </main>
  <SiteFooterScene/>
  <div className="cms-site-scene-notice" role="status">
   <strong>Chỉ xem trước trong Admin — không phải Website đã xuất bản.</strong>
   <span>{spec.description}</span>
   <span>Đối chiếu bố cục: <code>{spec.anchor}</code> · đường dẫn <code>{spec.path}</code>.</span>
   {slot==="all.entry"&&<span>Popup toàn Website: khung này dùng trang chủ làm đại diện, không phải giới hạn ở trang chủ.</span>}
   {device==="mobile"&&<span>Chế độ mobile dùng header thu gọn và bố cục một cột theo breakpoint Website.</span>}
  </div>
 </div>;
}
