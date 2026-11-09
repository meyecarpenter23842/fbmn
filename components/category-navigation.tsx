import Link from "next/link";
import type { HomeCategory } from "@/lib/catalog/home";
import { getPublishedProductImageUrl } from "@/lib/catalog/product-image";
import { CatalogProductImage } from "@/components/catalog-product-image";

/** Real published categories only. One link goes to that exact category route. */
export function CategoryNavigation({ categories }: { categories: HomeCategory[] }) {
  return (
    <nav aria-label="Danh mục sản phẩm" className="category-nav">
      {categories.map(category => {
        const media = category.representativeMedia;
        const photo = media
          ? getPublishedProductImageUrl(media.r2Key, process.env.NEXT_PUBLIC_MEDIA_BASE_URL)
          : null;
        return <Link
          key={category.id}
          className="category-nav__link"
          href={"/danh-muc/" + encodeURIComponent(category.slug)}
          prefetch={false}
          aria-label={"Xem danh mục " + category.name}
        >
          <div className="category-nav__art" aria-hidden="true">
            {photo
              ? <CatalogProductImage src={photo} alt={media?.alt ?? category.name}
                  className="catalog-image-compact"/>
              : <span className="category-nav__empty-art">▤</span>}
          </div>
          <span className="category-nav__copy">
            <strong>{category.name}</strong>
            <small>{category.productCount} sản phẩm</small>
          </span>
        </Link>;
      })}
    </nav>
  );
}
