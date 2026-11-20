import {socialShareMetadata} from "@/lib/seo/social-share";
import type { Metadata } from "next";
import Link from "next/link";
import SeoLeadLink from "@/components/seo-lead-link";
import {ContentShell,ContentBreadcrumb,PageHeading} from "@/components/content-ui";
import CatalogueFlipbook from "./catalogue-flipbook";
import CatalogueBookDeepLink from "./catalogue-book-deep-link";
import {getPublishedCatalogueSeoBooks} from "@/lib/catalogue/seo-books";
import {SeoJsonLd} from "@/lib/seo/json-ld";
import "./flipbook.css";

export const metadata: Metadata={
  ...socialShareMetadata({title:"Catalogue | Futurebook Miền Nam",description:"Lật xem các cuốn Catalogue Futurebook Miền Nam chính thức được duyệt và phát hành.",path:"/catalogue"}),
 title:"Catalogue | Futurebook Miền Nam",
 description:"Lật xem các cuốn Catalogue Futurebook Miền Nam chính thức được duyệt và phát hành.",
  alternates: { canonical: "/catalogue" },
};
export const dynamic="force-dynamic";
export default async function CataloguePage(){
 const published=await getPublishedCatalogueSeoBooks();
 return <ContentShell>
  <ContentBreadcrumb items={[{name:"Catalogue"}]}/>
  <PageHeading eyebrow="TÀI LIỆU SẢN PHẨM" title="Catalogue Futurebook Miền Nam"
   intro="Catalogue đã được Futurebook phê duyệt."/>
  <CatalogueFlipbook/>
  {published.length>0&&<>
   <section className="fb-catalogue-seo-books" aria-labelledby="fb-catalogue-published-title">
    <h2 id="fb-catalogue-published-title">Các bộ Catalogue đã phát hành</h2>
    <ul>{published.map(book=><li key={book.id}>
     <CatalogueBookDeepLink bookId={book.id}>
      {book.title}{book.edition?" · "+book.edition:""}
     </CatalogueBookDeepLink>
    </li>)}</ul>
   </section>
   <SeoJsonLd data={{"@context":"https://schema.org","@type":"CollectionPage",
    name:"Catalogue Futurebook Miền Nam",url:"https://www.fbmn.vn/catalogue",
    mainEntity:{"@type":"ItemList",itemListElement:published.map((book,index)=>({
     "@type":"ListItem",position:index+1,name:book.title,
     url:"https://www.fbmn.vn/catalogue?book="+encodeURIComponent(book.id)
    }))}}}/>
  </>}
  <nav className="fb-catalogue-related" aria-label="Liên kết hỗ trợ Catalogue">
   <Link href="/san-pham">Xem sản phẩm Futurebook</Link>
   <SeoLeadLink href="/lien-he#thong-tin-lien-he" location="catalogue">
    Liên hệ nhận tư vấn tài liệu
   </SeoLeadLink>
  </nav>
 </ContentShell>;
}
