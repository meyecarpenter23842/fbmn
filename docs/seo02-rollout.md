# SEO02C rollout gates — Futurebook Miền Nam

This PR is code-only. The Owner has **not** approved live migrations or deployment.
Do not enable either SEO02 flag before its preceding steps are completed.

1. Confirm SEO02A + SEO02B + SEO02C are merged into the development repo,
   full CI and Codex clean, then sync repository tree into the owner's main via
   approved local fast-forward workflow. No force push.
2. Run Neon migrations in order: 20261113_seo02b_admin_settings.up.sql,
   then 20261113_seo02c_public_projection.up.sql. Verify private table + audited
   writes, public view only title/description/mode/image and no NET/private fields.
3. Deploy Admin Worker, Public Worker and Admin with SEO02 public feature flag
   OFF. Verify Owner-only GET/POST, pagination, revision conflicts, and an
   unpublished product cannot appear in public API.
4. Enable PUBLIC_SEO02_ENABLED=true on Public Worker, test /v1/public/seo
   has only currently published slugs and only approved product media; response
   no-store. Verify ?contentSource=legacy and ?contentSource=cms each match the
   Website CMS mode, noindex + custom records, and canonical auto suppresses
   overrides on legacy aliases.
5. Deploy Website with FBMN_SEO02_ENABLED=true (and FBMN_PUBLIC_API_ENABLED=true),
   test product/category/article/promotion metadata and sitemap end to end.
   Both flags default OFF. If public SEO API is unavailable while Website enabled,
   requests fail closed rather than silently re-indexing pages.
6. Confirm Search Console sitemap and URL Inspection; a Success sitemap status
   does not establish that Google indexed URLs. Verify old product links redirect
   preserving valid ?sku and canonical points to the primary www.fbmn.vn host.

Rollback: turn Website FBMN_SEO02_ENABLED off first, then Worker
PUBLIC_SEO02_ENABLED off. Keep audited data unless a separate reviewed database
rollback has been approved. No Google Ads activation in this PR.
