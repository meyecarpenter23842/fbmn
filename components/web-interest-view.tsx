"use client";
import {useEffect} from "react";
import {trackWebEvent} from "@/lib/analytics/web-client";
/** Rendered exclusively after the server resolves an approved public record. */
export default function WebInterestView({kind,slug}:{kind:"category"|"product";slug:string}){
 useEffect(()=>{
  if(kind==="category")trackWebEvent("web_category_view",{category_key:slug});
  else trackWebEvent("web_product_view",{product_key:slug});
 },[kind,slug]);
 return null;
}
