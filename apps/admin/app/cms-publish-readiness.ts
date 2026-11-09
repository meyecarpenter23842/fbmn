/** C4 CMS preflight: mirrors server publish guards; never changes authorization or audit. */
export type CmsPublishKind="banner"|"popup"|"article"|"promotion";
export type CmsPublishIssue={
 code:string;label:string;step:0|1|2
};
export type CmsPublishInput={
 kind:CmsPublishKind;
 title?:string|null;slug?:string|null;summary?:string|null;cta_url?:string|null;
 source_ref?:string|null;
 channel_targets?:readonly string[];
 placements?:{public_web?:string|null}|null;
 has_desktop?:boolean;has_mobile?:boolean;
 incomplete_slide_count?:number;
 starts_at?:string|null;ends_at?:string|null;
};
const WEB_SLOTS:Record<CmsPublishKind,readonly string[]>={
 banner:["home.hero","home.after_products","category.header"],
 popup:["home.entry","category.entry","all.entry"],
 article:["news.list","home.news_featured"],
 promotion:["promotions.list","home.promotion_featured"]
};
export function cmsPublishIssues(item:CmsPublishInput,now=Date.now()):CmsPublishIssue[]{
 const issues:CmsPublishIssue[]=[];
 const add=(code:string,label:string,step:0|1|2)=>issues.push({code,label,step});
 if(!item.title?.trim()||item.title.trim().length<2)
  add("title","Tiêu đề chưa hợp lệ",0);
 if(!item.slug?.trim()||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug))
  add("slug","Đường dẫn chưa hợp lệ",0);
 if(!item.source_ref?.trim())
  add("source","Nguồn/ghi chú duyệt chưa có",0);
 const channels=item.channel_targets??[];
 if(channels.length!==1||channels[0]!=="public_web")
  add("channel","Chỉ chọn Website Futurebook",1);
 if(!item.placements?.public_web||
    !WEB_SLOTS[item.kind].includes(item.placements.public_web))
  add("placement","Chưa chọn vị trí Website hợp lệ",1);
 if(item.kind==="banner"||item.kind==="popup"){
  if(item.has_desktop!==true)add("desktop","Thiếu ảnh Desktop WebP",2);
  if(item.has_mobile!==true)add("mobile","Thiếu ảnh Mobile WebP",2);
 }
 if(item.kind==="banner"&&item.placements?.public_web==="home.hero"&&
    (item.incomplete_slide_count??0)>0)
  add("slides","Slide mới thiếu ảnh Desktop/Mobile",2);
 if(item.kind==="promotion"&&!item.ends_at)
  add("expiry","Khuyến mãi chưa có ngày kết thúc",1);
 const start=item.starts_at?Date.parse(item.starts_at):null;
 const end=item.ends_at?Date.parse(item.ends_at):null;
 if(start!==null&&!Number.isFinite(start)||
    end!==null&&!Number.isFinite(end)||
    start!==null&&end!==null&&start>end)
  add("schedule","Lịch hiển thị không hợp lệ",1);
 else if(end!==null&&end<now)
  add("expired","Lịch hiển thị đã kết thúc",1);
 return issues;
}
export function cmsPublishWarnings(item:CmsPublishInput):string[]{
 const warnings:string[]=[];
 if(!item.summary?.trim())warnings.push("Nên bổ sung mô tả ngắn để khách hiểu nội dung.");
 if((item.kind==="banner"||item.kind==="popup")&&!item.cta_url?.trim())
  warnings.push("Có thể thêm liên kết CTA nếu cần dẫn đến trang sản phẩm.");
 return warnings;
}
