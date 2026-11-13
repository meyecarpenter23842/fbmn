import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {ContentShell,ContentBreadcrumb,PageHeading} from "@/components/content-ui";
import OutsourcingRequestForm from "@/components/outsourcing-request-form";
export const dynamic="force-dynamic";
export const metadata: Metadata = {
 title:"Tư vấn gia công tập vở, sổ tay theo yêu cầu | Futurebook Miền Nam",
 description:"Gửi nhu cầu gia công tập vở, sổ tay và sản phẩm giấy theo khổ, số trang, bìa, số lượng dự kiến. Tư vấn cho khách hàng tại TP.HCM và miền Tây; báo giá sau khi xác minh.",
  alternates: { canonical: "/gia-cong" },
};
export default function OutsourcingPage(){
 const ready=process.env.FBMN_DL6_ENABLED==="true";
 return <ContentShell>
  <ContentBreadcrumb items={[{name:"Gia công"}]}/>
  <PageHeading eyebrow="YÊU CẦU TƯ VẤN" title="Gia công theo yêu cầu"
   intro="Trao đổi quy cách dự kiến cho tập vở, sổ tay và sản phẩm giấy; không phải báo giá hay xác nhận nhận gia công."/>
  <section className="content-intro-grid" aria-label="Thông tin gia công và yêu cầu tư vấn">
   <div className="content-outline-panel content-outline-panel--outsourcing">
    <h2>Thông tin cần chuẩn bị khi yêu cầu gia công tập vở, sổ tay</h2>
    <p>Khách hàng có thể mô tả sản phẩm, mẫu bìa, quy cách, chất liệu và số lượng dự kiến để được trao đổi về khả năng đáp ứng.</p>
    <p>Khả năng thực hiện, số lượng tối thiểu, tiến độ và báo giá chỉ được xác nhận sau khi Futurebook Miền Nam kiểm tra yêu cầu. Website không công bố cam kết khi chưa có xác nhận chính thức.</p>
    <h3>Thông tin nên chuẩn bị</h3>
    <p>Loại sản phẩm (tập vở, sổ hoặc giấy), khổ, số trang, chất liệu và mẫu bìa, số lượng dự kiến, yêu cầu riêng (nếu có). Khách hàng tại TP.HCM và các tỉnh miền Tây có thể gửi thông tin qua biểu mẫu khi kênh tiếp nhận được kích hoạt.</p>
    <Link className="content-text-link" href="/san-pham">Tham khảo danh mục sản phẩm</Link>
    <p>Đang tìm nguồn hàng có sẵn để phân phối? <Link href="/dai-ly">Xem thông tin hợp tác đại lý Futurebook</Link>.</p>
    <Image className="content-outsourcing-art" src="/illustrations/futurebook-paper-craft.svg"
     width={780} height={450} unoptimized alt="Minh họa giấy và sổ theo yêu cầu gia công" />
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
