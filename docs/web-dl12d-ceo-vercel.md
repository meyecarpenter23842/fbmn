# DL12D — CEO Vercel build and release

**Owner authorized 11/11/2026:** create Vercel project and deployment command for Flutter CEO; preserve existing Website/Admin/Workers and PostHog. Production app must use **one origin** for Flutter, Neon Auth cookies and Owner API.

## Vercel project

- Team: `alibaba240185` (`team_hUFtVIsg2fKzwGlfi2Lrw1du`).
- Project: `fbmn-ceo` (`prj_aR7k1l9K9CRhIE7Ao1yAaIKnL26B`).
- Framework: Next.js, Node 24, root directory: `apps/ceo/gateway`.
- Source outside root: enabled, so Flutter lives in `apps/ceo/flutter`.
- Build command: `bash scripts/vercel-build-ceo.sh`.
- Production domain: Owner will add `ceo.fbmn.vn` under the CEO project's Domains. Do not move Website/Admin domains.
- Server-only production/preview env: `FBMN_ADMIN_API_BASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` (separate CEO cookie secret). Do not expose these as NEXT_PUBLIC or Flutter defines.
- Deployment protection may require Vercel sign-in on temporary vercel.app URLs; Owner-only permissions are separately enforced in the gateway.

## Vercel remote Git-source deploy (reviewed commit)
After dev PR CI + Codex, squash merge dev, sync reviewed tree to the upstream repo, and verify hashes, deploy the approved dev commit with the connected Vercel tool to project `fbmn-ceo`. This manual Git-source deployment compiles Flutter 3.47.9 on the Vercel build machine and packages `public/ceo` before Next.js build.

## Local command

From a machine with Vercel CLI and access to the reviewed repo, run:

```bash
# From the FBMN repository root; project Root Directory is set in Vercel.
vercel link --scope alibaba240185 --project fbmn-ceo --yes
vercel deploy --prod --yes --scope alibaba240185
```

The Vercel project build command handles the Flutter SDK (if not installed), Flutter web build, copying into `public/ceo`, then Next build. Do not run against a dirty or unreviewed tree. The CLI must run from the **repository root** because Vercel already sets Root Directory to `apps/ceo/gateway`. Running from inside the gateway applies the root twice. For constrained developer machines, use the Git-source deployment or the manual CI workflow with verified prebuilt Flutter artifacts.

## Deploy bằng Issue comment

Workflow chỉ nhận comment của Owner trên **Issue #72** của repo phát triển:
- /deploy ceo preview
- /deploy ceo production

Xem [hướng dẫn Issue comment](ceo-issue-comment-deploy.md). Kích hoạt bằng comment thật sau khi mã nguồn đã merge, CI + Codex sạch và đồng bộ hai repo. Không dùng workflow_dispatch hay CLI thủ công cho phát hành thường lệ. GitHub secret VERCEL_TOKEN cần được cấu hình sẵn; thiếu thì dừng an toàn.

### Acceptance

- Flutter `flutter analyze`, `flutter test`, `flutter build web --base-href=/ceo/` green.
- Next gateway lint, typecheck, unit, Next production build green.
- Public GET `/ceo/index.html` returns Flutter HTML with `/ceo/` base; anonymous GET `/api/ceo/session` must reject, never leak data.
- Real Owner login + inbox and contact/gia công detail on phone. Browser automation does not prove real-device results.
- Do not claim PostHog DL12B, Web Push DL12C, or chat unread receipts implemented.
