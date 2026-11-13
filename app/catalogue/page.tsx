import type { Metadata } from "next";
import Link from "next/link";
import {ContentShell,ContentBreadcrumb,PageHeading} from "@/components/content-ui";
import CatalogueFlipbook from "./catalogue-flipbook";
import "./flipbook.css";

export const metadata: Metadata={
 title:"Catalogue | Futurebook Miền Nam",
 description:"Lật xem các cuốn Catalogue Futurebook Miền Nam chính thức được duyệt và phát hành.",
  alternates: { canonical: "/catalogue" },
};
export default function CataloguePage(){
 return <ContentShell>
  <ContentBreadcrumb items={[{name:"Catalogue"}]}/>
  <PageHeading eyebrow="TÀI LIỆU SẢN PHẨM" title="Catalogue Futurebook Miền Nam"
   intro="Catalogue đã được Futurebook phê duyệt."/>
  <CatalogueFlipbook/>
  <nav className="fb-catalogue-related" aria-label="Liên kết hỗ trợ Catalogue">
   <Link href="/san-pham">Xem sản phẩm Futurebook</Link>
   <Link href="/lien-he#thong-tin-lien-he">Liên hệ nhận tư vấn tài liệu</Link>
  </nav>
 </ContentShell>;
}
