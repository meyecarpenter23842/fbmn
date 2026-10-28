# WEB PR 07 — Content pages and approvals

Issue #9. Responsive purple Futurebook website; no bottom dock.

## Public routes
- /gioi-thieu: product-group overview, no invented legal facts.
- /tin-tuc and /tin-tuc/[slug]: only verified, approved published articles; no future posts.
- /khuyen-mai and /khuyen-mai/[slug]: approved campaigns within their real start/end window.
- /dai-ly: generic product navigation; no unapproved wholesale discounts, sales policies.
- /lien-he: verified contact fields only, disabled preview form without send endpoint.
- Header and footer links, metadata, semantic headings, responsive empty states.

## CMS read contract
lib/content/schema.ts, data.ts, public.ts, adapter.ts and contact-validation.ts.
The source store is production mode but deliberately empty while original documents and permissions are pending. Public projection checks source, verifier, approval, publication status and time windows. It allowlists fields and never spreads raw database records or returns internal editorial notes, pricing or contact metadata. Text is rendered as escaped React text, not HTML.

PR08 may substitute approved Workers read-only responses through adapter without changing UI. Do not directly query Neon from browser.

## Contact endpoint block
The preview form has a disabled fieldset and non-submit button. It collects and sends NO data. validateContactDraft provides a future server validation contract for lengths, consent, honeypot and fill time. Activation requires a reviewed API, server-side validation, rate limits, origin/CSRF checks, consent/privacy text, approved recipient, storage retention and end-to-end staging test. Do not claim form is functional before these are completed.

## Remaining acceptance
- Owner-provided verified legal identity, address, contact methods, social links and articles.
- Owner-approved campaigns, legal/privacy notices, dealer policies and publishing workflow.
- PR08/09 server-side contact form + spam protections and successful end-to-end staging test.
- Device visual QA 360/390/768/1280/1440 after an explicitly requested manual deploy.

Do not touch Neon production, repo order, existing Vercel project config, or deploy automatically.
