"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {trackWebEvent} from "@/lib/analytics/web-client";
import {analyticsPublicPageKey} from "@/lib/analytics/traffic-attribution";
let previousPath:string|null=null;
function classify(path:string){
 if(path==="/")return {page_type:"home"};
 if(path==="/san-pham")return {page_type:"products"};
 if(path==="/catalogue")return {page_type:"catalogue"};
 if(path==="/lien-he")return {page_type:"contact"};
 if(path==="/gia-cong")return {page_type:"outsourcing"};
 if(path==="/dai-ly")return {page_type:"dealer"};
 if(path.startsWith("/tin-tuc"))return {page_type:"news"};
 if(path.startsWith("/khuyen-mai"))return {page_type:"promotion"};
 if(path.startsWith("/danh-muc/"))return {page_type:"category"};
 if(path.startsWith("/san-pham/"))return {page_type:"product"};
 return {page_type:"other"};
}
export default function WebAnalytics(){
 const pathname=usePathname();
 useEffect(()=>{
  // One pageview per router pathname change; suppress StrictMode duplicate mounts.
  // Query strings, fragment identifiers, referrers and form content are never captured.
  if(!pathname||previousPath===pathname)return;
  previousPath=pathname;
  if(pathname==="/policy")return;
  const info=classify(pathname);
  trackWebEvent("web_page_view",{
   page_type:info.page_type,
   ...(analyticsPublicPageKey(pathname)?{page_key:analyticsPublicPageKey(pathname)}:{})
  });

 },[pathname]);
 return null;
}
