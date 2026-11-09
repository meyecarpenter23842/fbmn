"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./ui";

export function MobileCarousel({ children, itemCount }: { children: ReactNode; itemCount: number }) {
  const rail = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  // Exactly two cards per web-mobile view; desktop shows the full product grid.
  const pages = Math.ceil(itemCount / 2);

  const pagePosition = useCallback((pageNumber: number) => {
    const el = rail.current;
    if (!el) return 0;
    const cards = Array.from(el.children) as HTMLElement[];
    const first = cards[0];
    const selected = cards[Math.min(pageNumber * 2, cards.length - 1)];
    if (!first || !selected) return 0;
    return Math.max(0, Math.min(el.scrollWidth - el.clientWidth, selected.offsetLeft - first.offsetLeft));
  }, []);

  const goToPage = useCallback((nextPage: number) => {
    const bounded = Math.max(0, Math.min(pages - 1, nextPage));
    const el = rail.current;
    if (!el) return;
    setPage(bounded);
    el.scrollTo({ left: pagePosition(bounded), behavior: "smooth" });
  }, [pagePosition, pages]);

  const syncPage = useCallback(() => {
    const el = rail.current;
    if (!el || pages <= 1) return;
    const offsets = Array.from({ length: pages }, (_, i) => pagePosition(i));
    const closest = offsets.reduce((best, value, i) =>
      Math.abs(value - el.scrollLeft) < Math.abs(offsets[best] - el.scrollLeft) ? i : best, 0);
    setPage(closest);
  }, [pagePosition, pages]);

  useEffect(() => {
    window.addEventListener("resize", syncPage);
    return () => window.removeEventListener("resize", syncPage);
  }, [syncPage]);

  return (
    <div className="mobile-carousel" aria-label="Danh sách sản phẩm công khai">
      <div className="products-grid" ref={rail} onScroll={syncPage}
        role="region" aria-roledescription="carousel" aria-label="Danh sách sản phẩm, vuốt ngang để xem thêm"
        tabIndex={0}>
        {children}
      </div>
      {pages > 1 ? (
        <div className="mobile-carousel__controls" aria-label="Điều khiển danh sách sản phẩm">
          <button className="mobile-carousel__arrow" type="button" onClick={() => goToPage(page - 1)}
            disabled={page === 0} aria-label="Trang sản phẩm trước">
            <Icon name="chevron" size={19} />
          </button>
          <div className="mobile-carousel__dots" aria-label="Chọn trang sản phẩm">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} type="button"
                className={i === page ? "mobile-carousel__dot mobile-carousel__dot--active" : "mobile-carousel__dot"}
                aria-label={"Trang sản phẩm " + (i + 1) + " trên " + pages}
                aria-current={i === page ? "true" : undefined}
                onClick={() => goToPage(i)}>
                <span />
              </button>
            ))}
          </div>
          <button className="mobile-carousel__arrow" type="button" onClick={() => goToPage(page + 1)}
            disabled={page === pages - 1} aria-label="Trang sản phẩm tiếp theo">
            <Icon name="chevron" size={19} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
