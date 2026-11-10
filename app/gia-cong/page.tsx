import type {Metadata} from "next";
import Link from "next/link";
import {ContentShell,ContentBreadcrumb,PageHeading} from "@/components/content-ui";
import OutsourcingRequestForm from "@/components/outsourcing-request-form";
export const metadata:Metadata={
 title:"Gia công theo yêu cầu | Futurebook Miền Nam",
 description:"Gửi yêu cầu tư vấn gia công tập vở, sổ và sản phẩm giấy theo quy cách dự kiến. Khả năng đáp ứng và báo giá được trao đổi riêng.",
};
export default function OutsourcingPage(){
 const ready=process.env.FBMN_DL6_ENABLED==="true";
 return <ContentShell>
  <ContentBreadcrumb items={[{name:"Gia công"}]}/>
  <PageHeading eyebrow="YÊU CẦU TƯ VẤN" title="Gia công theo yêu cầu"
   intro="Trao đổi nhu cầu và quy cách với Futurebook Miền Nam."/>
  <section className="content-intro-grid" aria-label="Thông tin gia công và yêu cầu tư vấn">
   <div className="content-outline-panel">
    <h2>Gia công theo yêu cầu</h2>
    <p>Khách hàng có thể mô tả sản phẩm, mẫu bìa, quy cách, chất liệu và số lượng dự kiến để được trao đổi về khả năng đáp ứng.</p>
    <p>Khả năng thực hiện, số lượng tối thiểu, tiến độ và báo giá chỉ được xác nhận sau khi Futurebook Miền Nam kiểm tra yêu cầu. Website không công bố cam kết khi chưa có xác nhận chính thức.</p>
    <h3>Thông tin nên chuẩn bị</h3>
    <p>Loại sản phẩm, khổ, số trang, chất liệu bìa, số lượng dự kiến và các yêu cầu riêng (nếu có).</p>
    <Link className="content-text-link" href="/san-pham">Tham khảo danh mục sản phẩm</Link>
   </div>
   <div className="content-intro-panel">
    <h2>Gửi yêu cầu tư vấn</h2>
    {ready?<><p>Yêu cầu sẽ được lưu bảo mật và chuyển đến hộp thư xử lý trong Admin Futurebook; chưa phải đơn hàng hoặc xác nhận báo giá.</p>
      <OutsourcingRequestForm/></>:
      <><p className="content-form-notice" role="status">Kênh tiếp nhận yêu cầu gia công trực tuyến chưa được kích hoạt. Chúng tôi chưa thu thập thông tin qua biểu mẫu này.</p>
      <Link className="content-button" href="/lien-he#thong-tin-lien-he">Xem kênh liên hệ hiện có</Link></>}
   </div>
  </section>
 </ContentShell>;
}
