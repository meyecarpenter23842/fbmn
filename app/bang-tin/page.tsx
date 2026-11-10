import type {Metadata} from "next";
import Link from "next/link";
import {GlassChipLink} from "@/components/glass-ui";
import {ContentShell,ContentBreadcrumb,PageHeading,WaitingForApproval,ArticlePreview,PromotionPreview} from "@/components/content-ui";
import {getPublicContent} from "@/lib/content/adapter";
import {buildNewsHubItems,type NewsHubFilter} from "@/lib/content/news-hub";

export const dynamic="force-dynamic";
export const metadata: Metadata ={
 title:"Bảng tin | Futurebook Miền Nam",
 description:"Tin tức và chương trình khuyến mãi Futurebook Miền Nam đã được xác minh, duyệt và công bố.",
 alternates:{canonical:"/bang-tin"}
};
type Props={searchParams:Promise<{loai?:string}>};
const FILTERS:{value:NewsHubFilter;label:string;href:string}[]=[
 {value:"all",label:"Tất cả",href:"/bang-tin"},
 {value:"news",label:"Tin tức",href:"/bang-tin?loai=tin-tuc"},
 {value:"promotions",label:"Khuyến mãi",href:"/bang-tin?loai=khuyen-mai"}
];
export default async function NewsHubPage({searchParams}:Props){
 const [{loai},content]=await Promise.all([searchParams,getPublicContent()]);
 const active:NewsHubFilter=loai==="tin-tuc"?"news":loai==="khuyen-mai"?"promotions":"all";
 const items=buildNewsHubItems(content,active);
 return <ContentShell>
  <ContentBreadcrumb items={[{name:"Bảng tin"}]}/>
  <PageHeading eyebrow="CẬP NHẬT FUTUREBOOK" title="Bảng tin Futurebook Miền Nam"
   intro="Tin tức, thông báo và chương trình đã công bố"/>
  <section className="news-hub" aria-labelledby="news-hub-heading">
   <div className="news-hub-heading">
    <div><p className="content-eyebrow">THÔNG TIN & ƯU ĐÃI</p>
     <h2 id="news-hub-heading">Bảng tin Futurebook</h2>
     <p>Chỉ hiển thị nội dung đã được xác minh, phê duyệt và còn hiệu lực.</p>
    </div>
    <nav className="news-hub-filters" aria-label="Lọc bài viết">
     {FILTERS.map(item=><GlassChipLink key={item.value} href={item.href}
      selected={active===item.value}>{item.label}</GlassChipLink>)}
    </nav>
   </div>
   {items.length?<div className="content-card-grid" aria-live="polite">
    {items.map(item=>item.kind==="news"?
     <ArticlePreview article={item.article} key={"news:"+item.slug}/>:
     <PromotionPreview promotion={item.promotion} key={"promotion:"+item.slug}/>)}
   </div>:<WaitingForApproval title="Chưa có bài viết được công bố">
    {active==="news"?"Tin tức được xuất bản sẽ xuất hiện tại đây.":
     active==="promotions"?"Chưa có chương trình khuyến mãi đã duyệt đang còn hiệu lực.":
     "Bảng tin sẽ cập nhật khi có tin tức hoặc chương trình được phê duyệt. Không hiển thị dữ liệu mẫu."}
   </WaitingForApproval>}
   <nav className="news-hub-legacy-links" aria-label="Đường dẫn nội dung">
    <Link href="/tin-tuc">Xem riêng trang Tin tức</Link>
    <Link href="/khuyen-mai">Xem riêng trang Khuyến mãi</Link>
   </nav>
  </section>
 </ContentShell>;
}
