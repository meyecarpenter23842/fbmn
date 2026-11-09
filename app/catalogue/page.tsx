import type {Metadata} from "next";
import {SiteHeader} from "@/components/site-header";
import {SiteFooter} from "@/components/site-footer";
import CatalogueFlipbook from "./catalogue-flipbook";
import "./flipbook.css";

export const metadata:Metadata={
 title:"Catalogue | Futurebook Miền Nam",
 description:"Lật xem các cuốn Catalogue Futurebook Miền Nam chính thức được duyệt và phát hành.",
};
export default function CataloguePage(){
 return <>
  <SiteHeader/>
  <main className="fb-catalogue-route" id="noi-dung-catalogue">
   <h1 className="sr-only">Catalogue Futurebook Miền Nam</h1>
   <CatalogueFlipbook/>
  </main>
  <SiteFooter/>
 </>;
}
