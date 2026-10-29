import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

// No hardcoded fallback: a preview without secrets never opens a session.
export function adminAuth() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret || secret.length < 32) return null;
  try {
    if (new URL(baseUrl).protocol !== "https:") return null;
  } catch { return null; }
  return createNeonAuth({ baseUrl, cookies: { secret, sessionDataTtl: 60 } });
}
