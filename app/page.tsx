import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CategoryNavigation } from "@/components/category-navigation";
import { MobileCarousel } from "@/components/mobile-carousel";
import { NotebookArt } from "@/components/notebook-art";
import { Container, Icon } from "@/components/ui";
import { GlassCard } from "@/components/glass-ui";
import { previewProducts } from "@/lib/ui-preview";
import { VerifiedMediaImage } from "@/components/verified-media-image";
import { approvedSiteMedia } from "@/lib/media/approved-site-media";
import {getPublicCms} from "@/lib/content/cms";
import {CmsBannerSlot,CmsFeaturedSlot} from "@/components/cms-web-content";

export const dynamic="force-dynamic";
export default async function HomePage() {
  const cms=await getPublicCms();
  return (
    <>
      <SiteHeader />
      <main className="ref-site" id="home">
        <section className="ref-hero" aria-labelledby="hero-heading">
          <Container className="ref-hero__inner">
            <div className="ref-hero__copy">
              <p className="ref-hero__eyebrow">FUTUREBOOK MIỀN NAM</p>
              <h1 id="hero-heading">VỞ VIẾT<br/>FUTUREBOOK<br/>MIỀN NAM</h1>
              <p className="ref-hero__brush">Đồng hành cùng tri thức<br/><span>Kiến tạo tương lai</span></p>
              <div className="ref-hero__benefits">
                <span><Icon name="shield" size={27}/> Thông tin<br/>rõ ràng</span>
                <span><Icon name="book" size={27}/> Mẫu mã<br/>đa dạng</span>
                <span><Icon name="package" size={27}/> Dành cho<br/>đại lý</span>
              </div>
              <a className="ref-cta" href="#categories">Xem sản phẩm <Icon name="arrow" size={19}/></a>
            </div>
            <div className="ref-hero__visual" aria-label="Bố cục minh họa tập vở Futurebook">
              <div className="ref-hero__rays" aria-hidden="true" />
              <VerifiedMediaImage asset={approvedSiteMedia.heroBanner} priority
                className="ref-hero__official-image"
                sizes="(max-width: 800px) 100vw, 55vw"
                fallback={(
                  <div className="ref-hero__books" aria-hidden="true">
                    <NotebookArt cover="kraft" className="ref-hero__book ref-hero__book--one" title="SO COOL"/>
                    <NotebookArt cover="dark" className="ref-hero__book ref-hero__book--two" title="FUTURE"/>
                    <NotebookArt cover="sky" className="ref-hero__book ref-hero__book--three" title="NOTEBOOK"/>
                    <NotebookArt cover="rose" className="ref-hero__book ref-hero__book--four" title="HAPPINESS"/>
                    <NotebookArt cover="violet" className="ref-hero__book ref-hero__book--five" title="FUTUREBOOK"/>
                  </div>
                )}
              />
              <CmsBannerSlot items={cms} slot="home.hero"/>
              <p className="ref-hero__handwriting" aria-hidden="true">Vở đẹp<br/>cho hành trình<br/>tri thức!</p>
              <div className="ref-hero__dots" aria-hidden="true"><i/><i/><i/><i/></div>
            </div>
          </Container>
        </section>

        <Container>
          <section id="categories" className="ref-categories" aria-label="Danh mục Futurebook">
            <CategoryNavigation />
          </section>

          <section id="collections" className="ref-featured" aria-labelledby="featured-heading">
            <div className="ref-featured__intro" id="about">
              <span className="ref-featured__crown" aria-hidden="true">♛</span>
              <h2 id="featured-heading">Sản phẩm nổi bật</h2>
              <p>Các mẫu được minh họa theo bố cục thiết kế. Sản phẩm và thông số chính thức đang cập nhật.</p>
              <a className="ref-cta ref-cta--small" href="#categories">Xem danh mục <Icon name="arrow" size={17}/></a>
            </div>
            <MobileCarousel itemCount={previewProducts.length}>
              {previewProducts.map(product => (
                <GlassCard hover className="fb-glass-home-product" key={product.title}>
                  <span className="ref-demo-badge">MẪU GIAO DIỆN</span>
                  <div className="ref-product-card__image"><NotebookArt cover={product.cover} title="FUTUREBOOK"/></div>
                  <div className="ref-product-card__copy">
                    <h3>{product.title}</h3>
                    <p>{product.group}</p>
                    <strong>Liên hệ báo giá</strong>
                    <div className="ref-product-card__actions">
                      <button type="button" disabled title="Giỏ hàng chưa mở" aria-label={"Chưa mở giỏ hàng cho " + product.title}><Icon name="cart" size={17}/></button>
                      <Link href="/lien-he">Xem thông tin</Link>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </MobileCarousel>
          </section>
          <p className="ref-preview-note">* Hình tập vở, thẻ sản phẩm và thứ tự hiển thị chỉ là mẫu UI, không phải catalogue, bảng giá hoặc sản phẩm bán chạy đã xác minh.</p>

          <CmsBannerSlot items={cms} slot="home.after_products"/>
          <CmsFeaturedSlot items={cms} slot="home.news_featured"/>
          <CmsFeaturedSlot items={cms} slot="home.promotion_featured"/>
          <section className="ref-promos" aria-label="Khám phá nhóm sản phẩm">
            <div className="ref-promo ref-promo--a4">
              <div><h2>Vở A4</h2><p>Không gian học tập và làm việc</p><a href="#categories">Xem danh mục <Icon name="arrow" size={16}/></a></div>
              <div className="ref-promo__art" aria-hidden="true"><NotebookArt cover="rose" title="A4"/><NotebookArt cover="sky" title="FBMN"/></div>
            </div>
            <div className="ref-promo ref-promo--b5">
              <div><h2>Vở B5</h2><p>Nhỏ gọn · Tiện lợi</p><a href="#categories">Xem danh mục <Icon name="arrow" size={16}/></a></div>
              <div className="ref-promo__art" aria-hidden="true"><NotebookArt cover="kraft" title="B5"/><NotebookArt cover="lime" title="FBMN"/></div>
            </div>
          </section>

          <section className="ref-trust" id="agency" aria-label="Thông tin hỗ trợ khách hàng và đại lý">
            <div><Icon name="package" size={28}/><span><strong>Danh mục sản phẩm</strong><small>Đang được xác minh</small></span></div>
            <div><Icon name="shield" size={28}/><span><strong>Thông tin rõ ràng</strong><small>Nguồn catalogue chính thức</small></span></div>
            <div><Icon name="book" size={28}/><span><strong>Hỗ trợ đại lý</strong><small>Chính sách đang cập nhật</small></span></div>
            <div><Icon name="heart" size={28}/><span><strong>Kết nối Futurebook</strong><small>Xem trang liên hệ</small></span></div>
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
