import type {PublicProduct} from "@/lib/catalog/schema";
import {ProductCard} from "./catalog-ui";
import {GlassPanel} from "./glass-ui";

/** Same related product list, recommendation order and public product links; G03 is visual-only. */
export default function CatalogueRelatedProducts({items,glass=false}: {
  items:PublicProduct[];glass?:boolean;
}) {
  if(items.length===0)return null;
  const content=<>
    <div className="catalogue-related__header">
      <h2 id="catalogue-related-heading">Sản phẩm gợi ý</h2>
    </div>
    <div className="catalogue-related__grid">
      {items.map(product=><ProductCard key={product.id} product={product} glass={glass}/>)}
    </div>
  </>;
  return glass
    ? <GlassPanel className="catalogue-related fb-glass-song-related" aria-labelledby="catalogue-related-heading">{content}</GlassPanel>
    : <section className="catalogue-related" aria-labelledby="catalogue-related-heading">{content}</section>;
}
