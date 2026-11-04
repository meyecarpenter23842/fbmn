import type {PublicCatalog,PublicProduct} from "./schema";
// Keep this pure scorer independently testable in Node (no extensionless runtime imports).
function foldVietnamese(value:string):string{
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[đĐ]/g,"d").toLocaleLowerCase("vi-VN")
    .replace(/\s+/g," ").trim();
}

const COMMON=new Set(["vo","tap","so","giay","quyen","trang","mau","san","pham","hoc","sinh","vien"]);
function tokens(value:string):string[]{
  return foldVietnamese(value).split(/[^a-z0-9]+/).filter(t=>t.length>=4&&!COMMON.has(t));
}
function sharedTokens(a:string,b:string):boolean{
  const keys=new Set(tokens(a));return tokens(b).some(token=>keys.has(token));
}
function distinctSpecs(product:PublicProduct,key:"paperSize"|"ruling"):Set<string>{
  return new Set(product.variants.map(v=>v.specifications[key])
    .filter((v):v is string=>Boolean(v)).map(foldVietnamese));
}
function overlaps(a:Set<string>,b:Set<string>):boolean{
  for(const item of a)if(b.has(item))return true;
  return false;
}
/** Suggestions are only existing public catalogue families, never synthesized SKUs/media. */
export function relatedProducts(catalog:PublicCatalog,current:PublicProduct,limit=12):{
  title:string;items:PublicProduct[]
}{
  const category=catalog.categories.find(c=>c.id===current.categoryId);
  const validCategory=category&&category.name.toLocaleLowerCase("vi")!=="chưa phân loại"
    &&category.id!=="p5-uncategorized";
  const size=distinctSpecs(current,"paperSize");
  const ruling=distinctSpecs(current,"ruling");
  const candidates=catalog.products.filter(p=>p.id!==current.id&&p.slug!==current.slug&&p.variants.length>0)
    .map(product=>{
      const otherCategory=catalog.categories.find(c=>c.id===product.categoryId);
      let score=0;
      if(validCategory&&product.categoryId===current.categoryId)score+=6;
      else if(validCategory&&category?.group!=="stationery"&&otherCategory?.group===category?.group)score+=3;
      if(sharedTokens(current.name,product.name))score+=4;
      if(overlaps(size,distinctSpecs(product,"paperSize")))score+=2;
      if(overlaps(ruling,distinctSpecs(product,"ruling")))score+=1;
      return {product,score};
    }).sort((a,b)=>b.score-a.score||a.product.name.localeCompare(b.product.name,"vi")||a.product.slug.localeCompare(b.product.slug,"vi"));
  const related=candidates.filter(item=>item.score>=2);
  const shortlist=related.length>0?related:candidates;
  return {title:"Sản phẩm gợi ý",
    items:shortlist.slice(0,Math.min(12,Math.max(0,limit))).map(item=>item.product)};
}
