# Futurebook Miền Nam — Admin standalone frontend

Vercel project: `fbmn-admin` (`prj_zfE2VTQuZJkEgOzOfJdokQsk5VZS`), root `apps/admin`.
Website project `fbmn-web` stays independent at repo root.

**No Git auto-deployment.** An owner can preview-deploy an open reviewed/green PR or the current main merge commit (from the most recently merged reviewed PR), only with the comment `/deploy admin preview` on that PR. Production deployment is intentionally NOT implemented for Admin. Vercel project has deployment protection enabled for non-custom domains.

Launch routes: `/` and `/api/admin/session` with Google Neon Auth. All Admin endpoints fail closed until preview-only secrets, Admin staging Worker and restricted database role are configured. No self-admin role assignment. Do not use website public API or legacy B2B Worker as the Admin Worker.

Next roadmap (existing): ADM-01 issue #11 UAT staging real Google login/401/403/revoke; ADM-02 #19 real SKU data, then ADM-05 #41 catalogue UI. No fake SKU/price data.
