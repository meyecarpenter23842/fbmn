// Single source for both per-email unread markers and the global Owner badge.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function mailCandidates(items){
 if(!Array.isArray(items))return [];
 return items.flatMap(raw=>{
  if(!raw||typeof raw!=="object"||typeof raw.id!=="string"||
    !UUID.test(raw.id)||typeof raw.created_at!=="string")return [];
  const date=new Date(raw.created_at);
  if(!Number.isFinite(date.getTime())||date.getUTCFullYear()<2020)return [];
  return [{ref:raw.id.toLowerCase(),occurredAt:date.toISOString()}];
 });
}
// A single inbox source: verified webhook mail events plus provider-indexed
// newly discovered mail. Never insert synthetic Push events for history.
export const MAIL_SOURCES_SQL=`
  SELECT ref,max(occurred_at) AS stamp FROM (
   SELECT ref,occurred_at FROM fbmn_catalog_private.ceo_push_events
    WHERE kind='mail'
   UNION ALL
   SELECT ref,occurred_at FROM fbmn_catalog_private.ceo_mail_catalog
    WHERE notice_eligible
  ) entries GROUP BY ref`;
export const MAIL_READABLE_SQL=`
  SELECT ref,max(occurred_at) AS stamp FROM (
   SELECT ref,occurred_at FROM fbmn_catalog_private.ceo_push_events
    WHERE kind='mail'
   UNION ALL
   SELECT ref,occurred_at FROM fbmn_catalog_private.ceo_mail_catalog
  ) entries GROUP BY ref`;
export const MAIL_UNREAD_SQL=`
 SELECT m.ref,m.stamp FROM (${MAIL_SOURCES_SQL}) m
 LEFT JOIN fbmn_catalog_private.ceo_inbox_reads r
   ON r.owner_subject=$1 AND r.kind='mail' AND r.ref=m.ref
 WHERE m.stamp>coalesce(r.read_through,'epoch'::timestamptz)`;
