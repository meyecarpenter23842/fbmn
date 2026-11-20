import type {Metadata} from "next";

/** Search filters are deliberately noindex; a real unfiltered listing page
 * has its own canonical so Google can crawl different SKU cards on each page.
 */
export function paginatedCatalogMetadata({
  requested,actual,filtered
}:{requested:number;actual:number;filtered:boolean}):Metadata{
  const page=Math.max(1,Math.floor(actual));
  const canonical=page>1?"/san-pham?trang="+page:"/san-pham";
  return {
    title:page>1?"Sản phẩm Futurebook – Trang "+page+" | Futurebook Miền Nam":
      "Danh mục sản phẩm | Futurebook Miền Nam",
    description:page>1
      ?"Danh sách sản phẩm Futurebook Miền Nam, trang "+page+
        ". Xem các mã sản phẩm và quy cách đã công khai tại Futurebook."
      :"Tra cứu tập học sinh, tập sinh viên, sổ ghi chép và văn phòng phẩm Futurebook theo mã SKU, khổ giấy và quy cách đã công khai.",
    alternates:{canonical:filtered?"/san-pham":canonical},
    ...((filtered||requested!==page)?{robots:{index:false,follow:true}}:{})
  };
}
