import Image from "next/image";
import Link from "next/link";
import { officialContact as contact } from "@/lib/content/official-contact";
import { FooterSocialLinks } from "@/components/footer-social-links";
import { AppDownloadMenuButton } from "@/components/app-download";

/** Consistent site-wide footer for Home, Catalog and Editorial pages. */
export function SiteFooter() {
  return <footer className="site-footer" id="contact" aria-label="Thông tin cuối trang Futurebook Miền Nam">
    <div className="site-footer__wrap">
      <div className="site-footer__grid">
        <section className="site-footer__brand" aria-label="Thương hiệu Futurebook">
          <Link href="/" className="site-footer__brand-link" aria-label="Futurebook Miền Nam — về trang chủ">
            <Image
              src="/brand/fbmn-transparent-logo.webp" alt="Logo Futurebook Miền Nam"
              width={300} height={84} className="site-footer__logo" sizes="(max-width: 700px) 110px, 104px"
            />
          </Link>
          <p>Tập vở, sổ và văn phòng phẩm Futurebook Miền Nam.</p>
          <FooterSocialLinks />
          <AppDownloadMenuButton />
        </section>
        <section className="site-footer__contact" aria-label="Thông tin liên hệ Futurebook">
          <h2>Thông tin liên hệ</h2>
          <address>
            <div><span className="site-footer__field">Email</span><a href={contact.emailHref}>{contact.email}</a></div>
            <div><span className="site-footer__field">Địa chỉ</span><span>{contact.address}</span></div>
          </address>
          <Link href="/lien-he#thong-tin-lien-he" className="site-footer__contact-link">Liên hệ · Báo giá sỉ</Link>
        </section>
      </div>
      <div className="site-footer__bottom">
        <small>© 2026 Futurebook Miền Nam</small>
      </div>
    </div>
  </footer>;
}
