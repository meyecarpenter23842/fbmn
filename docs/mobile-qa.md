# WEB PR 03 — Mobile web responsive acceptance

Date: 28/10/2026. Reference: approved Futurebook Miền Nam desktop/phone mockup in project conversation.

## Web, not Native
- There is **no bottom navigation**, bottom tabs, sticky cart, floating action dock, or mobile app shell.
- The site navigation opens **under the header** with a hamburger, not a native-app navigation view. Escape closes and focus returns to the menu button.
- Mobile search icon opens an informational panel; it does not submit a search until the product API exists.
- Header cart stays disabled pending approved B2B workflows.
- Product carousel navigates horizontally with 44px arrows, page dots, touch swipe and keyboard focus.
- The 3-category benefits strip remains **in normal document flow** below products, not pinned to the viewport bottom.

## Mobile viewport checklist
| Width | Expected |
|---|---|
| 360px | Header logo centered, no overlap, categories 2-col |
| 390px | Hero headline readable; 2-col categories; 2 card carousel |
| 768px | Header in mobile-web mode; menu works; no bottom app controls |
| 1280/1440px | Desktop unaffected by mobile CSS |

## Test procedure
1. Open preview on iOS Safari and Android Chrome, in portrait and after rotation.
2. Toggle header menu, Tab through links, Escape to close, verify focus returns to hamburger; no offscreen nav trap.
3. Tap mobile search: explanatory panel must appear; no fake search results or broken route.
4. Swipe product cards horizontally, use prev/next arrows and dots; test keyboard focus on carousel rail.
5. Scroll to benefits and normal footer; no fixed element should cover the content or bottom of screen.
6. Capture screenshots at 360/390/768; compare to reference (colors, spacing, visual hierarchy) and record owner approval.

## Deferred / known limitations
- Current product and logo imagery is CSS preview artwork, not validated Futurebook R2 catalogue images.
- Prices, slogans, social proof, shipping guarantees and contact data from mockup are **not** factual content.
- Screenshot/visual fidelity signoff requires live browser UAT and R2 assets; automated source tests do not prove that.
- Deployment is manual only, and deployment protection should remain **understood**: preview is currently publicly accessible after explicit testing change; review access policy before real customer data is ever introduced.
