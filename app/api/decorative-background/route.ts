import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Same-origin read proxy for a SINGLE Owner-approved decorative WebP.
// The public Worker allowlists the exact private R2 key; do not expose
// Cloudflare credentials, R2 object keys or a caller-controlled proxy URL.
const MAX_BYTES = 5 * 1024 * 1024;
const failure = (status: number) => new Response(null, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});

export async function GET(request: Request) {
  if (new URL(request.url).search) return failure(404);

  let origin: string;
  try {
    const base = new URL(process.env.FBMN_PUBLIC_API_BASE_URL ?? "");
    if (base.protocol !== "https:" || base.pathname !== "/" || base.search || base.hash ||
        base.username || base.password || base.port ||
        !base.hostname || base.hostname === "localhost" ||
        base.hostname.endsWith(".r2.dev") || base.hostname.endsWith(".internal") ||
        base.hostname.endsWith(".invalid") ||
        /^(127\\.|10\\.|192\\.168\\.|169\\.254\\.|0\\.)/.test(base.hostname)) {
      throw new Error("Invalid public API origin");
    }
    origin = base.origin;
  } catch {
    return failure(503);
  }

  try {
    const response = await fetch(origin + "/v1/public/decorative-background", {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
    const length = response.headers.get("content-length");
    if (response.status !== 200 ||
        response.headers.get("content-type")?.split(";")[0] !== "image/webp" ||
        !response.body || (length !== null &&
          (!/^\\d+$/.test(length) || Number(length) < 16 || Number(length) > MAX_BYTES))) {
      await response.body?.cancel();
      return failure(response.status === 404 ? 404 : 503);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch {
    return failure(503);
  }
}
