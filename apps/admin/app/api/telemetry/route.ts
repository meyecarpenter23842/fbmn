import { adminAuth } from "@/lib/auth-server";
import { parseAdminTelemetry, posthogAggregatePayload } from "@/lib/admin-telemetry-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff"
};
const fail = (status: number) => new Response(null, { status, headers: HEADERS });

function adminApiOrigin(): string | null {
  try {
    const url = new URL(process.env.FBMN_ADMIN_API_BASE_URL || "");
    return url.protocol === "https:" && !url.username && !url.password &&
      !url.search && !url.hash && url.pathname === "/" ? url.origin : null;
  } catch { return null; }
}

function posthogConfiguration(): { key: string; host: string } | null {
  const key = process.env.FBMN_ADMIN_POSTHOG_PROJECT_KEY || "";
  if (!/^[A-Za-z0-9_-]{12,180}$/.test(key)) return null;
  const host = process.env.FBMN_ADMIN_POSTHOG_HOST || "https://us.i.posthog.com";
  // Fixed destinations protect the API key against a compromised environment URL.
  if (!["https://us.i.posthog.com", "https://eu.i.posthog.com"].includes(host))
    return null;
  return { key, host };
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin ||
      request.headers.get("sec-fetch-site") === "cross-site") return fail(403);
  if (url.search || request.headers.get("content-type")?.split(";")[0] !== "application/json")
    return fail(415);
  if (Number(request.headers.get("content-length") || 0) > 256) return fail(413);
  let raw: string;
  try { raw = await request.text(); } catch { return fail(400); }
  if (raw.length > 256) return fail(413);
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return fail(400); }
  const record = parseAdminTelemetry(parsed);
  if (!record) return fail(400);

  // Feature remains OFF until both explicit client opt-in and server key exist.
  const configuration = posthogConfiguration();
  if (!configuration || process.env.FBMN_ADMIN_POSTHOG_ENABLED !== "1") return fail(204);

  const base = adminApiOrigin();
  const auth = adminAuth();
  if (!base || !auth) return fail(503);
  let token = "";
  try {
    const result = await auth.token();
    token = result.data?.token || "";
  } catch { return fail(401); }
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) ||
      token.length > 12000) return fail(401);

  try {
    // Verify a *current* Admin entitlement via restricted Worker, never trust a
    // browser 'authorised' flag or just a valid login cookie.
    const session = await fetch(base + "/v1/admin/session", {
      method: "GET", cache: "no-store", redirect: "manual",
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      signal: AbortSignal.timeout(4000)
    });
    if (session.status !== 200) return fail(session.status === 403 ? 403 : 401);
  } catch { return fail(503); }

  // Only validated enum values reach PostHog. Never include UA, URL, referrer,
  // JWT, cookie, email, raw error/stack, filename, SKU, prices or user identity.
  try {
    await fetch(configuration.host + "/capture/", {
      method: "POST", cache: "no-store", redirect: "manual",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(posthogAggregatePayload(configuration.key, record)),
      signal: AbortSignal.timeout(4000)
    });
  } catch { /* Best-effort analytics; no impact on Admin business operations. */ }
  return fail(204);
}
