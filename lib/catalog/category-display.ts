import {cache} from "react";
import {fetchPublicCategoryDisplay} from "../public-api/client";
/** DL5: request-scoped setting, no redeploy needed for Admin mode changes. */
export const getPublicCategoryDisplay=cache(async():Promise<Record<string,"sku">>=>{
 if(process.env.FBMN_PUBLIC_API_ENABLED!=="true")return {};
 try{return await fetchPublicCategoryDisplay(process.env.FBMN_PUBLIC_API_BASE_URL??"");}
 catch {
  console.warn("[Futurebook DL5] public category modes unavailable; safe family fallback");
  return {};
 }
});
