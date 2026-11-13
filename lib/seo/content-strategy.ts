// SEO03: search-intent guidance based solely on approved public product groups.
// Keywords are editorial targets, not invented inventory or search-volume metrics.
import type {PublicCatalog,PublicProduct,ProductGroup} from "@/lib/catalog/schema";
import {catalogueListingCards} from "@/lib/catalog/query";

export const SEO_GROUP_LABELS:Readonly<Record<ProductGroup,string>>={
 school_notebook:"Tập học sinh",
 student_notebook:"Tập sinh viên",
 memo_book:"Sổ ghi chép",
 stationery:"Văn phòng phẩm"
};
export const SEO_GROUP_INTENT:Readonly<Record<ProductGroup,string>>={
 school_notebook:"tập học sinh, vở học sinh",
 student_notebook:"tập sinh viên, vở sinh viên",
 memo_book:"sổ ghi chép, sổ tay",
 stationery:"văn phòng phẩm"
};
export type PublicCategory=PublicCatalog["categories"][number];

type DisplayMode=Readonly<Record<string,"family"|"sku">>;
export function matchingPublishedVariants(catalog:PublicCatalog,category:PublicCategory,modes:DisplayMode={}){
 // The same cards as CatalogListing, including SKU-only categories.
 return catalogueListingCards(catalog,modes).filter(card=>card.categoryId===category.id)
  .flatMap(product=>product.variants.map(variant=>({product,variant})));
}
export function categorySeoSummary(category:PublicCategory,catalog:PublicCatalog,modes:DisplayMode={}):string{
 const entries=matchingPublishedVariants(catalog,category,modes);
 const products=new Set(entries.map(entry=>entry.product.id));
 const sizes=[...new Set(entries.map(x=>x.variant.specifications.paperSize?.trim()).filter((x):x is string=>Boolean(x)))].slice(0,4);
 const pages=[...new Set(entries.map(x=>x.variant.specifications.pageCount).filter((x):x is number=>typeof x==="number"&&x>0))].sort((a,b)=>a-b).slice(0,4);
 const base=category.name+" thuộc nhóm "+SEO_GROUP_LABELS[category.group]+".";
 if(!products.size)return base+" Danh mục chưa có sản phẩm được công khai; vui lòng tham khảo các danh mục khác.";
 const specs=[sizes.length?"khổ "+sizes.join(", "):"",pages.length?"số trang "+pages.join(", "):""].filter(Boolean);
 return base+" Đang hiển thị "+products.size+" dòng sản phẩm đã công khai"+
  (specs.length?", có quy cách "+specs.join("; "):"")+
  ". Chọn sản phẩm để xem mã hàng, hình ảnh và gửi yêu cầu báo giá.";
}
export function productSeoImageAlt(product:PublicProduct,alt:string,sku?:string):string{
 const actual=alt.trim();
 // Respect precise approved ALT values; replace only generic placeholders.
 if(actual&&!/^(?:ảnh|hình)(?:\s+(?:sản phẩm|bìa|mẫu))?(?:\s+\d+)?$/iu.test(actual))
   return actual;
 return ("Ảnh "+product.name+(sku?", mã "+sku:"")+" – Futurebook Miền Nam").slice(0,180);
}
