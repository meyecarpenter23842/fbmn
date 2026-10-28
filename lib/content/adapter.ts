import { contentStore } from "./data";
import { toPublicContent } from "./public";
import type { PublicContent } from "./schema";

/** PR07 adapter; PR08 will replace with public-only Workers content read. */
export async function getPublicContent(): Promise<PublicContent> {
  return toPublicContent(contentStore);
}
