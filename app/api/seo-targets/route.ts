// Admin SEO target catalogue: only data already approved for the public Website.
import {getPublicCatalog} from "@/lib/catalog/adapter";
import {getPublicContent} from "@/lib/content/adapter";
import {getPublicCategoryDisplay} from "@/lib/catalog/category-display";
import {productMetadata,categoryMetadata,articleMetadata,productApprovedSeoImages,productSeoImages,SEO_ORIGIN} from "@/lib/seo/structured-data";
import {SOCIAL_IMAGE_URL} from "@/lib/seo/social-share";
import {catalogueListingCards} from "@/lib/catalog/query";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex, nofollow"};
const valid=(kind:string,slug:string)=>slug.length<=100&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)&&
 (kind==="product"?/^sku-[a-f0-9]{32}$/.test(slug):kind==="category"?/^cat-[a-f0-9]{32}$/.test(slug):true);
const mediaPath=(url:string)=>{
 try{const u=new URL(url);return u.origin===SEO_ORIGIN&&!u.search&&!u.hash&&
 /^\/api\/catalogue-image\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(u.pathname)?u.pathname:null;}catch{return null;}
};
export async function GET(request:Request){
 if(new URL(request.url).search)return Response.json({error:{code:"invalid_query"}},{status:400,headers});
 try{
  // Never offer demo records as editable production targets.
  if(process.env.FBMN_PUBLIC_API_ENABLED!=="true")throw Error("Public source disabled");
  const [catalog,content,modes]=await Promise.all([getPublicCatalog(),getPublicContent(),getPublicCategoryDisplay()]);
  const activeCategories=new Set(catalogueListingCards(catalog,modes).map(card=>card.categoryId));
  type Target={kind:string;slug:string;name:string;title:string;description:string;image:string;images:string[];searchText:string};
  const items:Target[]=[];
  const add=(kind:string,slug:string,name:string,title:unknown,description:unknown,image=SOCIAL_IMAGE_URL,images:string[]=[],searchText="")=>{
   if(!valid(kind,slug))return;
   items.push({kind,slug,name,title:typeof title==="string"?title:name,description:typeof description==="string"?description:"",
    image,images,searchText});
  };
  for(const p of catalog.products){
   const meta=productMetadata(p,catalog.categories.find(c=>c.id===p.categoryId));
   const images=productApprovedSeoImages(p).flatMap(url=>{const path=mediaPath(url);return path?[path]:[];}).slice(0,12);
   add("product",p.slug,p.name,meta.title,meta.description,productSeoImages(p)[0]||SOCIAL_IMAGE_URL,
    images,p.variants.map(v=>v.sku).join(" "));
  }
  for(const c of catalog.categories){
   if(!activeCategories.has(c.id)||c.id==="p5-uncategorized"||c.name.trim().toLocaleLowerCase("vi")==="chưa phân loại")continue;
   const meta=categoryMetadata(c,catalog,modes);
   add("category",c.slug,c.name,meta.title,meta.description);
  }
  for(const a of content.articles){const meta=articleMetadata(a);add("article",a.slug,a.title,meta.title,meta.description);}
  for(const p of content.promotions)add("promotion",p.slug,p.title,p.title+" | Futurebook Miền Nam",p.summary);
  if(new Set(items.map(x=>x.kind+":"+x.slug)).size!==items.length)throw Error("Duplicate target");
  return Response.json({data:{items}},{headers});
 }catch{return Response.json({error:{code:"seo_targets_unavailable"}},{status:503,headers});}
}
