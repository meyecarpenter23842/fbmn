import {withPushDb} from "@/lib/ceo-push-db";
import {readBoundedMailBody} from "@/lib/ceo-mail-policy.mjs";
import {verifyResendWebhook,parseReceivedMailSignal,
 MAX_RESEND_WEBHOOK_BYTES} from "@/lib/ceo-mail-webhook.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
// This endpoint accepts signed Resend events, not an Owner browser session.
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
export async function POST(request:Request){
 const secret=process.env.RESEND_WEBHOOK_SECRET||"";
 if(!secret)return Response.json({error:"webhook_not_configured"},{status:503,headers});
 const stated=Number(request.headers.get("content-length")||0);
 if(!Number.isFinite(stated)||stated>MAX_RESEND_WEBHOOK_BYTES)
  return Response.json({error:"too_large"},{status:413,headers});
 const body=await readBoundedMailBody(request);
 if(!body)return Response.json({error:"invalid_body"},{status:400,headers});
 if("tooLarge" in body||Buffer.byteLength(body.text,"utf8")>MAX_RESEND_WEBHOOK_BYTES)
  return Response.json({error:"too_large"},{status:413,headers});
 if(!verifyResendWebhook(body.text,request.headers,secret))
  return Response.json({error:"invalid_signature"},{status:401,headers});
 const mail=parseReceivedMailSignal(body.text);
 if(!mail)return Response.json({ok:true},{headers});
 try{
  await withPushDb(async db=>{
   await db.query(
    "INSERT INTO fbmn_catalog_private.ceo_push_events(event_key,kind,ref,occurred_at)"+
    " VALUES($1,'mail',$2,$3) ON CONFLICT(event_key) DO NOTHING",
    ["mail:"+mail.id,mail.id,mail.occurredAt]);
  });
  // Existing Owner-only Cron sends queued events with per-device delivery receipts.
  return Response.json({ok:true},{headers});
 }catch{
  // Let Resend retry this signed event rather than losing notifications.
  return Response.json({error:"push_unavailable"},{status:503,headers});
 }
}
