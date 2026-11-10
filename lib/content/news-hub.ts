import type {PublicArticle,PublicPromotion,PublicContent} from "./schema";
export type NewsHubFilter="all"|"news"|"promotions";
export type NewsHubItem=
 | {kind:"news";publishedAt:string;slug:string;article:PublicArticle}
 | {kind:"promotions";publishedAt:string;slug:string;promotion:PublicPromotion};
/** Public projection has already removed draft/hidden/future/expired records.
 * This helper only combines and sorts that allowlisted output; it never reads private CMS. */
export function buildNewsHubItems(content:Pick<PublicContent,"articles"|"promotions">,filter:NewsHubFilter="all"):NewsHubItem[]{
 const news:NewsHubItem[]=filter==="promotions"?[]:content.articles.map(article=>({
  kind:"news",slug:article.slug,publishedAt:article.publishedAt,article
 }));
 const promotions:NewsHubItem[]=filter==="news"?[]:content.promotions.map(promotion=>({
  kind:"promotions",slug:promotion.slug,publishedAt:promotion.publishedAt??promotion.endsAt,promotion
 }));
 return [...news,...promotions].sort((a,b)=>
  b.publishedAt.localeCompare(a.publishedAt)||
  a.kind.localeCompare(b.kind)||a.slug.localeCompare(b.slug));
}
