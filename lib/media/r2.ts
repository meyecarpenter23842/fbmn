/**
 * WEB PR 05: allowlisted, versioned public-media contract.
 * This module is safe to import in browser code: it contains no R2 credentials.
 */
import type { Evidence } from "@/lib/catalog/schema";

export type MediaKind = "brand" | "product" | "banner";
export type ImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

export interface ApprovedMedia {
  kind: MediaKind;
  key: string; // R2 object key, NOT a raw URL or signed upload link
  alt: string;
  width: number;
  height: number;
  mimeType: ImageMime;
  visibility: "public" | "private";
  approval: "pending" | "approved";
  evidence: Evidence;
}

const IMAGE_EXT = /\.(?:jpg|jpeg|png|webp|avif)$/i;
const IMAGE_MIME: Record<string, ImageMime> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", avif: "image/avif",
};
const SEGMENT = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
const BASENAME = /^[a-zA-Z0-9][a-zA-Z0-9_-]*-v[1-9]\d*\.(?:jpg|jpeg|png|webp|avif)$/i;

export function validateR2Key(key: string, kind: MediaKind): boolean {
  if (typeof key !== "string" || key.length > 400 || key.includes("..") || !IMAGE_EXT.test(key)) return false;
  const segments = key.split("/");
  const prefix: Record<MediaKind, string> = { brand: "brand", product: "products", banner: "banners" };
  if (segments[0] !== prefix[kind]) return false;
  if (kind === "brand" ? segments.length !== 2 : segments.length !== 3) return false;
  if (!segments.slice(1, -1).every(segment => SEGMENT.test(segment))) return false;
  return BASENAME.test(segments[segments.length - 1]);
}

export function validateApprovedMedia(asset: ApprovedMedia | null): string[] {
  if (!asset) return ["missing-asset"];
  const errors: string[] = [];
  if (!["brand", "product", "banner"].includes(asset.kind) || !validateR2Key(asset.key, asset.kind)) {
    errors.push("invalid-key");
  }
  if (!asset.alt?.trim() || asset.alt.length > 240) errors.push("invalid-alt");
  if (![asset.width, asset.height].every(value => Number.isSafeInteger(value) && value >= 32 && value <= 8192)) {
    errors.push("invalid-dimensions");
  }
  const ext = asset.key.split(".").pop()?.toLowerCase();
  if (!ext || IMAGE_MIME[ext] !== asset.mimeType) errors.push("invalid-mime");
  if (asset.visibility !== "public" || asset.approval !== "approved") errors.push("not-approved");
  const evidence = asset.evidence;
  if (!evidence || evidence.status !== "confirmed" || !evidence.fileName?.trim() ||
      !evidence.verifiedBy?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(evidence.verifiedAt ?? "")) {
    errors.push("not-verified");
  }
  return errors;
}

/** Only explicitly-approved product/brand/banner images can resolve publicly. */
export function getApprovedMediaUrl(
  asset: ApprovedMedia | null,
  baseUrl: string | undefined,
): string | null {
  if (validateApprovedMedia(asset).length || !baseUrl) return null;
  let base: URL;
  try { base = new URL(baseUrl); } catch { return null; }
  // Prevent accidentally publishing via unreviewed r2.dev endpoints or attacker-controlled paths.
  if (base.protocol !== "https:" || base.username || base.password || base.search ||
      base.hash || base.pathname !== "/" || base.hostname.endsWith(".r2.dev") ||
      base.hostname.endsWith(".example.invalid") || base.hostname === "localhost") return null;
  const key = (asset as ApprovedMedia).key;
  return base.origin + "/" + key.split("/").map(encodeURIComponent).join("/");
}

/**
 * Use the same rules for server-side tickets in the future Workers API, but
 * never sign or PUT R2 objects from this public/browser module.
 */
export function getObjectCachePolicy(asset: ApprovedMedia): string | null {
  return validateApprovedMedia(asset).length ? null : "public, max-age=31536000, immutable";
}
