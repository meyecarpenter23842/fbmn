// SEO02C. Request-local SEO policy reads from a separately gated public Worker.
// A failed enabled read must never silently default to index:true.
import {cache} from "react";
import type {Metadata} from "next";
import {SEO_ORIGIN} from "./structured-data";
import {cmsEnabled} from "@/lib/content/cms";
type Kind="product"|"category"|"article"|"promotion";
type Mode="custom"|"noindex";
export type PublishedSeoSetting={kind:Kind;slug:string;mode:Mode;title?:string;description?:string;image?:string};
export type PublishedSeoMap=ReadonlyMap<string,PublishedSeoSetting>;
const KINDS=new Set(["product","category","article","promotion"]);
const slug=/^[a-z0-9][a-z0-9-]{0,99}$/;
const clean=(v:unknown,max:number)=>typeof v==="string"&&v.length<=max&&!/[<>\x00-\x1f\x7f]/.test(v);
export const getPublishedSeo=cache(async():Promise<PublishedSeoMap>=>{
 if(process.env.FBMN_SEO02_ENABLED!=="true")return new Map();
 if(process.env.FBMN_PUBLIC_API_ENABLED!=="true")throw Error("SEO02C requires public API");
 const base=new URL(process.env.FBMN_PUBLIC_API_BASE_URL||"");
 if(base.protocol!=="https:"||base.pathname!=="/"||base.search||base.hash||
    base.username||base.password)throw Error("Invalid SEO02C API origin");
 const contentSource=cmsEnabled()?"cms":"legacy";
 const response=await fetch(base.origin+"/v1/public/seo?contentSource="+contentSource,{
  method:"GET",headers:{Accept:"application/json"},cache:"no-store",
  signal:AbortSignal.timeout(5000)
 });
 if(!response.ok)throw Error("SEO02C public API unavailable");
 if(Number(response.headers.get("content-length")||0)>8_000_000)throw Error("SEO02C oversized policy");
 const raw=await response.text();
 if(raw.length>8_000_000)throw Error("SEO02C oversized policy");
 const body=JSON.parse(raw) as {data?:{items?:unknown}};
 if(!Array.isArray(body?.data?.items)||body.data.items.length>10000)
  throw Error("Invalid SEO02C policy");
 const map=new Map<string,PublishedSeoSetting>();
 for(const rawItem of body.data.items){
  if(!rawItem||typeof rawItem!=="object"||Array.isArray(rawItem))throw Error("Invalid SEO02C entry");
  const item=rawItem as Record<string,unknown>;
  if(!KINDS.has(item.kind as string)||typeof item.slug!=="string"||!slug.test(item.slug)||
    !["custom","noindex"].includes(item.mode as string))throw Error("Invalid SEO02C entry");
  const setting:PublishedSeoSetting={kind:item.kind as Kind,slug:item.slug,mode:item.mode as Mode};
  if(setting.mode==="custom"){
   if(item.title!==undefined){
    if(!clean(item.title,180))throw Error("Invalid SEO title");
    setting.title=item.title as string;
   }
   if(item.description!==undefined){
    if(!clean(item.description,400))throw Error("Invalid SEO description");
    setting.description=item.description as string;
   }
   if(item.image!==undefined){
    if(setting.kind!=="product"||typeof item.image!=="string"||
      !/^\/api\/catalogue-image\/[0-9a-f-]{36}$/.test(item.image))throw Error("Invalid SEO image");
    setting.image=item.image;
   }
  }
  const key=setting.kind+":"+setting.slug;
  if(map.has(key))throw Error("Duplicate SEO policy");
  map.set(key,setting);
 }
 return map;
});
export const seoFor=(settings:PublishedSeoMap,kind:Kind,slug:string)=>
 settings.get(kind+":"+slug);
export const isNoindex=(settings:PublishedSeoMap,kind:Kind,slug:string)=>
 seoFor(settings,kind,slug)?.mode==="noindex";
export function applySeoSetting(base:Metadata,setting:PublishedSeoSetting|undefined,allowedImages:string[]=[]):Metadata{
 if(!setting)return base;
 if(setting.mode==="noindex")return {...base,robots:{index:false,follow:true}};
 const title=setting.title?.trim()||undefined;
 const description=setting.description?.trim()||undefined;
 const image=setting.image?SEO_ORIGIN+setting.image:undefined;
 const verifiedImage=image&&allowedImages.includes(image)?image:undefined;
 if(!title&&!description&&!verifiedImage)return base;
 const openGraph={...(base.openGraph||{}),
  ...(title?{title}:{}),...(description?{description}:{}),
  ...(verifiedImage?{images:[verifiedImage]}:{})} as Metadata["openGraph"];
 return {...base,...(title?{title}:{}),...(description?{description}:{}),openGraph};
}
