import {cache} from "react";
import {fetchPublicHomeLayout} from "../public-api/client";
import {DEFAULT_HOME_LAYOUT} from "./home";
import type {HomeLayout} from "./home";
/** Request-scoped, no-store read. A stale Worker cannot break published products. */
export const getPublicHomeLayout=cache(async():Promise<HomeLayout>=>{
 if(process.env.FBMN_PUBLIC_API_ENABLED!=="true")return DEFAULT_HOME_LAYOUT;
 try {
  return await fetchPublicHomeLayout(process.env.FBMN_PUBLIC_API_BASE_URL??"");
 }catch {
  // Only presentation config falls back; catalogue errors remain visible.
  console.warn("[Futurebook DL4] public layout unavailable; using deterministic default");
  return DEFAULT_HOME_LAYOUT;
 }
});
