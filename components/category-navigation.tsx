import Link from "next/link";
import { NotebookArt, StationeryArt } from "@/components/notebook-art";
import { categories } from "@/lib/ui-preview";

/**
 * Lightweight category navigation shared by all breakpoints.
 * The illustrated covers are mockups, never official product photographs.
 * Once publishing is available, category artwork can be sourced through CMS.
 */
export function CategoryNavigation() {
  return (
    <nav aria-label="Danh mục sản phẩm" className="category-nav">
      {categories.map(category => (
        <Link
          key={category.title}
          className="category-nav__link"
          href={"/san-pham?q=" + encodeURIComponent(category.title)}
          aria-label={"Khám phá " + category.title}
        >
          <span className="category-nav__art" aria-hidden="true">
            {category.kind === "stationery" ? (
              <StationeryArt />
            ) : (
              <NotebookArt cover={category.kind} title="FBMN" />
            )}
          </span>
          <span className="category-nav__copy">
            <strong>{category.title}</strong>
            <small>{category.note}</small>
          </span>
        </Link>
      ))}
    </nav>
  );
}
