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
// One Owner request claims a 2-minute scan lease; other clients reuse Neon.
export async function refreshMailIndexIfDue():Promise<void>{
 const lease=await withPushDb(async db=>(await db.query(`
  UPDATE fbmn_catalog_private.ceo_mail_scan SET scanned_at=now()
   WHERE id=1 AND (scanned_at IS NULL OR scanned_at<now()-interval '2 minutes')
  RETURNING id`)).rows.length>0);
 if(!lease)return;
 const up=await resendRequest("/emails/receiving?limit=100");
 if(up.status!==200||!Array.isArray(up.payload?.data)){
  await resetScan().catch(()=>{});
  return;
 }
 try{
  await withPushDb(async db=>{
   await indexReceived(db,up.payload!.data as unknown[]);
  });
 }catch{
  await resetScan().catch(()=>{});
 }
}
async function resetScan(){
 await withPushDb(db=>db.query(`
  UPDATE fbmn_catalog_private.ceo_mail_scan SET scanned_at=NULL WHERE id=1`));
}
