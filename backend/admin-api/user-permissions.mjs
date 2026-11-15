// USER01 — one explicit, server-checked permission catalogue for Admin + CEO.
export const PERMISSIONS = Object.freeze([
  {key:"admin.catalogue.read",group:"Admin · Sản phẩm",label:"Xem sản phẩm",detail:"Xem SKU, danh mục, nhóm mẫu, ảnh và bảng sản phẩm."},
  {key:"admin.catalogue.write",group:"Admin · Sản phẩm",label:"Chỉnh sửa sản phẩm",detail:"Nhập Excel, thêm/sửa SKU, nhóm mẫu, ảnh và dữ liệu catalogue."},
  {key:"admin.pricing.read",group:"Admin · Giá",label:"Xem bảng giá",detail:"Đọc bảng giá NET và dữ liệu giá riêng tư."},
  {key:"admin.pricing.write",group:"Admin · Giá",label:"Cập nhật bảng giá",detail:"Nhập Excel giá, chỉnh giá NET và áp dụng bảng giá."},
  {key:"admin.cms.read",group:"Admin · Nội dung",label:"Xem nội dung",detail:"Xem banner, bản tin và lịch xuất bản."},
  {key:"admin.cms.write",group:"Admin · Nội dung",label:"Biên tập và xuất bản",detail:"Tạo, sửa, duyệt và xuất bản bản tin, banner, khuyến mãi."},
  {key:"admin.website.read",group:"Admin · Website",label:"Xem cấu hình Website",detail:"Xem SEO, chatbot, catalogue, liên hệ, gia công và bố cục."},
  {key:"admin.website.write",group:"Admin · Website",label:"Thay đổi cấu hình Website",detail:"Sửa SEO, chatbot, catalogue, trang chủ, thông tin và hiển thị."},
  {key:"admin.users.manage",group:"Admin · Nhân sự",label:"Quản lý tài khoản",detail:"Tạo Admin khác, phân quyền, khóa/mở khóa nhân viên; không cấp Owner."},
  {key:"ceo.overview",group:"CEO · Điều hành",label:"Tổng quan CEO",detail:"Xem màn hình tổng quan hoạt động."},
  {key:"ceo.conversations",group:"CEO · Khách hàng",label:"Hội thoại",detail:"Đọc hội thoại, xem tin mới và đánh dấu đã xem."},
  {key:"ceo.outsourcing",group:"CEO · Khách hàng",label:"Yêu cầu gia công",detail:"Xem yêu cầu gia công và trạng thái đã xem."},
  {key:"ceo.contacts",group:"CEO · Khách hàng",label:"Liên hệ",detail:"Xem liên hệ, đăng ký đại lý và trạng thái đã xem."},
  {key:"ceo.mail.read",group:"CEO · Email",label:"Đọc email",detail:"Xem hộp thư đến, thư đã gửi và nội dung email."},
  {key:"ceo.mail.send",group:"CEO · Email",label:"Gửi email",detail:"Soạn, trả lời và gửi email từ địa chỉ công ty."},
  {key:"ceo.statistics",group:"CEO · Báo cáo",label:"Thống kê Marketing",detail:"Xem PostHog, funnel B2B, lưu lượng và chuyển đổi."},
  {key:"ceo.seo",group:"CEO · Báo cáo",label:"Báo cáo SEO",detail:"Xem dữ liệu Google Search Console, từ khóa và trang."},
  {key:"ceo.notifications",group:"CEO · Thông báo",label:"Thông báo và Push",detail:"Nhận thông báo, badge và đăng ký Push trên thiết bị."},
  {key:"ceo.gsc.manage",group:"CEO · Cấu hình",label:"Kết nối Google Search Console",detail:"Kết nối/ngắt OAuth Search Console của công ty."},
]);
export const PERMISSION_KEYS = new Set(PERMISSIONS.map(permission=>permission.key));
export const CHANNELS = Object.freeze(["public_web","dealer_app","consumer_app"]);
export const ROLES = Object.freeze(["viewer","editor","publisher","pricing","admin","ceo"]);
export const ROLE_DEFAULTS = Object.freeze({
  viewer:["admin.catalogue.read"],
  editor:["admin.catalogue.read","admin.catalogue.write","admin.cms.read"],
  publisher:["admin.cms.read","admin.cms.write","admin.website.read"],
  pricing:["admin.catalogue.read","admin.pricing.read","admin.pricing.write"],
  admin:PERMISSIONS.filter(p=>p.key.startsWith("admin.")).map(p=>p.key),
  ceo:PERMISSIONS.filter(p=>p.key.startsWith("ceo.") && !["ceo.mail.send","ceo.gsc.manage"].includes(p.key)).map(p=>p.key),
});
export function validStaffPayload(value,{update=false}={}){
  if(!value || typeof value!=="object" || Array.isArray(value))return false;
  if(!update && (typeof value.email!=="string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || value.email.length>200 ||
    typeof value.name!=="string" || value.name.trim().length<2 || value.name.length>150))return false;
  if(update && (!Number.isInteger(value.revision)||value.revision<1))return false;
  if(!ROLES.includes(value.role) || typeof value.enabled!=="boolean" ||
    !Array.isArray(value.permissions) || value.permissions.length>PERMISSIONS.length ||
    !Array.isArray(value.channels) || value.channels.length>CHANNELS.length)return false;
  if(value.permissions.some(p=>typeof p!=="string"||!PERMISSION_KEYS.has(p)) ||
    new Set(value.permissions).size!==value.permissions.length ||
    value.channels.some(c=>!CHANNELS.includes(c)) || new Set(value.channels).size!==value.channels.length)return false;
  // Pricing workspaces select real SKU catalogue; read access is mandatory.
  if(value.permissions.some(p=>p.startsWith("admin.pricing."))&&!value.permissions.includes("admin.catalogue.read"))return false;
  // A CEO account always needs a visible landing tab, and dependent tabs must be usable.
  const ceo=value.permissions.filter(p=>p.startsWith("ceo."));
  if(ceo.length>0&&!ceo.includes("ceo.overview"))return false;
  if(ceo.includes("ceo.mail.send")&&!ceo.includes("ceo.mail.read"))return false;
  if(ceo.includes("ceo.seo")&&!ceo.includes("ceo.statistics"))return false;
  if(ceo.includes("ceo.gsc.manage")&&(!ceo.includes("ceo.seo")||!ceo.includes("ceo.statistics")))return false;
  // A non-admin role cannot become a staff administrator through a checkbox.
  if(value.role!=="admin" && value.permissions.includes("admin.users.manage"))return false;
  return true;
}
export function allowed(actor,key){
  if(actor?.role==="owner" && actor?.enabled===true)return true;
  if(!actor?.enabled || !PERMISSION_KEYS.has(key))return false;
  if(key==="admin.users.manage" && actor.role!=="admin")return false;
  return Array.isArray(actor.permissions) && actor.permissions.includes(key);
}
