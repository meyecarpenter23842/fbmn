import { adminAuth } from "@/lib/admin/auth-server";

export const dynamic = "force-dynamic";
const ALLOWED = new Set(["session", "channels", "publish-capability", "pricing-capability"]);
function jsonError(status: number, code: string) {
  return Response.json({ error: { code } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ route: string }> }) {
  const { route } = await params;
  if (!ALLOWED.has(route)) return jsonError(404, "not_found");
  const base = process.env.FBMN_ADMIN_API_BASE_URL;
  if (!base) return jsonError(503, "admin_api_not_configured");
  let target: URL;
  try {
    target = new URL(base);
    if (target.protocol !== "https:" || target.username || target.password || target.search || target.hash || target.pathname !== "/") {
      return jsonError(503, "admin_api_invalid_config");
    }
  } catch { return jsonError(503, "admin_api_invalid_config"); }

  const auth = adminAuth();
  if (!auth) return jsonError(503, "auth_not_configured");
  // Fetch a fresh signed JWT on the server. Never put tokens in client storage or logs.
  let token: string | undefined;
  try {
    const result = await auth.token();
    token = result.data?.token;
  } catch { return jsonError(503, "auth_unavailable"); }
  if (!token) return jsonError(401, "unauthenticated");

  target.pathname = "/v1/admin/" + route;
  try {
    const response = await fetch(target, {
      method: "GET",
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(7000),
    });
    if (![200, 401, 403, 404, 429, 503].includes(response.status)) {
      return jsonError(503, "upstream_unavailable");
    }
    const body = await response.text();
    if (body.length > 32768 || !response.headers.get("content-type")?.includes("application/json")) {
      return jsonError(503, "upstream_invalid");
    }
    return new Response(body, {
      status: response.status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch { return jsonError(503, "upstream_unavailable"); }
}
