import Image from "next/image";
import Link from "next/link";
import { fanpageContactReference as contact } from "@/lib/content/contact-reference";

/** Consistent site-wide footer for Home, Catalog and Editorial pages. */
export function SiteFooter() {
  return <footer className="site-footer" id="contact" aria-label="Thông tin cuối trang Futurebook Miền Nam">
    <div className="site-footer__wrap">
      <div className="site-footer__grid">
        <section className="site-footer__brand" aria-label="Thương hiệu Futurebook">
          <Link href="/" className="site-footer__brand-link" aria-label="Futurebook Miền Nam — về trang chủ">
            <Image
              src="/brand/fbmn-official-logo.webp" alt="Logo Futurebook Miền Nam"
              width={300} height={84} className="site-footer__logo" sizes="(max-width: 700px) 125px, 158px"
            />
          </Link>
          <p>Tập vở, sổ và văn phòng phẩm Futurebook.</p>
          <p>Thông tin sản phẩm, hình ảnh và chính sách bán hàng được cập nhật sau khi kiểm tra nguồn.</p>
        </section>
        <nav aria-label="Khám phá Futurebook" className="site-footer__links">
          <h2>Khám phá</h2>
          <Link href="/gioi-thieu">Giới thiệu</Link>
          <Link href="/san-pham">Danh mục sản phẩm</Link>
          <Link href="/tin-tuc">Tin tức</Link>
          <Link href="/khuyen-mai">Khuyến mãi</Link>
        </nav>
        <nav aria-label="Hỗ trợ khách hàng" className="site-footer__links">
          <h2>Hỗ trợ</h2>
          <Link href="/dai-ly">Dành cho đại lý</Link>
          <Link href="/lien-he">Liên hệ</Link>
          <Link href="/san-pham">Tra cứu sản phẩm</Link>
        </nav>
        <section className="site-footer__contact" aria-label="Thông tin tham khảo từ Fanpage">
          <h2>Thông tin liên hệ</h2>
          <address>
            <div><span className="site-footer__field">Điện thoại</span><a href={contact.telephoneHref}>{contact.phone}</a></div>
            <div><span className="site-footer__field">Email</span><a href={contact.emailHref}>{contact.email}</a></div>
            <div><span className="site-footer__field">Địa chỉ</span><span>{contact.address}</span></div>
          </address>
          <p className="site-footer__source">Nguồn tham khảo: Fanpage Futurebook Miền Nam. Số điện thoại đang được đối chiếu; giờ làm việc chưa được xác nhận.</p>
        </section>
      </div>
      <div className="site-footer__bottom">
        <small>© 2026 Futurebook Miền Nam</small>
        <small>Thông tin giá và chương trình chỉ công bố khi đã được duyệt.</small>
      </div>
    </div>
  </footer>;
}
