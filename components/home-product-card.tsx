import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog/schema";
import { getPublishedProductImageUrl } from "@/lib/catalog/product-image";
import { CatalogProductImage } from "@/components/catalog-product-image";
import { GlassCard } from "@/components/glass-ui";

/** One accessible card-link to an already published product family (DL5 is
 * responsible for any future SKU-per-card mode). No fake price or mock art. */
export function HomeProductCard({ product }: { product: PublicProduct }) {
  const media = product.media[0];
  const photo = media
    ? getPublishedProductImageUrl(media.r2Key, process.env.NEXT_PUBLIC_MEDIA_BASE_URL)
    : null;
  const sku = product.variants[0]?.sku;
  return <GlassCard hover linkCard className="fb-glass-home-product">
    <Link href={"/san-pham/" + encodeURIComponent(product.slug)} prefetch={false}
      className="ref-product-card__hit" aria-label={"Xem sản phẩm " + product.name}>
      <div className="ref-product-card__image">
        <CatalogProductImage src={photo} alt={media?.alt ?? product.name}
          className="catalog-image-compact"/>
      </div>
      <div className="ref-product-card__copy">
        <h3>{product.name}</h3>
        <p>{product.variants.length} mã hàng đã công khai</p>
        {sku && <small>Mã tham khảo: {sku}</small>}
        <span className="ref-product-card__more">Xem sản phẩm và quy cách</span>
      </div>
    </Link>
  </GlassCard>;
}
