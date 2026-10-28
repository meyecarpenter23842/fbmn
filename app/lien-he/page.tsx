import type { Metadata } from "next";
import { ContentShell, ContentBreadcrumb, PageHeading } from "@/components/content-ui";
import { getPublicContent } from "@/lib/content/adapter";

export const metadata: Metadata = {
  title: "Liên hệ | Futurebook Miền Nam",
  description: "Thông tin liên hệ Futurebook Miền Nam được công bố sau xác minh; biểu mẫu chưa tiếp nhận dữ liệu.",
};

export default async function ContactPage() {
  const { company } = await getPublicContent();
  return <ContentShell>
    <ContentBreadcrumb items={[{ name: "Liên hệ" }]}/>
    <PageHeading eyebrow="KẾT NỐI FUTUREBOOK" title="Liên hệ Futurebook Miền Nam"
      intro="Kênh liên hệ chính thức chỉ được công khai sau khi kiểm tra nguồn. Chúng tôi chưa kích hoạt tính năng nhận yêu cầu trực tuyến."/>
    <section className="content-intro-grid" aria-label="Thông tin liên hệ">
      <div className="content-outline-panel">
        <h2>Thông tin chính thức</h2>
        {company ? <address className="content-contact-list">
          {company.legalName && <p><strong>Đơn vị:</strong> {company.legalName}</p>}
          {company.address && <p><strong>Địa chỉ:</strong> {company.address}</p>}
          {company.phone && <p><strong>Điện thoại:</strong> <a href={"tel:" + company.phone.replace(/[^+0-9]/g, "")}>{company.phone}</a></p>}
          {company.email && <p><strong>Email:</strong> <a href={"mailto:" + company.email}>{company.email}</a></p>}
          {company.hours && <p><strong>Thời gian làm việc:</strong> {company.hours}</p>}
        </address> : <p role="status">Hotline, email, địa chỉ và thời gian làm việc đang chờ xác nhận. Chúng tôi không sử dụng thông tin minh họa làm thông tin liên hệ thực.</p>}
      </div>
      <div className="content-intro-panel">
        <h2>Biểu mẫu liên hệ</h2>
        <p className="content-form-notice" role="status">Chưa kích hoạt tiếp nhận. Biểu mẫu dưới đây chỉ minh họa bố cục; dữ liệu sẽ không được thu thập hoặc gửi đi.</p>
        <form className="content-contact-form" aria-label="Biểu mẫu liên hệ chưa hoạt động">
          <fieldset disabled>
            <label htmlFor="contact-name">Họ tên</label>
            <input id="contact-name" type="text" placeholder="Họ tên người liên hệ" autoComplete="off" />
            <label htmlFor="contact-email">Email</label>
            <input id="contact-email" type="email" placeholder="Email liên hệ" autoComplete="off" />
            <label htmlFor="contact-message">Nội dung</label>
            <textarea id="contact-message" rows={4} placeholder="Nội dung cần trao đổi" />
            <label className="content-consent"><input type="checkbox" />
              Tôi đồng ý cung cấp thông tin để được phản hồi theo chính sách bảo mật khi dịch vụ được kích hoạt.
            </label>
            <button type="button" className="content-button" disabled>Chưa mở tiếp nhận</button>
          </fieldset>
        </form>
      </div>
    </section>
  </ContentShell>;
}
