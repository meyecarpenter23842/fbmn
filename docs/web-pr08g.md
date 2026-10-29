# WEB PR08g — Production website + public Neon staging API acceptance

Date: 2026-10-29

## Production
- Public website: https://fbmn-web.vercel.app
- Vercel deployment `dpl_CRpQ8ZjvWVGXYqND11gyShyMf2Db` was verified **READY**, alias `fbmn-web.vercel.app` attached, no alias errors.
- Deployed exactly GitHub `main` commit `947811df8668a5c4fce8ffc688615a64a566c6ec`; all 70 website runtime files included, no auto-deploy on Git push.
- Vercel project `prj_PlxssxAIqvTWCgOzX2SAc81dRCGq` now has server-side production envs:
  - `FBMN_PUBLIC_API_ENABLED=true`
  - `FBMN_PUBLIC_API_BASE_URL=https://futurebook-mien-nam-public-api-staging.fbmn-alibaba240185.workers.dev`
- These environment variables are not client secrets, but are used only in SSR; they can be changed independently when backend is migrated to user-owned server.

## Evidence
- Real HTTP smoke run `40884287308` from GitHub: seven production URLs returned 200 with non-empty Futurebook HTML: `/`, `/san-pham`, `/gioi-thieu`, `/dai-ly`, `/khuyen-mai`, `/tin-tuc`, `/lien-he`.
- Live public API 200/400/403/404/405/204: `40883055487`; Worker deployment/source on Cloudflare in separate Worker.
- No approved published Neon product/category/content records yet; product and promotion listings are empty, as expected. No invented SKUs/NET prices.
- B2B Worker untouched, Neon production migration not run. App/Web Admin authoring, product approval and media upload are separate future features.

## Repeat testing
This PR adds a manually runnable and source-change-triggered website SSR smoke workflow. The workflow tests production URLs, not an unmerged preview. Continue manual deployment rules.
