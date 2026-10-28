import type { ContentStore } from "./schema";

/**
 * Source-backed production content. There are no approved contact details,
 * articles, campaigns or dealer policies yet. Do not copy details from
 * screenshot mockups or external websites without owner verification.
 */
export const contentStore: ContentStore = {
  mode: "production",
  company: null,
  articles: [],
  promotions: [],
  dealerInformation: null,
};
