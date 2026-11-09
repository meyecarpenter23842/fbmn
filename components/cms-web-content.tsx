import Image from "next/image";
import Link from "next/link";
import CmsHeroCarousel from "@/components/cms-hero-carousel";
import type {PublicCmsItem,CmsWebSlot} from "@/lib/content/cms";

function imgUrl(id:string,device:"desktop"|"mobile"){
 return "/api/cms-image?id="+encodeURIComponent(id)+"&device="+device;
}
/** Only already approved Public Worker entries may reach these components. */
export function CmsBannerSlot({items,slot}:{items:PublicCmsItem[];slot:CmsWebSlot}){
 const banners=items.filter(item=>item.kind==="banner"&&item.slot===slot);
 if(!banners.length)return null;
 if(slot==="home.hero")return <CmsHeroCarousel items={banners}/>;
 return <section className={"cms-web-banners cms-web-banners--"+slot.replaceAll(".","-")}
  aria-label="Banner Futurebook đã công bố">
  {banners.map(item=><article className="cms-web-banner" key={item.id}>
    <picture className="cms-web-banner-media">
      {item.hasMobile&&<source media="(max-width: 800px)"
       srcSet={imgUrl(item.id,"mobile")}/>}
      <Image src={imgUrl(item.id,"desktop")} alt={item.title}
       width={1200} height={700} sizes="(max-width: 800px) 100vw, 75vw"
       className="cms-web-banner-img" unoptimized/>
    </picture>
    <div className="cms-web-banner-copy">
     <h2>{item.title}</h2>
     {item.summary&&<p>{item.summary}</p>}
     {item.ctaUrl&&<a href={item.ctaUrl} className="cms-web-banner-cta">Xem thêm</a>}
    </div>
   </article>)}
 </section>;
}

export function CmsFeaturedSlot({items,slot}:{items:PublicCmsItem[];slot:"home.news_featured"|"home.promotion_featured"}){
 const kind=slot==="home.news_featured"?"article":"promotion";
 const stories=items.filter(item=>item.kind===kind&&item.slot===slot);
 if(!stories.length)return null;
 return <section className="cms-web-featured" aria-label={kind==="article"?"Tin tức nổi bật":"Khuyến mãi nổi bật"}>
  <h2>{kind==="article"?"Tin tức nổi bật":"Khuyến mãi nổi bật"}</h2>
  <div className="cms-web-featured-list">
   {stories.map(story=><article className="cms-web-featured-card" key={story.id}>
    <h3><Link href={(kind==="article"?"/tin-tuc/":"/khuyen-mai/")+story.slug}>{story.title}</Link></h3>
    <p>{story.summary}</p>
    <Link href={(kind==="article"?"/tin-tuc/":"/khuyen-mai/")+story.slug}>
     {kind==="article"?"Đọc bài viết":"Xem chương trình"}
    </Link>
   </article>)}
  </div>
 </section>;
}
