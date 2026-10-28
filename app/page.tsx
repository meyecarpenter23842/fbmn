import { SiteHeader } from "@/components/site-header";
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
                <span className="section-heading__eyebrow"><Icon name="sparkles" size={24} /> GÓC SẢN PHẨM</span>
                <h2 id="featured-heading">Sản phẩm Futurebook</h2>
                <p>Bố cục trưng bày mẫu; danh sách sản phẩm và giá thực tế sẽ được cập nhật sau khi xác minh.</p>
              </div>
              <span className="section-heading__pending">Catalogue đang cập nhật</span>
            </div>
            <div className="products-grid" aria-label="Các thẻ sản phẩm minh họa">
              {previewProducts.map((product) => (
                <Card key={product.title} className="product-card">
                  <Badge>MẪU UI</Badge>
                  <div className="product-card__image"><NotebookArt cover={product.cover} title="FUTUREBOOK" /></div>
                  <p className="product-card__group">{product.group}</p>
                  <h3>{product.title}</h3>
                  <p className="product-card__pending">Chưa công bố sản phẩm và giá</p>
                </Card>
              ))}
            </div>
            <p className="preview-note">* Các hình minh họa trên là thành phần dựng giao diện, không đại diện cho mã hàng hoặc giá bán hiện hành.</p>
          </Container>
        </section>

        <Container>
          <section className="benefits-section" aria-label="Các nhóm nội dung Futurebook">
            <div><Icon name="book" size={29} /><span><strong>Tập vở học tập</strong><small>Khám phá danh mục</small></span></div>
            <div><Icon name="pencil" size={29} /><span><strong>Sổ và văn phòng phẩm</strong><small>Đa dạng nhu cầu sử dụng</small></span></div>
            <div><Icon name="heart" size={29} /><span><strong>Kết nối đại lý</strong><small>Thông tin đang cập nhật</small></span></div>
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
