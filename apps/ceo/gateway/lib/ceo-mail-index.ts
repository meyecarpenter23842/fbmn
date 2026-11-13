import "server-only";
import type {PoolClient} from "pg";
import {withPushDb} from "./ceo-push-db";
import {resendRequest,mailVisible} from "./ceo-mail-service";
import {mailCandidates,MAIL_UNREAD_SQL} from "./ceo-mail-unread.mjs";
type Candidate={ref:string;occurredAt:string};
export async function indexReceived(db:PoolClient,providerItems:unknown[]):Promise<Candidate[]>{
 const items=providerItems.filter(item=>mailVisible(item,"inbox"));
 const rows=mailCandidates(items) as Candidate[];
 if(!rows.length)return rows;
 // Keep only IDs and timestamps; exclude sender, subject, body and addresses.
 const cutover=await db.query<{cutover_at:Date}>(`
  SELECT cutover_at FROM fbmn_catalog_private.ceo_mail_scan WHERE id=1`);
 if(!cutover.rows[0])throw new Error("mail_scan_unconfigured");
 await db.query(`
  INSERT INTO fbmn_catalog_private.ceo_mail_catalog(ref,occurred_at,notice_eligible)
  SELECT input.ref,input.occurred_at,input.occurred_at >= $3::timestamptz
  FROM unnest($1::text[],$2::timestamptz[]) AS input(ref,occurred_at)
  ON CONFLICT(ref) DO UPDATE
   SET occurred_at=GREATEST(fbmn_catalog_private.ceo_mail_catalog.occurred_at,excluded.occurred_at),
       notice_eligible=fbmn_catalog_private.ceo_mail_catalog.notice_eligible OR excluded.notice_eligible,
       indexed_at=now()`,[rows.map(x=>x.ref),rows.map(x=>x.occurredAt),cutover.rows[0].cutover_at]);
 return rows;
}
export async function inboxUnread(db:PoolClient,ownerSubject:string,ids:string[]){
 if(!ids.length)return new Set<string>();
 const query=await db.query<{ref:string}>(`
  SELECT unread.ref FROM (${MAIL_UNREAD_SQL}) unread
  WHERE unread.ref=ANY($2::text[])`,[ownerSubject,ids]);
 return new Set(query.rows.map(x=>x.ref));
}
// Provider catch-up protects unread badge when a webhook is delayed/missing.
// A scan progresses by provider cursor instead of revisiting only page one.
// A page crossing the original cutover boundary ends the scan; older messages
// are historical and do not retroactively appear unread.
export async function refreshMailIndexIfDue():Promise<void>{
 const lease=await withPushDb(async db=>(await db.query<{
  scan_cursor:string|null;cutover_at:Date
 }>(`
  UPDATE fbmn_catalog_private.ceo_mail_scan SET scanned_at=now()
   WHERE id=1 AND (scanned_at IS NULL OR scanned_at<now()-interval '2 minutes')
  RETURNING scan_cursor,cutover_at`)).rows[0]);
 if(!lease)return;
 const cursor=lease.scan_cursor;
 const up=await resendRequest("/emails/receiving?limit=100"+
  (cursor?"&after="+encodeURIComponent(cursor):""));
 if(up.status!==200||!Array.isArray(up.payload?.data)){
  await resetScan().catch(()=>{});
  return;
 }
 try{
  await withPushDb(async db=>{
   const items=up.payload!.data as unknown[];
   await indexReceived(db,items);
   const rawLast=items.at(-1);
   const lastId=rawLast&&typeof rawLast==="object"&&"id" in rawLast?
    (rawLast as {id:unknown}).id:null;
   const list=mailCandidates(items) as Candidate[];
   const crossesBaseline=list.some(item=>
    Date.parse(item.occurredAt)<lease.cutover_at.getTime());
   const hasMore=up.payload!.has_more===true;
   const finished=!hasMore||crossesBaseline;
   if(!finished&&(typeof lastId!=="string"||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lastId))){
    throw new Error("mail_scan_bad_cursor");
   }
   await db.query(`
    UPDATE fbmn_catalog_private.ceo_mail_scan
      SET scan_cursor=$1,
       scanned_at=CASE WHEN $1::text IS NULL THEN now() ELSE NULL END
    WHERE id=1`,[finished?null:lastId]);
  });
 }catch{
  await resetScan().catch(()=>{});
 }
}
async function resetScan(){
 // Preserve scan_cursor, so an interrupted multi-page run retries its page.
 await withPushDb(db=>db.query(`
  UPDATE fbmn_catalog_private.ceo_mail_scan SET scanned_at=NULL WHERE id=1`));
}
