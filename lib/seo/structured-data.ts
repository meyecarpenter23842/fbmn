// SEO02A: derive all discoverable data only from the published read model.
// Do not project NET/dealer prices, inventory, ratings, or unapproved offers.
import type {Metadata} from "next";
import type {PublicProduct,PublicCatalog} from "@/lib/catalog/schema";
import type {PublicArticle} from "@/lib/content/schema";
import {getPublishedProductImageUrl} from "@/lib/catalog/product-image";

export const SEO_ORIGIN="https://www.fbmn.vn";
const BRAND="Futurebook Miền Nam";
const absolute=(path:string)=>new URL(path,SEO_ORIGIN).href;
const text=(value:string,max:number)=>value.trim().replace(/\s+/g," ").slice(0,max);

export function productSeoDescription(product:PublicProduct):string{
 const supplied=text(product.description??"",300);
 if(supplied)return supplied;
 const specifications=[...new Set(product.variants.flatMap(v=>
  [v.specifications.paperSize,v.specifications.pageCount?String(v.specifications.pageCount)+" trang":undefined]
   .filter((s):s is string=>typeof s==="string"&&s.trim().length>0)))].slice(0,4);
 return text("Thông tin "+product.name+(specifications.length?": "+specifications.join(", "):"")+
  ". Xem mã hàng, quy cách và hình ảnh đã công khai tại Futurebook Miền Nam.",300);
}
export function productSeoImages(product:PublicProduct):string[]{
 const unique=new Set<string>();
 for(const item of product.media.slice(0,20)){
  const path=getPublishedProductImageUrl(item.r2Key,process.env.NEXT_PUBLIC_MEDIA_BASE_URL);
  if(path)unique.add(absolute(path));
  if(unique.size>=4)break;
 }
 return [...unique];
}
// Owner-selected Open Graph photos may be any published variant, not only the
// first four images chosen for the default SEO metadata preview.
export function productApprovedSeoImages(product:PublicProduct):string[]{
 const unique=new Set<string>();
 for(const item of product.media){
  const path=getPublishedProductImageUrl(item.r2Key,process.env.NEXT_PUBLIC_MEDIA_BASE_URL);
  if(path)unique.add(absolute(path));
 }
 return [...unique];
}
export function productMetadata(product:PublicProduct):Metadata{
 const title=text(product.name,160)+" | "+BRAND;
 const description=productSeoDescription(product);
 const url="/san-pham/"+encodeURIComponent(product.slug);
 const images=productSeoImages(product);
 return {title,description,alternates:{canonical:url},
  openGraph:{type:"website",title,description,url,siteName:BRAND,...(images.length?{images}: {})}};
}
export function categoryMetadata(category:PublicCatalog["categories"][number]):Metadata{
 const title=category.name+" | "+BRAND;
 const description="Danh mục "+category.name+". Tra cứu sản phẩm và quy cách đã công khai tại Futurebook Miền Nam.";
 const url="/danh-muc/"+encodeURIComponent(category.slug);
 return {title,description,alternates:{canonical:url},
  openGraph:{type:"website",title,description,url,siteName:BRAND}};
}
export function articleMetadata(article:PublicArticle):Metadata{
 const title=article.title+" | "+BRAND;
 const description=text(article.summary,400);
 const url="/tin-tuc/"+encodeURIComponent(article.slug);
 return {title,description,alternates:{canonical:url},
  openGraph:{type:"article",title,description,url,siteName:BRAND,publishedTime:article.publishedAt}};
}
export function organizationSchema():Record<string,unknown>{
 return {"@context":"https://schema.org","@type":"Organization",
  name:BRAND,url:SEO_ORIGIN,logo:absolute("/brand/fbmn-mark.svg?v=20261104")};
}
export function breadcrumbSchema(items:Array<{name:string;path:string}>):Record<string,unknown>{
 return {"@context":"https://schema.org","@type":"BreadcrumbList",
  itemListElement:items.map((item,i)=>({"@type":"ListItem",position:i+1,
   name:item.name,item:absolute(item.path)}))};
}
export function productSchema(product:PublicProduct):Record<string,unknown>{
 const images=productSeoImages(product);
 return {"@context":"https://schema.org","@type":"Product",
  name:product.name,description:productSeoDescription(product),
  url:absolute("/san-pham/"+encodeURIComponent(product.slug)),
  ...(images.length?{image:images}:{}),
  ...(product.variants.length===1?{sku:product.variants[0].sku}:{})};
}
export function articleSchema(article:PublicArticle):Record<string,unknown>{
 return {"@context":"https://schema.org","@type":"Article",
  headline:article.title,description:text(article.summary,400),
  datePublished:article.publishedAt,
  mainEntityOfPage:absolute("/tin-tuc/"+encodeURIComponent(article.slug)),
  publisher:{"@type":"Organization",name:BRAND,url:SEO_ORIGIN}};
}
