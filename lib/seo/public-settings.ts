// SEO02C: server-only, request-local SEO settings from the public read model.
// If enabled and unavailable, fail closed: never silently mark a noindex page indexable.
import {cache} from "react";
import type {Metadata} from "next";
import {SEO_ORIGIN} from "./structured-data";
type SeoKind="product"|"category"|"article"|"promotion";
type SeoMode="custom"|"noindex";
export type PublishedSeoSetting={kind:SeoKind;slug:string;mode:SeoMode;title?:string;description?:string;image?:string};
type SeoMap=ReadonlyMap<string,PublishedSeoSetting>;
const kinds=new Set(["product","category","article","promotion"]);
const slugPattern=/^[a-z0-9][a-z0-9-]{0,99}$/;
const safeText=(v:unknown,max:number):v is string=>typeof v==="string"&&v.length<=max&&
 !/[<>\x00-\x1f\x7f]/.test(v);

export const getPublishedSeo=cache(async():Promise<SeoMap>=>{
 if(process.env.FBMN_SEO02_ENABLED!=="true")return new Map();
 if(process.env.FBMN_PUBLIC_API_ENABLED!=="true")throw Error("SEO02C public API not enabled");
 const origin=new URL(process.env.FBMN_PUBLIC_API_BASE_URL||"");
 if(origin.protocol!=="https:"||origin.pathname!=="/"||origin.search||origin.hash||
   origin.username||origin.password)throw Error("Invalid SEO02C origin");
 const response=await fetch(origin.origin+"/v1/public/seo",{method:"GET",
   headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error("SEO02C public data unavailable");
 if(Number(response.headers.get("content-length")||0)>8_000_000)
   throw Error("SEO02C payload too large");
 const body=await response.text();
 if(body.length>8_000_000)throw Error("SEO02C payload too large");
 const envelope=JSON.parse(body) as {data?:{items?:unknown}};
 if(!Array.isArray(envelope?.data?.items)||envelope.data.items.length>10000)
   throw Error("Invalid SEO02C payload");
 const result=new Map<string,PublishedSeoSetting>();
 for(const value of envelope.data.items){
   if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid SEO02C record");
   const item=value as Record<string,unknown>;
   if(!kinds.has(item.kind as string)||typeof item.slug!=="string"||!slugPattern.test(item.slug)||
     !["custom","noindex"].includes(item.mode as string))throw Error("Invalid SEO02C record");
   const setting:PublishedSeoSetting={kind:item.kind as SeoKind,slug:item.slug,mode:item.mode as SeoMode};
   if(setting.mode==="custom"){
     if(item.title!==undefined){
       if(!safeText(item.title,180))throw Error("Invalid SEO02C title");
       setting.title=item.title;
     }
     if(item.description!==undefined){
       if(!safeText(item.description,400))throw Error("Invalid SEO02C description");
       setting.description=item.description;
     }
     if(item.image!==undefined){
       if(setting.kind!=="product"||typeof item.image!=="string"||
         !/^\/api\/catalogue-image\/[0-9a-f-]{36}$/.test(item.image))
           throw Error("Invalid SEO02C image");
       setting.image=item.image;
     }
   }
   const key=setting.kind+":"+setting.slug;
   if(result.has(key))throw Error("Duplicate SEO02C policy");
   result.set(key,setting);
 }
 return result;
});
export function seoFor(settings:SeoMap,kind:SeoKind,slug:string){
 return settings.get(kind+":"+slug);
}
export function isNoindex(settings:SeoMap,kind:SeoKind,slug:string){
 return seoFor(settings,kind,slug)?.mode==="noindex";
}
export function applySeoSetting(base:Metadata,setting:PublishedSeoSetting|undefined,allowedImages:string[]=[]):Metadata{
 if(!setting)return base;
 if(setting.mode==="noindex")return {...base,robots:{index:false,follow:true}};
 const title=setting.title?.trim();
 const description=setting.description?.trim();
 const image=setting.image?SEO_ORIGIN+setting.image:undefined;
 const verifiedImage=image&&allowedImages.includes(image)?image:undefined;
 return {...base,...(title?{title}:{}),...(description?{description}:{}),
   openGraph:{...(base.openGraph||{}),...(title?{title}:{}),
    ...(description?{description}:{}),...(verifiedImage?{images:[verifiedImage]}:{})}};
}
