import { adminAuth } from "@/lib/admin/auth-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
const fail = () => Response.json({ error: "auth_not_configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });

// Strictly proxy through Neon Auth; never implement an alternate login path.
export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const auth = adminAuth();
  if (!auth) return fail();
  return auth.handler().GET(request, context);
}
export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const auth = adminAuth();
  if (!auth) return fail();
  return auth.handler().POST(request, context);
}
