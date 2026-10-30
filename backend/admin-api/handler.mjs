// ADM-01. Every admin route requires a verified external identity and a DB grant.
// No cookie/JWT claims may supply roles or channel scopes.
const ROUTES = new Map([
  ["/v1/admin/session", "session.read"],
  ["/v1/admin/channels", "channels.read"],
  ["/v1/admin/publish-capability", "publish.check"],
  ["/v1/admin/pricing-capability", "pricing.check"],
]);
const ROLES = new Set(["viewer", "editor", "publisher", "pricing", "admin", "owner"]);
const PERMITTED = Object.freeze({
  "session.read": ROLES,
  "channels.read": ROLES,
  "publish.check": new Set(["publisher", "admin", "owner"]),
  "pricing.check": new Set(["pricing", "admin", "owner"]),
});
const error = (status, code, corsOrigin) =>
  reply(status, { error: { code, message: "Yêu cầu không thể xử lý." } }, corsOrigin);
function reply(status, body, corsOrigin) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin",
  });
  if (corsOrigin) headers.set("Access-Control-Allow-Origin", corsOrigin);
  return new Response(JSON.stringify(body), { status, headers });
}
export function createAdminApi({ verifyToken, loadActor, listChannels, recordAudit, allowedOrigins = [] }) {
  if (![verifyToken,loadActor,listChannels,recordAudit].every(f => typeof f === "function")) {
    throw new Error("ADM-01 dependencies required");
  }
  if (!Array.isArray(allowedOrigins) || !allowedOrigins.every(origin => {
    try { return new URL(origin).origin === origin && origin.startsWith("https://"); }
    catch { return false; }
  })) throw new Error("Invalid admin origin allowlist");
  const origins = new Set(allowedOrigins);
  return {
    async fetch(request) {
      const origin = request.headers.get("Origin");
      const corsOrigin = origin && origins.has(origin) ? origin : null;
      if (origin && !corsOrigin) return error(403, "origin_forbidden", null);
      const url = new URL(request.url);
      const action = ROUTES.get(url.pathname);
      if (!action) return error(404, "not_found", corsOrigin);
      if (request.method === "OPTIONS") {
        if (!corsOrigin) return error(403, "origin_forbidden", null);
        const resp = new Response(null, { status: 204, headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Cache-Control": "no-store", "Vary": "Origin",
        } });
        return resp;
      }
      const authorization = request.headers.get("Authorization") || "";
      const match = /^Bearer ([A-Za-z0-9._~+/-]+=*)$/.exec(authorization);
      if (!match) return error(401, "unauthenticated", corsOrigin);
      let subject;
      try { subject = await verifyToken(match[1]); }
      catch { return error(401, "unauthenticated", corsOrigin); }
      if (typeof subject !== "string" || subject.length < 1 || subject.length > 200) {
        return error(401, "unauthenticated", corsOrigin);
      }
      let actor;
      try { actor = await loadActor(subject); }
      catch { return error(503, "service_unavailable", corsOrigin); }
      if (!actor || !ROLES.has(actor.role) || actor.enabled !== true) {
        try { await recordAudit({ subject, action, outcome: "denied" }); }
        catch { return error(503, "service_unavailable", corsOrigin); }
        return error(403, "forbidden", corsOrigin);
      }
      if (!PERMITTED[action].has(actor.role)) {
        try { await recordAudit({ subject, action, outcome: "denied" }); }
        catch { return error(503, "service_unavailable", corsOrigin); }
        return error(403, "forbidden", corsOrigin);
      }
      if (request.method !== "GET") return error(405, "method_not_allowed", corsOrigin);
      if (url.search !== "") return error(400, "invalid_query", corsOrigin);
      try {
        let data;
        if (action === "session.read") {
          data = { role: actor.role, channels: ["admin","owner"].includes(actor.role) ? ["public_web","dealer_app","consumer_app"] : actor.channels };
        } else if (action === "channels.read") {
          data = await listChannels(subject, ["admin","owner"].includes(actor.role));
        } else {
          data = { allowed: true };
        }
        await recordAudit({ subject, action, outcome: "allowed" });
        return reply(200, { data }, corsOrigin);
      } catch { return error(503, "service_unavailable", corsOrigin); }
    },
  };
}
