import type {PublicProduct} from "@/lib/catalog/schema";
import {ProductCard} from "./catalog-ui";

/** Reuse the exact card used by the public product listing. No custom slider or mock cards. */
export default function CatalogueRelatedProducts({items}: {items:PublicProduct[]}) {
  if(items.length===0)return null;
  return <section className="catalogue-related" aria-labelledby="catalogue-related-heading">
    <div className="catalogue-related__header">
      <h2 id="catalogue-related-heading">Sản phẩm gợi ý</h2>
    </div>
    <div className="catalogue-related__grid">
      {items.map(product=><ProductCard key={product.id} product={product}/>)}
    </div>
  </section>;
}
