import type {CmsChannel} from "./cms-placement-options";

/** C2 adapter for the current private CMS API, whose pages still mix all channels.
 * Page numbering here refers to Website entries, not backend mixed-channel pages.
 * Fail visibly rather than showing a misleading empty page or losing older Website entries.
 * A server-side channel query can replace this adapter during C4.
 */
const PAGE_SIZE=50;
const MAX_SOURCE_PAGES=100;
export type CmsSourcePage<T>={items:T[];page:number;hasNext:boolean};
export async function websiteCmsPage<T extends {channel_targets:readonly CmsChannel[]}>(
 page:number,getSource:(backendPage:number)=>Promise<CmsSourcePage<T>>
):Promise<{items:T[];hasNext:boolean}>{
 if(!Number.isSafeInteger(page)||page<1||page>9999)throw Error("Trang nội dung không hợp lệ.");
 const skip=(page-1)*PAGE_SIZE;
 let found=0;
 const items:T[]=[];
 for(let backendPage=1;backendPage<=MAX_SOURCE_PAGES;backendPage++){
  const source=await getSource(backendPage);
  if(source.page!==backendPage||!Array.isArray(source.items)||source.items.length>PAGE_SIZE||
     typeof source.hasNext!=="boolean")throw Error("Danh sách CMS không hợp lệ.");
  for(const entry of source.items){
   if(!entry.channel_targets.includes("public_web"))continue;
   if(found>=skip&&items.length<PAGE_SIZE)items.push(entry);
   found++;
   if(found>skip+PAGE_SIZE)return {items,hasNext:true};
  }
  if(!source.hasNext)return {items,hasNext:false};
 }
 throw Error("Không thể phân trang đầy đủ nội dung Website từ API CMS hiện tại. Cần bổ sung lọc Website trên API.");
}
