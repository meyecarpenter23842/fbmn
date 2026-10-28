import type { Catalog } from "./schema";

/**
 * Empty verified source of truth until the owner supplies original price sheets,
 * product catalogue and SKU imagery. Never import test/demo fixtures here.
 * WEB PR 08 will replace this adapter with an authenticated Workers read.
 */
export const catalog: Catalog = {
  mode: "production",
  categories: [],
  products: [],
};
