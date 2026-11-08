import {CMS_SLOTS} from "./cms-placement-options";
import type {CmsKind} from "./cms-placement-options";

/** C3: reviewed layout anchors from actual Website files, NOT evidence that CMS is live.
 * app/page.tsx: ref-hero, ref-featured, ref-promos; ref-category navigation
 * app/danh-muc/[slug]/page.tsx: breadcrumb then catalog-layout
 * app/tin-tuc/page.tsx and app/khuyen-mai/page.tsx: breadcrumb then content-card-grid
 * components/content-ui.tsx: cards have TEXT only; no article/promotion thumbnail.
 * No CMS renderer has yet been mounted at any of these anchors (C4).
 */
export type CmsWebsitePage="home"|"category"|"news"|"promotions";
export type CmsWebsiteSceneSpec={
 page:CmsWebsitePage;
 path:string;
 anchor:string;
 placementReady:boolean;
 description:string;
};
export const CMS_WEBSITE_SCENE_SLOTS:Record<string,CmsWebsiteSceneSpec>={
 "home.hero":{
  page:"home",path:"/",anchor:"ref-hero__visual",placementReady:false,
  description:"Hero hiện có nội dung và ảnh cố định; banner CMS chưa được gắn vào vùng này."
 },
 "home.after_products":{
  page:"home",path:"/",anchor:"ref-featured → ref-promos",placementReady:false,
  description:"Sau Sản phẩm nổi bật, trước các khối Vở A4/B5; Website chưa có renderer banner."
 },
 "category.header":{
  page:"category",path:"/danh-muc/[slug]",anchor:"catalog-breadcrumb → catalog-layout",placementReady:false,
  description:"Trang danh mục có breadcrumb và bộ lọc; CMS chưa có điểm chèn trước sản phẩm."
 },
 "home.entry":{
  page:"home",path:"/",anchor:"ref-site overlay",placementReady:false,
  description:"Popup dự kiến phủ trang chủ; runtime giới hạn tần suất chưa hoạt động."
 },
 "category.entry":{
  page:"category",path:"/danh-muc/[slug]",anchor:"catalog-main overlay",placementReady:false,
  description:"Popup dự kiến trên trang danh mục; runtime chưa hoạt động."
 },
 "all.entry":{
  page:"home",path:"/",anchor:"all pages overlay",placementReady:false,
  description:"Toàn Website. Trang chủ chỉ là màn đại diện; chưa có runtime popup."
 },
 "news.list":{
  page:"news",path:"/tin-tuc",anchor:"content-card-grid / ArticlePreview",placementReady:false,
  description:"Trang tin có thẻ tiêu đề, tóm tắt, liên kết, không có ảnh trên thẻ. Chưa nối CMS."
 },
 "home.news_featured":{
  page:"home",path:"/",anchor:"not yet in app/page.tsx",placementReady:false,
  description:"Website chưa có mục Tin nổi bật. Khung dự kiến, chưa phải vị trí live."
 },
 "promotions.list":{
  page:"promotions",path:"/khuyen-mai",anchor:"content-card-grid / PromotionPreview",placementReady:false,
  description:"Trang khuyến mãi có thẻ chữ, không hiển thị ảnh trên thẻ. Chưa nối CMS."
 },
 "home.promotion_featured":{
  page:"home",path:"/",anchor:"not yet in app/page.tsx",placementReady:false,
  description:"Website chưa có mục Khuyến mãi nổi bật. Khung dự kiến, chưa phải vị trí live."
 }
};
export function cmsWebsiteSceneSpec(kind:CmsKind,slot:string):CmsWebsiteSceneSpec|null{
 if(!CMS_SLOTS[kind].public_web.some(candidate=>candidate.value===slot))return null;
 return CMS_WEBSITE_SCENE_SLOTS[slot]??null;
}
