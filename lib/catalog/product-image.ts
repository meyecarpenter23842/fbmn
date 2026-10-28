import { validateR2Key } from "../media/r2.ts";

/**
 * Assemble a URL only from media that has already passed the PR04 public
 * projection approval gate. NOT an authorisation function. PR08 Workers media
 * endpoint must separately enforce approved reads.
 */
export function getPublishedProductImageUrl(key: string, origin: string | undefined): string | null {
  if (!origin || !validateR2Key(key, "product")) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash ||
      url.username || url.password || url.hostname.endsWith(".r2.dev") ||
      url.hostname.endsWith(".example.invalid") || url.hostname === "localhost") return null;
    return url.origin + "/" + key.split("/").map(encodeURIComponent).join("/");
  } catch {
    return null;
  }
}
