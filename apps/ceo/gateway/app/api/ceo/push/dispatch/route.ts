import {createHash,timingSafeEqual} from "node:crypto";
import {withPushDb} from "@/lib/ceo-push-db";
import {pushPayload,validRef,pendingTargets} from "@/lib/ceo-push-policy.mjs";
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
   // No subscription means no data scanning and no historic messages.
   const earliest=await db.query<{since:Date|null}>(
    "SELECT min(created_at) AS since FROM fbmn_catalog_private.ceo_push_subscriptions"+
    " WHERE last_seen_at>now()-interval '180 days'");
   if(!earliest.rows[0]?.since)return Response.json({data:{dispatched:0,subscriptions:0}},{headers});
   const since=earliest.rows[0].since;
   await db.query("INSERT INTO fbmn_catalog_private.ceo_push_events(event_key,kind,ref,occurred_at) "+
    "SELECT kind||':'||ref,kind,ref,occurred_at FROM ("+
    "SELECT 'contact'::text AS kind,id::text AS ref,created_at AS occurred_at FROM fbmn_catalog_private.contact_requests"+
    " UNION ALL SELECT 'outsourcing',id::text,created_at FROM fbmn_catalog_private.outsourcing_requests"+
    " UNION ALL SELECT 'chat',session_id,created_at FROM fbmn_catalog_private.chat_conversations"+
    ") e WHERE occurred_at>=$1 AND occurred_at>=now()-interval '3 days'"+
    " ON CONFLICT(event_key) DO NOTHING",[since]);
   const events=await db.query<{event_key:string;kind:string;ref:string;occurred_at:Date}>(
    "WITH claimed AS (SELECT event_key FROM fbmn_catalog_private.ceo_push_events"+
    " WHERE delivered_at IS NULL AND attempts<5"+
    " AND (claimed_until IS NULL OR claimed_until<now())"+
    " ORDER BY occurred_at LIMIT 6 FOR UPDATE SKIP LOCKED)"+
    " UPDATE fbmn_catalog_private.ceo_push_events AS e"+
    " SET claimed_until=now()+interval '4 minutes',attempts=attempts+1"+
    " FROM claimed c WHERE e.event_key=c.event_key"+
    " RETURNING e.event_key,e.kind,e.ref,e.occurred_at");
   const subs=await db.query<{endpoint:string;p256dh:string;auth:string;created_at:Date}>(
    "SELECT s.endpoint,s.p256dh,s.auth,s.created_at"+
    " FROM fbmn_catalog_private.ceo_push_subscriptions s"+
    " JOIN fbmn_admin.principals p ON p.auth_subject=s.owner_subject"+
    " WHERE p.role='owner' AND p.enabled=true"+
    " AND s.last_seen_at>=now()-interval '180 days'"+
    " ORDER BY s.created_at LIMIT 30");
   const counts=await db.query<{total:string}>(
    "SELECT (SELECT count(*) FROM fbmn_catalog_private.contact_requests WHERE status='new')+"+
    " (SELECT count(*) FROM fbmn_catalog_private.outsourcing_requests WHERE status='new') AS total");
   const badge=Math.min(Number(counts.rows[0]?.total||0),99);
   let delivered=0;
   for(const e of events.rows){
    if(!validRef(e.kind,e.ref))continue;
    let failed=false;
    const payload=pushPayload(e.kind,e.ref,badge);
    const topic=createHash("sha256").update(e.event_key).digest("base64url").slice(0,26);
    const receipts=await db.query<{endpoint:string}>(
     "SELECT endpoint FROM fbmn_catalog_private.ceo_push_delivery_receipts WHERE event_key=$1",
     [e.event_key]);
    const targets=pendingTargets(subs.rows,receipts.rows.map(r=>r.endpoint),e.occurred_at);
    await Promise.all(targets.map(async sub=>{
       try{
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
    if(!failed){
     await db.query("UPDATE fbmn_catalog_private.ceo_push_events SET delivered_at=now(),claimed_until=NULL"+
      " WHERE event_key=$1",[e.event_key]);delivered++;
    }else{
     await db.query("UPDATE fbmn_catalog_private.ceo_push_events SET claimed_until=now()+interval '5 minutes'"+
      " WHERE event_key=$1",[e.event_key]);
    }
   }
   return Response.json({data:{dispatched:delivered,subscriptions:subs.rows.length}},{headers});
  });
 }catch{
  return reject(503);
 }
}
