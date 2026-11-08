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
    const entries=await getPublicCms();
    return {
     ...base,
     articles:entries.filter(entry=>entry.kind==="article"&&entry.slot==="news.list").map(entry=>({
      slug:entry.slug,title:entry.title,summary:entry.summary,
      paragraphs:entry.paragraphs,publishedAt:entry.publishedAt
     })),
     promotions:entries.filter(entry=>entry.kind==="promotion"&&entry.slot==="promotions.list")
      .filter(entry=>entry.endsAt!==null).map(entry=>({
       slug:entry.slug,title:entry.title,summary:entry.summary,
       detail:entry.paragraphs.join("\\n\\n"),endsAt:entry.endsAt as string
      }))
    };
  }
  return toPublicContent(contentStore);
}
