// Keep the compact product action overlay inside the visible viewport.
// A portal allows this menu to escape table overflow without affecting row height.
export function positionCatalogueActions(rect, viewportWidth, viewportHeight) {
  const width = 188;
  const height = 106;
  const margin = 8;
  const gap = 6;
  const vw = Math.max(0, viewportWidth);
  const vh = Math.max(0, viewportHeight);
  const left = Math.max(margin, Math.min(rect.right - width, vw - width - margin));
  const below = rect.bottom + gap;
  const above = rect.top - height - gap;
  const top = below + height <= vh - margin ? below :
    above >= margin ? above : Math.max(margin, Math.min(below, vh - height - margin));
  return {top, left};
}
