// Server-only Website CMS consumer. Must never accept private CMS fields or R2 keys.
export type CmsWebKind="banner"|"popup"|"article"|"promotion";
export type CmsWebSlot=
 "home.hero"|"home.after_products"|"category.header"|"home.entry"|"category.entry"|
 "all.entry"|"news.list"|"home.news_featured"|"promotions.list"|"home.promotion_featured";
export interface PublicCmsItem{
 id:string;kind:CmsWebKind;slug:string;title:string;summary:string;paragraphs:string[];
 ctaUrl:string|null;slot:CmsWebSlot;sortOrder:number;publishedAt:string;
 startsAt:string|null;endsAt:string|null;hasDesktop:boolean;hasMobile:boolean;
 popupDelaySeconds:number;popupCooldownMinutes:number;popupMaxPerSession:number;
}
type Rec=Record<string,unknown>;
const KIND=new Set(["banner","popup","article","promotion"]);
const SLOTS:Record<CmsWebKind,Set<string>>={
 banner:new Set(["home.hero","home.after_products","category.header"]),
 popup:new Set(["home.entry","category.entry","all.entry"]),
 article:new Set(["news.list","home.news_featured"]),
 promotion:new Set(["promotions.list","home.promotion_featured"])
};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function obj(value:unknown):Rec{
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid public CMS");
 return value as Rec;
}
function string(value:unknown,max=3000,empty=false):string{
 if(typeof value!=="string"||value.length>max||(!empty&&!value.trim()))throw Error("Invalid CMS text");
 return value;
}
function integer(value:unknown,low:number,high:number):number{
 if(typeof value!=="number"||!Number.isSafeInteger(value)||value<low||value>high)
  throw Error("Invalid CMS number");
 return value;
}
function urlFor(input:string):string{
 const url=new URL(input);
 if(url.protocol!=="https:"||url.username||url.password||url.port||url.pathname!=="/"||
    url.hash||url.search||!url.hostname||/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/i.test(url.hostname))
  throw Error("Invalid CMS source");
 return url.origin;
}
function item(value:unknown):PublicCmsItem{
 const o=obj(value);
 if(!KIND.has(o.kind as string)||!UUID.test(String(o.id??"")))throw Error("Invalid CMS entry");
 const kind=o.kind as CmsWebKind,slot=string(o.slot,80) as CmsWebSlot;
 if(!SLOTS[kind].has(slot))throw Error("Invalid CMS slot");
 if(!Array.isArray(o.paragraphs)||o.paragraphs.length>30)throw Error("Invalid CMS paragraphs");
 const paragraphs=o.paragraphs.map(v=>string(v));
 const nullable=(x:unknown):string|null=>x==null?null:string(x,500,true);
 const publishedAt=string(o.publishedAt,60);
 if(!Number.isFinite(Date.parse(publishedAt)))throw Error("Invalid CMS publication");
 const startsAt=nullable(o.startsAt),endsAt=nullable(o.endsAt);
 if(startsAt&&!Number.isFinite(Date.parse(startsAt)))throw Error("Invalid CMS schedule");
 if(endsAt&&!Number.isFinite(Date.parse(endsAt)))throw Error("Invalid CMS schedule");
 return {
  id:o.id as string,kind,slug:string(o.slug,100),title:string(o.title,160),
  summary:string(o.summary,400,true),paragraphs,
  ctaUrl:nullable(o.ctaUrl),slot,
  sortOrder:integer(o.sortOrder,0,10000),publishedAt,startsAt,endsAt,
  hasDesktop:o.hasDesktop===true,hasMobile:o.hasMobile===true,
  popupDelaySeconds:integer(o.popupDelaySeconds,0,120),
  popupCooldownMinutes:integer(o.popupCooldownMinutes,0,43200),
  popupMaxPerSession:integer(o.popupMaxPerSession,1,20)
 };
}
export function cmsEnabled():boolean{
 return process.env.FBMN_CMS_PUBLIC_ENABLED==="true"&&process.env.FBMN_PUBLIC_API_ENABLED==="true";
}
export async function getPublicCms():Promise<PublicCmsItem[]>{
 if(!cmsEnabled())return [];
 const origin=urlFor(process.env.FBMN_PUBLIC_API_BASE_URL??"");
 const response=await fetch(origin+"/v1/public/cms",{
  method:"GET",headers:{Accept:"application/json"},cache:"no-store",
  signal:AbortSignal.timeout(5000)
 });
 if(!response.ok)throw Error("Public CMS unavailable: "+response.status);
 const size=response.headers.get("content-length");
 if(size&&Number(size)>2_000_000)throw Error("Public CMS payload too large");
 const data=await response.text();
 if(data.length>2_000_000)throw Error("Public CMS payload too large");
 const envelope=obj(JSON.parse(data)),contents=obj(envelope.data);
 if(!Array.isArray(contents.items)||contents.items.length>500)throw Error("Invalid CMS entries");
 return contents.items.map(item);
}
/** Non-critical banner/editorial surfaces must not break the storefront.
 * Public API routes still call getPublicCms() directly and return 503 on failure.
 */
export async function getOptionalPublicCms():Promise<PublicCmsItem[]>{
 if(!cmsEnabled())return [];
 try{return await getPublicCms();}
 catch{
  // Keep logs free of CMS payload, URLs, identities and private metadata.
  console.error("[Futurebook CMS] optional public content temporarily unavailable");
  return [];
 }
}
