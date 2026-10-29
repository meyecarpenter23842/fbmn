import { contentStore } from "./data";
import { toPublicContent } from "./public";
import type { PublicContent } from "./schema";
import { fetchPublicContent } from "../public-api/client";

/** Server-side only; opt-in after Worker staging tests and security approval. */
export async function getPublicContent(): Promise<PublicContent> {
  if (process.env.FBMN_PUBLIC_API_ENABLED === "true") {
    return fetchPublicContent(process.env.FBMN_PUBLIC_API_BASE_URL ?? "");
  }
  return toPublicContent(contentStore);
}
