import {requireOwner} from "@/lib/owner-gate";
import {withPushDb} from "@/lib/ceo-push-db";
import {allowedOrigin,pushEndpoint} from "@/lib/ceo-push-policy.mjs";
import webpush from "web-push";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
const noncePattern=/^[A-Za-z0-9_-]{16,32}$/;
/** Immediate browser-to-browser real Web Push, never a synthetic badge update.
 * Authenticated Owner, exact registered endpoint, server-side 60s cooldown.
 * Never accept arbitrary destination or user content for this test.
 */
export async function POST(request:Request){
 if(!allowedOrigin(request))return fail(403,"forbidden");
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json")
  return fail(415,"invalid_request");
 const owner=await requireOwner(request);
 if(owner.status!==200||!owner.subject)return fail(owner.status,"owner_required");
 const len=request.headers.get("content-length");
 if(len!==null&&(!/^\d+$/.test(len)||Number(len)>4096))return fail(413,"too_large");
 let body:unknown;
 try{
  const raw=await request.text();if(raw.length>4096)return fail(413,"too_large");
  body=JSON.parse(raw);
 }catch{return fail(400,"invalid_request");}
 if(!body||typeof body!=="object"||Array.isArray(body)||
  Object.keys(body).length!==2||!Object.hasOwn(body,"endpoint")||
  !Object.hasOwn(body,"nonce"))return fail(400,"invalid_request");
 const endpoint=(body as Record<string,unknown>).endpoint;
 const nonce=(body as Record<string,unknown>).nonce;
 if(!pushEndpoint(endpoint)||typeof nonce!=="string"||!noncePattern.test(nonce))
  return fail(400,"invalid_request");
 const vapidPublic=process.env.FBMN_CEO_VAPID_PUBLIC_KEY||"";
 const vapidPrivate=process.env.FBMN_CEO_VAPID_PRIVATE_KEY||"";
 if(!vapidPublic||!vapidPrivate)return fail(503,"push_unavailable");
 try{
  // Atomic claim; a browser cannot flood endpoints by repeatedly pressing Test.
  const row=await withPushDb(async db=>(await db.query<{
   endpoint:string;p256dh:string;auth:string
  }>(`
   UPDATE fbmn_catalog_private.ceo_push_subscriptions
    SET last_test_at=now()
    WHERE endpoint=$1 AND owner_subject=$2
      AND last_seen_at>now()-interval '180 days'
      AND (last_test_at IS NULL OR last_test_at<now()-interval '60 seconds')
    RETURNING endpoint,p256dh,auth`,[endpoint,owner.subject])).rows[0]);
  if(!row)return fail(429,"test_cooldown_or_missing");
  webpush.setVapidDetails("mailto:info@fbmn.vn",vapidPublic,vapidPrivate);
  await webpush.sendNotification(
   {endpoint:row.endpoint,keys:{p256dh:row.p256dh,auth:row.auth}},
   JSON.stringify({type:"test",nonce}),
   {TTL:120,urgency:"high",topic:nonce.slice(0,26),
    timeout:7000,contentEncoding:"aes128gcm"});
  // Accepted by the push provider, not proof the device displayed it.
  return Response.json({data:{accepted:true}},{headers});
 }catch(error){
  const status=(error as {statusCode?:number})?.statusCode;
  if(status===404||status===410)return fail(410,"device_expired");
  console.error("CEO_PUSH_TEST_FAILED",
   error instanceof Error?error.name:"unknown");
  return fail(503,"push_unavailable");
 }
}
