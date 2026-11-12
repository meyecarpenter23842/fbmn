import {createHash,timingSafeEqual} from "node:crypto";
import {withPushDb} from "@/lib/ceo-push-db";
import {pushPayload,validRef} from "@/lib/ceo-push-policy.mjs";
import webpush from "web-push";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=60;
const headers={"Cache-Control":"private, no-store"};
const reject=(status:number)=>Response.json({error:{code:status===401?"unauthorized":"push_unavailable"}},{status,headers});
function constantSecret(a:string|null,b:string|undefined){
 if(!a||!b||b.length<32)return false;
 const x=Buffer.from(a),y=Buffer.from("Bearer "+b);
 return x.length===y.length&&timingSafeEqual(x,y);
}
export async function GET(request:Request){
 if(!constantSecret(request.headers.get("authorization"),process.env.CRON_SECRET))return reject(401);
 const pub=process.env.FBMN_CEO_VAPID_PUBLIC_KEY||"",priv=process.env.FBMN_CEO_VAPID_PRIVATE_KEY||"";
 if(!pub||!priv)return reject(503);
 try{
  webpush.setVapidDetails("mailto:info@fbmn.vn",pub,priv);
  return await withPushDb(async db=>{
   // Short-lived event IDs only; retention applies even when Owner devices are inactive.
   await db.query("DELETE FROM fbmn_catalog_private.ceo_push_events"+
    " WHERE occurred_at<now()-interval '90 days'");
   await db.query("DELETE FROM fbmn_catalog_private.ceo_push_subscriptions"+
    " WHERE last_seen_at<now()-interval '180 days'");
   // No subscription means no data scanning and no historic messages.
   const earliest=await db.query<{since:Date|null}>(
    "SELECT min(created_at) AS since FROM fbmn_catalog_private.ceo_push_subscriptions"+
    " WHERE last_seen_at>now()-interval '180 days'");
   if(!earliest.rows[0]?.since)return Response.json({data:{dispatched:0,subscriptions:0}},{headers});
   const since=earliest.rows[0].since;
   // One chat Push per 30-minute inactivity gap, not per bot message.
   await db.query(`
    INSERT INTO fbmn_catalog_private.ceo_push_events(event_key,kind,ref,occurred_at)
    SELECT event_key,kind,ref,occurred_at FROM (
      SELECT 'contact:'||id::text AS event_key,'contact'::text AS kind,
       id::text AS ref,created_at AS occurred_at
      FROM fbmn_catalog_private.contact_requests
      UNION ALL
      SELECT 'outsourcing:'||id::text,'outsourcing',id::text,created_at
      FROM fbmn_catalog_private.outsourcing_requests
      UNION ALL
      SELECT (CASE WHEN t.prev_at IS NULL THEN 'chat:'||t.session_id
        ELSE 'chat:'||t.session_id||':'||t.id::text END),'chat',
        t.session_id,t.created_at
      FROM (
        SELECT session_id,id,created_at,
          LAG(created_at) OVER(PARTITION BY session_id ORDER BY id) AS prev_at
        FROM fbmn_catalog_private.chat_turns
      ) t
      WHERE t.prev_at IS NULL OR t.created_at-t.prev_at>=interval '30 minutes'
    ) e WHERE occurred_at>=$1 AND occurred_at>=now()-interval '3 days'
    ON CONFLICT(event_key) DO NOTHING`,[since]);
   const events=await db.query<{event_key:string;kind:string;ref:string;occurred_at:Date}>(
    "WITH claimed AS (SELECT event_key FROM fbmn_catalog_private.ceo_push_events"+
    " WHERE delivered_at IS NULL AND attempts<5"+
    " AND (claimed_until IS NULL OR claimed_until<now())"+
    " ORDER BY occurred_at LIMIT 4 FOR UPDATE SKIP LOCKED)"+
    " UPDATE fbmn_catalog_private.ceo_push_events AS e"+
    " SET claimed_until=now()+interval '4 minutes'"+
    " FROM claimed c WHERE e.event_key=c.event_key"+
    " RETURNING e.event_key,e.kind,e.ref,e.occurred_at");

   // Unread badge belongs to each Owner; all four channels are counted.
   const unreadByOwner=new Map<string,Promise<number>>();
   function ownerBadge(subject:string):Promise<number>{
    const existing=unreadByOwner.get(subject);if(existing)return existing;
    const pending=db.query<{total:string}>(`
      SELECT (
       (SELECT count(*) FROM fbmn_catalog_private.chat_conversations c
        LEFT JOIN fbmn_catalog_private.ceo_inbox_reads r
        ON r.owner_subject=$1 AND r.kind='chat' AND r.ref=c.session_id
        WHERE c.updated_at>coalesce(r.read_through,'epoch'::timestamptz))
       +(SELECT count(*) FROM fbmn_catalog_private.ceo_push_events e
        LEFT JOIN fbmn_catalog_private.ceo_inbox_reads r
        ON r.owner_subject=$1 AND r.kind='mail' AND r.ref=e.ref
        WHERE e.kind='mail' AND e.occurred_at>coalesce(r.read_through,'epoch'::timestamptz))
       +(SELECT count(*) FROM fbmn_catalog_private.contact_requests c
        WHERE c.status='new' AND NOT EXISTS(
         SELECT 1 FROM fbmn_catalog_private.ceo_request_reads r
         WHERE r.owner_subject=$1 AND r.kind='contact' AND r.request_id=c.id))
       +(SELECT count(*) FROM fbmn_catalog_private.outsourcing_requests o
        WHERE o.status='new' AND NOT EXISTS(
         SELECT 1 FROM fbmn_catalog_private.ceo_request_reads r
         WHERE r.owner_subject=$1 AND r.kind='outsourcing' AND r.request_id=o.id))
      )::text AS total`,[subject]).then(res=>Math.min(99,Number(res.rows[0]?.total||0)))
      .catch(()=>0);
    unreadByOwner.set(subject,pending);return pending;
   }
   let delivered=0;
   for(const e of events.rows){
    if(!validRef(e.kind,e.ref))continue;
    let failed=false;
    const topic=createHash("sha256").update(e.event_key).digest("base64url").slice(0,26);
    // Select one page of devices still awaiting THIS event. An extra row
    // proves there is another page, so we must never mark delivery complete.
    const pending=await db.query<{endpoint:string;p256dh:string;auth:string;created_at:Date;owner_subject:string}>(
     "SELECT s.endpoint,s.p256dh,s.auth,s.created_at,s.owner_subject"+
     " FROM fbmn_catalog_private.ceo_push_subscriptions s"+
     " JOIN fbmn_admin.principals p ON p.auth_subject=s.owner_subject"+
     " WHERE p.role='owner' AND p.enabled=true"+
     " AND s.last_seen_at>=now()-interval '180 days'"+
     " AND s.created_at<=$2 AND NOT EXISTS ("+
     "SELECT 1 FROM fbmn_catalog_private.ceo_push_delivery_receipts r"+
     " WHERE r.event_key=$1 AND r.endpoint=s.endpoint)"+
     " ORDER BY s.created_at,s.endpoint LIMIT 31",[e.event_key,e.occurred_at]);
    const targets=pending.rows.slice(0,30);
    const hasMoreDevices=pending.rows.length>30;
    await Promise.all(targets.map(async sub=>{
       try{
        const badge=await ownerBadge(sub.owner_subject);
        const payload=pushPayload(e.kind,e.ref,badge,topic,
         e.kind==="chat"&&e.event_key!==("chat:"+e.ref));
        await webpush.sendNotification(
         {endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},payload,
         {TTL:86400,urgency:"normal",topic,timeout:7000,contentEncoding:"aes128gcm"});
        await db.query("INSERT INTO fbmn_catalog_private.ceo_push_delivery_receipts(event_key,endpoint)"+
         " VALUES($1,$2) ON CONFLICT DO NOTHING",[e.event_key,sub.endpoint]);
       }catch(error){
        const status=(error as {statusCode?:number})?.statusCode;
        if(status===404||status===410){
         await db.query("DELETE FROM fbmn_catalog_private.ceo_push_subscriptions WHERE endpoint=$1",[sub.endpoint]);
        }else failed=true;
       }
      }));
    if(failed){
     // Count only real transient failures toward the retry cap, not pages
     // successfully processed while more devices remain.
     await db.query("UPDATE fbmn_catalog_private.ceo_push_events"+
      " SET attempts=attempts+1,claimed_until=now()+interval '5 minutes'"+
      " WHERE event_key=$1",[e.event_key]);
    }else if(hasMoreDevices){
     // Leave event pending for the next Cron; accepted endpoints have receipts.
     await db.query("UPDATE fbmn_catalog_private.ceo_push_events"+
      " SET claimed_until=NULL WHERE event_key=$1",[e.event_key]);
    }else{
     await db.query("UPDATE fbmn_catalog_private.ceo_push_events"+
      " SET delivered_at=now(),claimed_until=NULL WHERE event_key=$1",[e.event_key]);
     delivered++;
    }
   }
   return Response.json({data:{dispatched:delivered}},{headers});
  });
 }catch(error){
  console.error("CEO_PUSH_DISPATCH_FAILED",error instanceof Error?error.name:"unknown");
  return reject(503);
 }
}
