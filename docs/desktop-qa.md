# WEB PR 02 — Desktop UI alignment and acceptance checklist

**Reference:** approved Futurebook Miền Nam desktop/mobile mockup supplied by the project owner on 28/10/2026. This PR is a desktop layout implementation, **not** a claim of pixel-perfect approval.

## Mapping from approved desktop image
| Image region | Implemented section | Current state |
|---|---|---|
| Purple welcome ribbon | announcement | Layout complete; real contact/social information pending validation |
| FBMN logo, search, account, cart | header-main | CSS logo placeholder; controls disabled until API is approved |
| Horizontal navigation | site-navigation | Home and product icons; unreleased content is disabled |
| New-year-of-school hero and notebook arrangement | hero | Desktop columns, CTA, book illustration, 3 sub-panels. CSS-only temporary illustrations |
| Four product-category tiles | categories-grid | 4 cards, visually aligned; do not claim specific SKUs |
| Best-seller area | featured-section | 5 mock cards, preview badges, disabled cart buttons; not called best-sellers without sales evidence |
| Service/trust ribbon | benefits-section | Product group navigation copy, not unverified guarantees |
| Purple testimonial banner | about-banner | Replaced unverified testimonial, photo and sales claims with neutral brand/cat information |
| Mobile bottom navigation in example phone | not implemented | **Omitted deliberately:** website not Native App |

## Sizes to visually review
- **1440 × 900**, desktop
- **1280 × 800**, desktop
- **1024 × 768**, tablet-desktop
- **768 × 1024**, mobile/tablet layout inherited from PR01
- **390 × 844**, mobile inherited from PR01

## Acceptance gates still outstanding
- Vercel preview screenshot at 1440 / 1280 vs source approved image; ensure no overflow, clipping or fake click targets.
- Asset audit on 28/10/2026 showed Cloudflare R2 bucket **fbmn** exists but its object list was empty and no custom domain was configured on the inspected account. Replace temporary notebook CSS and placeholder logo only when official files are uploaded and their rights confirmed.
- No prices, promotions, customer counts, testimonials, social URLs, hotline or shipping guarantees are invented to match the screenshot.
- Pixel-accurate signoff happens after the asset import in WEB PR 05 and screenshot comparison. Do not mark visual acceptance complete in PR 02.
- Mobile behavior remains from PR01. **Never introduce fixed bottom navigation/tab dock** into the web project.

## Test coverage
- checks HTML section ordering, desktop media overrides and absence of fixed bottom nav;
- checks that inactive search/cart buttons remain disabled;
- checks that links target actual page anchors;
- GitHub Actions performs lint/typecheck/test/build on the PR.
