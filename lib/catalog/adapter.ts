import { cache } from "react";
import { catalog } from "./data";
import { toPublicCatalog } from "./public";
import type { PublicCatalog } from "./schema";
import { fetchPublicCatalog } from "../public-api/client";

/**
 * Remote source is explicitly opt-in and server-only. When enabled, failures
 * throw instead of silently falling back to empty/misleading local data.
 */
// React.cache deduplicates metadata and page fetches within one SSR request only.
// No cross-request cache: visibility changes are reflected without redeploy.
export const getPublicCatalog = cache(async (): Promise<PublicCatalog> => {
  if (process.env.FBMN_PUBLIC_API_ENABLED === "true") {
    return fetchPublicCatalog(process.env.FBMN_PUBLIC_API_BASE_URL ?? "");
  }
  return toPublicCatalog(catalog);
});
