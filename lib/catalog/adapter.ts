import { catalog } from "./data";
import { toPublicCatalog } from "./public";
import type { PublicCatalog } from "./schema";

/**
 * PR06 public read adapter. Only a verified PR04 allowlisted projection can
 * cross this boundary. PR08 will swap the implementation with a Workers public
 * endpoint; no browser/private Neon calls and no invented fixture fallback.
 */
export async function getPublicCatalog(): Promise<PublicCatalog> {
  return toPublicCatalog(catalog);
}
