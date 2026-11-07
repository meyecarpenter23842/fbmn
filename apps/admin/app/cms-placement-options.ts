/** UI labels for the reviewed CMS placement codes.
 * Each surface owns its own layout. App slots are configuration only until app launch.
 */
export type CmsKind="banner"|"popup"|"article"|"promotion";
export type CmsChannel="public_web"|"dealer_app"|"consumer_app";
export type CmsSlot={value:string;label:string;description:string};
export const CMS_SLOTS:Record<CmsKind,Record<CmsChannel,CmsSlot[]>>={
 banner:{
  public_web:[
   {value:"home.hero",label:"Trang chủ · Hero",description:"Vùng đầu trang dưới menu"},
   {value:"home.after_products",label:"Trang chủ · Sau sản phẩm",description:"Dải banner giữa trang"},
   {value:"category.header",label:"Danh mục · Đầu trang",description:"Banner trước danh sách sản phẩm"}
  ],
  dealer_app:[{value:"home.banner",label:"App đại lý · Trang chủ",description:"Thẻ banner theo bố cục app"}],
  consumer_app:[{value:"home.banner",label:"App người dùng · Trang chủ",description:"Thẻ banner theo bố cục app"}]
 },
 popup:{
  public_web:[
   {value:"home.entry",label:"Trang chủ · Khi truy cập",description:"Popup marketing xuất hiện sau thời gian chờ"},
   {value:"category.entry",label:"Danh mục · Khi truy cập",description:"Popup trên trang danh mục"},
   {value:"all.entry",label:"Toàn Website · Khi truy cập",description:"Popup marketing mọi trang theo giới hạn tần suất"}
  ],
  dealer_app:[{value:"home.entry",label:"App đại lý · Trang chủ",description:"Popup trong app, không phải hộp thoại Admin"}],
  consumer_app:[{value:"home.entry",label:"App người dùng · Trang chủ",description:"Popup trong app, không phải hộp thoại Admin"}]
 },
 article:{
  public_web:[
   {value:"news.list",label:"Tin tức · Danh sách",description:"Trang /tin-tuc và trang chi tiết"},
   {value:"home.news_featured",label:"Trang chủ · Tin nổi bật",description:"Nổi bật trên trang chủ, vẫn nằm trong Tin tức"}
  ],
  dealer_app:[{value:"news.list",label:"App đại lý · Tin tức",description:"Danh sách tin tức app"}],
  consumer_app:[{value:"news.list",label:"App người dùng · Tin tức",description:"Danh sách tin tức app"}]
 },
 promotion:{
  public_web:[
   {value:"promotions.list",label:"Khuyến mãi · Danh sách",description:"Trang /khuyen-mai và chi tiết"},
   {value:"home.promotion_featured",label:"Trang chủ · Khuyến mãi nổi bật",description:"Nổi bật trang chủ, vẫn nằm trong Khuyến mãi"}
  ],
  dealer_app:[{value:"promotions.list",label:"App đại lý · Ưu đãi",description:"Danh sách ưu đãi app"}],
  consumer_app:[{value:"promotions.list",label:"App người dùng · Ưu đãi",description:"Danh sách ưu đãi app"}]
 }
};
