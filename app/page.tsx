import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CategoryNavigation } from "@/components/category-navigation";
import { MobileCarousel } from "@/components/mobile-carousel";
import { NotebookArt } from "@/components/notebook-art";
import { Container, Icon } from "@/components/ui";
import { getPublicCatalog } from "@/lib/catalog/adapter";
import { selectHomeCatalog } from "@/lib/catalog/home";
import { getPublicHomeLayout } from "@/lib/catalog/home-layout";
import { HomeProductCard } from "@/components/home-product-card";
import { VerifiedMediaImage } from "@/components/verified-media-image";
import { approvedSiteMedia } from "@/lib/media/approved-site-media";
import {getOptionalPublicCms} from "@/lib/content/cms";
import {CmsBannerSlot,CmsFeaturedSlot} from "@/components/cms-web-content";

export const dynamic="force-dynamic";
export default async function HomePage() {
  const cms=await getOptionalPublicCms();
  const hasCmsHero=cms.some(item=>item.kind==="banner"&&item.slot==="home.hero");
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
            <div className={"ref-hero__visual"+(hasCmsHero?" ref-hero__visual--cms":"")} aria-label={hasCmsHero?"Banner Futurebook đã công bố":"Bố cục minh họa tập vở Futurebook"}>
              <div className="ref-hero__rays" aria-hidden="true" />
              {hasCmsHero?<CmsBannerSlot items={cms} slot="home.hero"/>:<>
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
              <p className="ref-hero__handwriting" aria-hidden="true">Vở đẹp<br/>cho hành trình<br/>tri thức!</p>
              <div className="ref-hero__dots" aria-hidden="true"><i/><i/><i/><i/></div>
              </>}
            </div>
          </Container>
        </section>

        <Container>
          <Suspense fallback={<section id="categories" className="ref-categories" aria-label="Đang tải danh mục">
            <div className="ref-catalog-state" role="status" aria-busy="true">
              Đang tải danh mục và sản phẩm đã công khai…
            </div>
          </section>}>
            <HomePublicCatalogue />
          </Suspense>

          <CmsBannerSlot items={cms} slot="home.after_products"/>
          <CmsFeaturedSlot items={cms} slot="home.news_featured"/>
          <CmsFeaturedSlot items={cms} slot="home.promotion_featured"/>
          <section className="ref-trust" id="agency" aria-label="Thông tin hỗ trợ khách hàng và đại lý">
            <div><Icon name="package" size={28}/><span><strong>Danh mục sản phẩm</strong><small>Dữ liệu công khai đã duyệt</small></span></div>
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

/**
 * DL3: the live catalogue may fail independently of the CMS Hero.
 * Never silently turn an API outage into fabricated products or an empty
 * "published" catalogue. React Suspense supplies the loading state.
 */
async function HomePublicCatalogue() {
  let catalog;
  try {
    catalog = await getPublicCatalog();
  } catch {
    console.error("[Futurebook catalogue] homepage public catalogue unavailable");
    return <section id="categories" className="ref-categories" aria-label="Trạng thái danh mục">
      <div className="ref-catalog-state" role="alert">
        <strong>Chưa thể tải danh mục lúc này</strong>
        <p>Dữ liệu sản phẩm tạm thời không khả dụng. Anh/chị có thể thử mở trang Sản phẩm sau.</p>
        <Link href="/san-pham">Đến trang Sản phẩm</Link>
      </div>
    </section>;
  }

  const layout=await getPublicHomeLayout();
  const { categories, products } = layout.revision===1 && !layout.categoryIds.length && !layout.featuredSkus.length
    ? selectHomeCatalog(catalog) : selectHomeCatalog(catalog,layout);
  if (!products.length) return <section id="categories" className="ref-categories" aria-label="Trạng thái danh mục">
    <div className="ref-catalog-state" role="status">
      <strong>Danh mục sản phẩm đang được cập nhật</strong>
      <p>Hiện chưa có sản phẩm đủ điều kiện công khai. Trang chủ không hiển thị mẫu hoặc SKU minh họa.</p>
      <Link href="/san-pham">Xem trang Sản phẩm</Link>
    </div>
  </section>;

  const categorySection=<section key="categories" id="categories" className="ref-categories" aria-label="Danh mục Futurebook đã công khai">
      <h2 className="sr-only">Danh mục sản phẩm</h2>
      <CategoryNavigation categories={categories} />
      <div className="ref-categories__all"><Link href="/san-pham">Xem tất cả danh mục</Link></div>
    </section>;

  const productSection=<section key="products" id="collections" className="ref-featured" aria-labelledby="featured-heading">
      <div className="ref-featured__intro" id="about">
        <span className="ref-featured__crown" aria-hidden="true">♛</span>
        <h2 id="featured-heading">Sản phẩm đã công khai</h2>
        <p>Các sản phẩm được chọn theo thứ tự danh mục, không phải xếp hạng bán chạy. Xem chi tiết để chọn mã hàng và quy cách.</p>
        <Link className="ref-cta ref-cta--small" href="/san-pham">
          Xem toàn bộ sản phẩm <Icon name="arrow" size={17}/>
        </Link>
      </div>
      <MobileCarousel itemCount={products.length}>
        {products.map(product => <HomeProductCard key={product.id} product={product}/>)}
      </MobileCarousel>
    </section>;
  return <>{layout.sectionOrder.map(section=>section==="categories"?categorySection:productSection)}</>;
}
