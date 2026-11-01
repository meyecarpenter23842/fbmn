declare module "@/lib/catalogue-action-position.mjs" {
  export function positionCatalogueActions(
    rect: Pick<DOMRect, "top" | "bottom" | "right">,
    viewportWidth: number,
    viewportHeight: number
  ): {top: number; left: number};
}
