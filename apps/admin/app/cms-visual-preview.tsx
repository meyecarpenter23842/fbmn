"use client";
import {CmsImagePreview,cmsMediaKey} from "./cms-media-editor";
import type {CmsChannel,CmsDevice,CmsPendingImages} from "./cms-media-editor";
import {CMS_SLOTS} from "./cms-placement-options";
import type {CmsKind} from "./cms-placement-options";

const CHANNEL_LABELS:Record<CmsChannel,string>={
 public_web:"Website",dealer_app:"App đại lý",consumer_app:"App người tiêu dùng"
};
export default function CmsVisualPreview({kind,title,summary,ctaUrl,channelTargets,placements,
 recordId,revision,pending,channel,device,onChannel,onDevice,webOnly=false}:{
 kind:CmsKind;title:string;summary:string;ctaUrl:string;channelTargets:CmsChannel[];
 placements:Partial<Record<CmsChannel,string>>;recordId:string|null;revision:number;
 pending:CmsPendingImages;channel:CmsChannel;device:CmsDevice;
 onChannel?:(v:CmsChannel)=>void;onDevice:(v:CmsDevice)=>void;webOnly?:boolean;
}){
 const current=webOnly?"public_web":channelTargets.includes(channel)?channel:channelTargets[0]??"public_web";
 const slot=placements[current]??"";
 const label=CMS_SLOTS[kind][current].find(x=>x.value===slot)?.label??"Chưa chọn vị trí";
 const file=pending[cmsMediaKey(current,device)];
 const image=<CmsImagePreview recordId={recordId} revision={revision} channel={current}
  device={device} pending={file}/>;
 const words=<div className="cms-simulation-caption">
  <strong>{title.trim()||"Tiêu đề nội dung"}</strong>
  <p>{summary.trim()||"Phần mô tả hiển thị tại vị trí đã chọn"}</p>
  {ctaUrl.trim()&&<span className="cms-simulation-link">Xem thêm</span>}
 </div>;
 const isPop=kind==="popup";
 const banner=<div className="cms-simulation-banner">
  <div className="cms-simulation-image">{image}</div>{words}
 </div>;
 const news=<div className="cms-simulation-story">
  <div className="cms-simulation-image">{image}</div>{words}
 </div>;
 const isApp=current!=="public_web";
 return <section className="cms-real-preview" aria-label="Xem trước bố cục theo kênh">
  <div className="cms-preview-toolbar">
   <div><strong>Xem trước vị trí</strong>
    <small>{label} · {CHANNEL_LABELS[current]}</small></div>
   <div className="cms-preview-controls">
    {webOnly?<span className="cms-preview-surface">Website Futurebook</span>:<select aria-label="Xem trước kênh" value={current}
     onChange={e=>onChannel?.(e.target.value as CmsChannel)}
     disabled={!channelTargets.length}>
     {channelTargets.length?channelTargets.map(ch=>
      <option key={ch} value={ch}>{CHANNEL_LABELS[ch]}</option>):
      <option value="public_web">Chưa chọn kênh</option>}
    </select>}
    <div className="cms-device-toggle" role="group" aria-label="Chế độ xem trước">
     {(["desktop","mobile"] as CmsDevice[]).map(d=>
      <button type="button" key={d} className="fb-ui-button fb-ui-button--secondary"
       aria-pressed={device===d} onClick={()=>onDevice(d)}>
       {d==="desktop"?"Desktop":"Mobile"}
      </button>)}
    </div>
   </div>
  </div>
  <div className="cms-simulation-viewport">
   <div className={"cms-simulation "+(device==="mobile"?"cms-simulation--mobile":"cms-simulation--desktop")+
    (isApp?" cms-simulation--app":"")} role="img"
    aria-label={"Bố cục minh họa "+CHANNEL_LABELS[current]+" "+label}>
    <div className="cms-simulation-header">
     <strong>{isApp?"Futurebook App":"Futurebook Miền Nam"}</strong>
     <span>{isApp?"Trang chủ":"Trang chủ · Danh mục · Tin tức"}</span>
    </div>
    {slot==="home.after_products"&&<div className="cms-simulation-skeleton" aria-hidden="true">
     <div>Khu vực sản phẩm</div><span/><span/><span/>
    </div>}
    {slot==="category.header"&&<div className="cms-simulation-category">Danh mục sản phẩm</div>}
    {slot==="home.news_featured"&&<div className="cms-simulation-category">Tin nổi bật</div>}
    {slot==="home.promotion_featured"&&<div className="cms-simulation-category">Ưu đãi nổi bật</div>}
    {slot==="news.list"&&<div className="cms-simulation-category">Tin tức</div>}
    {slot==="promotions.list"&&<div className="cms-simulation-category">Khuyến mãi</div>}
    {isPop?<div className="cms-simulation-popup-backdrop">
     <div className="cms-simulation-popup">
      <div className="cms-simulation-popup-top"><span>Thông tin</span><span aria-hidden="true">×</span></div>
      {banner}
     </div>
    </div>:kind==="banner"?banner:news}
    {["home.hero","home.banner","home.after_products","category.header"].includes(slot)&&
      <div className="cms-simulation-footer-placeholder">Nội dung tiếp theo của trang</div>}
   </div>
  </div>
  <p className="cms-preview-disclaimer">Mô phỏng vị trí theo contract và ảnh vừa chọn; chưa phải ảnh chụp trang đang chạy.
   Nội dung chỉ xuất hiện công khai sau khi kết nối API và giao diện nhận CMS.</p>
 </section>;
}
