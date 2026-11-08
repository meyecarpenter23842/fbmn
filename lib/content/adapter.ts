import { contentStore } from "./data";
import { toPublicContent } from "./public";
import type { PublicContent } from "./schema";
import { fetchPublicContent } from "../public-api/client";
import {cmsEnabled,getPublicCms} from "./cms";

/** Server-side only; opt-in after Worker staging tests and security approval. */
export async function getPublicContent(): Promise<PublicContent> {
  if (process.env.FBMN_PUBLIC_API_ENABLED === "true") {
    const base=await fetchPublicContent(process.env.FBMN_PUBLIC_API_BASE_URL ?? "");
    if(!cmsEnabled())return base;
    let entries;
    try{entries=await getPublicCms();}
    catch{
      // Preserve previously approved content during a transient CMS outage.
      // An empty successful CMS snapshot still correctly removes hidden items.
      console.error("[Futurebook CMS] editorial read temporarily unavailable");
      return base;
    }
    return {
     ...base,
     articles:entries.filter(entry=>entry.kind==="article").map(entry=>({
      slug:entry.slug,title:entry.title,summary:entry.summary,
      paragraphs:entry.paragraphs,publishedAt:entry.publishedAt,slot:entry.slot as "news.list"|"home.news_featured"
     })),
     promotions:entries.filter(entry=>entry.kind==="promotion")
      .filter(entry=>entry.endsAt!==null).map(entry=>({
       slug:entry.slug,title:entry.title,summary:entry.summary,
       detail:entry.paragraphs.join("\n\n"),endsAt:entry.endsAt as string,
       slot:entry.slot as "promotions.list"|"home.promotion_featured"
      }))
    };
  }
  return toPublicContent(contentStore);
}
