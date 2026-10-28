import { SiteHeader } from "@/components/site-header";
import { MobileCarousel } from "@/components/mobile-carousel";
import { NotebookArt, StationeryArt } from "@/components/notebook-art";
import { Badge, ButtonLink, Card, Container, Icon, Pill } from "@/components/ui";
import { categories, previewProducts } from "@/lib/ui-preview";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="home" className="site-main">
        <Container>
          <section className="hero" aria-labelledby="hero-heading">
            <div className="hero__decor hero__decor--sun" aria-hidden="true">☼</div>
            <div className="hero__copy">
              <Pill>GIAO DIỆN MẪU · ĐANG HOÀN THIỆN</Pill>
              <p className="hero__lead">Cùng <span>Futurebook</span></p>
              <h1 id="hero-heading">Bước vào năm học mới</h1>
              <p className="hero__subtitle">Tập vở · Sổ ghi chép · Văn phòng phẩm</p>
              <p className="hero__support">Không gian giới thiệu sản phẩm Futurebook Miền Nam đang được xây dựng theo mẫu thiết kế đã duyệt.</p>
              <ButtonLink href="#categories">Khám phá danh mục <Icon name="arrow" size={18} /></ButtonLink>
            </div>
            <div className="hero__visual" aria-label="Minh họa bố cục tập vở Futurebook">
              <span className="hero__halo" aria-hidden="true" />
              <div className="hero__stack" aria-hidden="true">
                <NotebookArt cover="sky" className="hero__book hero__book--back" title="NOTEBOOK" />
                <NotebookArt cover="rose" className="hero__book hero__book--middle" title="HAPPINESS" />
                <NotebookArt cover="lime" className="hero__book hero__book--front" title="FUTURE" />
                <NotebookArt cover="kraft" className="hero__book hero__book--right" title="SO COOL" />
                <StationeryArt />
              </div>
              <span className="hero__bubble">Học mỗi ngày<br />Khám phá điều hay!</span>
            </div>
            <div className="hero__features" aria-label="Khám phá nội dung Futurebook">
              <div><Icon name="book" size={28} /><span><strong>Danh mục học tập</strong><small>Tập, vở và sổ ghi chép</small></span></div>
              <div><Icon name="pencil" size={28} /><span><strong>Sản phẩm văn phòng</strong><small>Khám phá các nhóm hàng</small></span></div>
              <div><Icon name="shield" size={28} /><span><strong>Catalogue chính thức</strong><small>Thông tin đang cập nhật</small></span></div>
            </div>
          </section>

          <section id="categories" className="categories-section" aria-labelledby="categories-heading">
            <div className="section-intro section-intro--compact">
              <h2 id="categories-heading" className="sr-only">Danh mục sản phẩm</h2>
              <p>Khám phá danh mục Futurebook</p>
            </div>
            <div className="categories-grid">
              {categories.map((category) => (
                <Card key={category.title} className="category-card">
                  <div className="category-card__copy">
                    <h3>{category.title}</h3>
                    <p>{category.note}</p>
                    <span className="circle-arrow" aria-hidden="true"><Icon name="arrow" size={17} /></span>
                  </div>
                  <div className="category-card__illustration">
                    {category.kind === "stationery" ? <StationeryArt /> : (
                      <NotebookArt cover={category.kind} title="FUTUREBOOK" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </Container>

        <section id="collections" className="featured-section" aria-labelledby="featured-heading">
          <Container>
            <div className="section-heading">
              <div>
                <span className="section-heading__eyebrow"><span aria-hidden="true" className="featured-crown">♕</span> KHÁM PHÁ SẢN PHẨM</span>
                <h2 id="featured-heading">Sản phẩm Futurebook</h2>
                <p>Bố cục trưng bày mẫu; danh sách sản phẩm và giá thực tế sẽ được cập nhật sau khi xác minh.</p>
              </div>
              <a className="section-heading__link" href="#categories">Xem danh mục <Icon name="arrow" size={17} /></a>
            </div>
            <MobileCarousel itemCount={previewProducts.length}>
              {previewProducts.map((product) => (
                <Card key={product.title} className="product-card">
                  <Badge>MẪU UI</Badge>
                  <div className="product-card__image"><NotebookArt cover={product.cover} title="FUTUREBOOK" /></div>
                  <p className="product-card__group">{product.group}</p>
                  <h3>{product.title}</h3>
                  <div className="product-card__bottom">
                    <p className="product-card__pending">Chưa công bố giá</p>
                    <button className="product-card__cart" type="button" disabled aria-label={`Giỏ hàng chưa mở cho ${product.title}`} title="Chưa mở đặt hàng">
                      <Icon name="cart" size={17} />
                    </button>
                  </div>
                </Card>
              ))}
            </MobileCarousel>
            <p className="preview-note">* Các hình minh họa trên là thành phần dựng giao diện, không đại diện cho mã hàng hoặc giá bán hiện hành.</p>
          </Container>
        </section>

        <Container>
          <section className="benefits-section" aria-label="Các nhóm nội dung Futurebook">
            <div><Icon name="book" size={29} /><span><strong>Tập học sinh</strong><small>Khám phá danh mục</small></span></div>
            <div><Icon name="pencil" size={29} /><span><strong>Sổ ghi chép</strong><small>Nhiều phong cách</small></span></div>
            <div><Icon name="package" size={29} /><span><strong>Văn phòng phẩm</strong><small>Nhóm sản phẩm</small></span></div>
            <div><Icon name="heart" size={29} /><span><strong>Kết nối đại lý</strong><small>Đang cập nhật</small></span></div>
          </section>

          <section id="about" className="about-banner" aria-labelledby="about-heading">
            <div className="about-banner__sparkle" aria-hidden="true">✦</div>
            <div>
              <p className="about-banner__eyebrow">FUTUREBOOK MIỀN NAM</p>
              <h2 id="about-heading">Cùng bạn trên hành trình học tập</h2>
              <p>Chúng tôi đang hoàn thiện website giới thiệu sản phẩm, hình ảnh và thông tin dành cho khách hàng, đại lý.</p>
            </div>
            <div className="about-banner__panel">
              <Icon name="package" size={28} />
              <strong>Catalogue sản phẩm</strong>
              <span>Sẽ được cập nhật từ dữ liệu chính thức.</span>
            </div>
          </section>
        </Container>
      </main>
      <footer className="site-footer" id="contact">
        <Container className="site-footer__inner">
          <strong>FBMN · FUTUREBOOK MIỀN NAM</strong>
          <span>Website đang xây dựng · Chưa mở đặt hàng trực tuyến</span>
        </Container>
      </footer>
    </>
  );
}
