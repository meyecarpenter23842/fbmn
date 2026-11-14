import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CategoryNavigation } from "@/components/category-navigation";
import { MobileCarousel } from "@/components/mobile-carousel";
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
export const metadata={alternates:{canonical:"/"}};
export default async function HomePage() {
  const cms=await getOptionalPublicCms();
  const hasCmsHero=cms.some(item=>item.kind==="banner"&&item.slot==="home.hero");
  return (
    <>
      <SiteHeader />
      <main className="ref-site" id="home">
        <section className="ref-hero" aria-labelledby="hero-heading">
          <h1 id="hero-heading" className="sr-only">Tập vở và văn phòng phẩm Futurebook Miền Nam</h1>
          <Container className="ref-hero__inner">
            {hasCmsHero
              ? <CmsBannerSlot items={cms} slot="home.hero"/>
              : <div className="ref-hero__fallback" aria-label="Hình giới thiệu Futurebook Miền Nam">
                  <VerifiedMediaImage asset={approvedSiteMedia.heroBanner} priority
                    className="ref-hero__official-image"
                    sizes="(max-width: 800px) 100vw, 100vw"
                    fallback={<div className="ref-hero__fallback-unavailable" role="status">
                      Ảnh giới thiệu Futurebook đang được cập nhật
                    </div>}
                  />
                  <a className="cms-hero-cta" href="/san-pham">
                    Xem sản phẩm <span aria-hidden="true">↗</span>
                  </a>
                </div>}
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
            <div><Icon name="package" size={28}/><span><strong>Danh mục sản phẩm</strong><small>Tập vở, giấy và văn phòng phẩm</small></span></div>
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
      <p>Danh mục sản phẩm đang được cập nhật.</p>
      <Link href="/san-pham">Xem trang Sản phẩm</Link>
    </div>
  </section>;

  const categorySection=<section key="categories" id="categories" className="ref-categories" aria-label="Danh mục Futurebook đã công khai">
      <h2 className="sr-only">Danh mục sản phẩm</h2>
      {categories.length>0&&<CategoryNavigation categories={categories} />}
      <div className="ref-categories__all"><Link href="/san-pham">
        {categories.length>0?"Xem tất cả danh mục":"Xem toàn bộ sản phẩm"}
      </Link></div>
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
