import type {MetadataRoute} from "next";
import {getPublicCatalog} from "@/lib/catalog/adapter";
import {getPublicContent} from "@/lib/content/adapter";
import {getPublishedSeo,isNoindex} from "@/lib/seo/public-settings";
import {getPublicCategoryDisplay} from "@/lib/catalog/category-display";
import {catalogueListingCards} from "@/lib/catalog/query";

// Derived from the approved public read models only: never include draft, private or protected fields.
export const dynamic="force-dynamic";
const ORIGIN="https://www.fbmn.vn";
const STATIC=[
 "/", "/san-pham", "/dai-ly", "/gioi-thieu", "/gia-cong",
 "/lien-he", "/catalogue", "/bang-tin", "/policy"
];
const safeSlug=(value:string)=>/^[a-z0-9][a-z0-9_-]{0,119}$/i.test(value);
const url=(path:string)=>ORIGIN+path;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const [catalog,content,seo,modes]=await Promise.all([
  getPublicCatalog(),getPublicContent(),getPublishedSeo(),getPublicCategoryDisplay()
 ]);
 // Match the same family/SKU display projection as category pages. A variant
 // in another category must not create a sitemap URL for an empty listing.
 const activeCategoryIds=new Set(catalogueListingCards(catalog,modes).map(card=>card.categoryId));
 const paths=[...STATIC];
 for(const category of catalog.categories){
  if(activeCategoryIds.has(category.id)&&category.id!=="p5-uncategorized"&&safeSlug(category.slug)&&
     !isNoindex(seo,"category",category.slug))
   paths.push("/danh-muc/"+encodeURIComponent(category.slug));
 }
 for(const product of catalog.products){
  if(safeSlug(product.slug)&&!isNoindex(seo,"product",product.slug))
    paths.push("/san-pham/"+encodeURIComponent(product.slug));
 }
 if(content.articles.length)paths.push("/tin-tuc");
 if(content.promotions.length)paths.push("/khuyen-mai");
 for(const item of content.articles){if(safeSlug(item.slug)&&!isNoindex(seo,"article",item.slug))
    paths.push("/tin-tuc/"+encodeURIComponent(item.slug));}
 for(const item of content.promotions){if(safeSlug(item.slug)&&!isNoindex(seo,"promotion",item.slug))
    paths.push("/khuyen-mai/"+encodeURIComponent(item.slug));}
 return [...new Set(paths)].map(path=>({url:url(path)}));
}
