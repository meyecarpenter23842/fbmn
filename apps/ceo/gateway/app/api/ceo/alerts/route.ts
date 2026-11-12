import {requireOwner} from "@/lib/owner-gate";
import {withPushDb} from "@/lib/ceo-push-db";
import {validRef,allowedOrigin} from "@/lib/ceo-push-policy.mjs";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(code:string,status:number)=>Response.json({error:{code}},{status,headers});
export async function GET(request:Request){
 const owner=await requireOwner(request);
 if(owner.status!==200||!owner.subject)return fail("owner_required",owner.status);
 try{
  return await withPushDb(async db=>{
   // Counts cover the entire Owner inbox, not only the first loaded UI page.
   const chat=await db.query<{session_id:string;total:string}>(`
    SELECT c.session_id, count(*) OVER()::text AS total
    FROM fbmn_catalog_private.chat_conversations c
    LEFT JOIN fbmn_catalog_private.ceo_inbox_reads r
      ON r.owner_subject=$1 AND r.kind='chat' AND r.ref=c.session_id
    WHERE c.updated_at>coalesce(r.read_through,'epoch'::timestamptz)
    ORDER BY c.updated_at DESC LIMIT 200`,[owner.subject]);
   const mail=await db.query<{ref:string;total:string}>(`
    SELECT e.ref,count(*) OVER()::text AS total
    FROM fbmn_catalog_private.ceo_push_events e
    LEFT JOIN fbmn_catalog_private.ceo_inbox_reads r
      ON r.owner_subject=$1 AND r.kind='mail' AND r.ref=e.ref
    WHERE e.kind='mail' AND e.occurred_at>coalesce(r.read_through,'epoch'::timestamptz)
    ORDER BY e.occurred_at DESC LIMIT 200`,[owner.subject]);
   const requests=await db.query<{kind:string;total:string}>(`
    SELECT 'contact' AS kind,count(*)::text AS total
     FROM fbmn_catalog_private.contact_requests c
     WHERE c.status='new' AND NOT EXISTS(
      SELECT 1 FROM fbmn_catalog_private.ceo_request_reads r
      WHERE r.owner_subject=$1 AND r.kind='contact' AND r.request_id=c.id)
    UNION ALL
    SELECT 'outsourcing',count(*)::text
     FROM fbmn_catalog_private.outsourcing_requests o
     WHERE o.status='new' AND NOT EXISTS(
      SELECT 1 FROM fbmn_catalog_private.ceo_request_reads r
      WHERE r.owner_subject=$1 AND r.kind='outsourcing' AND r.request_id=o.id)`,[owner.subject]);
   const count=(rows:{total:string}[])=>rows.length?Number(rows[0].total):0;
   const contact=Number(requests.rows.find(r=>r.kind==="contact")?.total||0);
   const outsourcing=Number(requests.rows.find(r=>r.kind==="outsourcing")?.total||0);
   return Response.json({data:{
    chat:{count:count(chat.rows),ids:chat.rows.map(r=>r.session_id)},
    mail:{count:count(mail.rows),ids:mail.rows.map(r=>r.ref)},
    contact,outsourcing,
    // Display as an accurate aggregate; the app badge is intentionally bounded to 99.
    total:count(chat.rows)+count(mail.rows)+contact+outsourcing
   }},{headers});
  });
 }catch{return fail("alerts_unavailable",503);}
}
export async function POST(request:Request){
 if(!allowedOrigin(request))return fail("origin_forbidden",403);
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return fail("invalid_body",415);
 const owner=await requireOwner(request);
 if(owner.status!==200||!owner.subject)return fail("owner_required",owner.status);
 const stated=request.headers.get("content-length");
 if(stated!==null&&(!/^\d+$/.test(stated)||Number(stated)>512))return fail("invalid_body",400);
 let raw:string;
 try{raw=await request.text();if(raw.length>512)return fail("invalid_body",400);}
 catch{return fail("invalid_body",400);}
 let value:unknown;
 try{value=JSON.parse(raw);}catch{return fail("invalid_body",400);}
 if(!value||typeof value!=="object"||Array.isArray(value))return fail("invalid_body",400);
 const candidate=value as Record<string,unknown>;
 const kind=candidate.kind,id=candidate.id,turnId=candidate.turnId;
 if((kind!=="chat"&&kind!=="mail")||typeof id!=="string"||
  !validRef(kind,id)||Object.keys(candidate).length!==(kind==="chat"?3:2)||
  Object.keys(candidate).some(k=>!["kind","id","turnId"].includes(k))||
  (kind==="chat"&&(typeof turnId!=="string"||!/^[1-9][0-9]{0,18}$/.test(turnId)))||
  (kind==="mail"&&turnId!==undefined))return fail("invalid_body",400);
 try{
  const marked=await withPushDb(async db=>{
   // Keep PostgreSQL microseconds intact. Never round-trip timestamptz via JS Date.
   const sql=kind==="chat"?`
    INSERT INTO fbmn_catalog_private.ceo_inbox_reads
      (owner_subject,kind,ref,read_through)
    SELECT $1,'chat',$2,t.created_at FROM fbmn_catalog_private.chat_turns t
    WHERE t.session_id=$2 AND t.id=$3::bigint
    ON CONFLICT(owner_subject,kind,ref)
    DO UPDATE SET read_through=GREATEST(
      fbmn_catalog_private.ceo_inbox_reads.read_through,excluded.read_through)`:`
    INSERT INTO fbmn_catalog_private.ceo_inbox_reads
      (owner_subject,kind,ref,read_through)
    SELECT $1,'mail',$2,e.occurred_at
    FROM fbmn_catalog_private.ceo_push_events e
    WHERE e.kind='mail' AND e.ref=$2
    ORDER BY e.occurred_at DESC LIMIT 1
    ON CONFLICT(owner_subject,kind,ref)
    DO UPDATE SET read_through=GREATEST(
      fbmn_catalog_private.ceo_inbox_reads.read_through,excluded.read_through)`;
   const row=await db.query(sql,kind==="chat"?[owner.subject,id,turnId]:[owner.subject,id]);
   return (row.rowCount||0)>0;
  });
  return marked?Response.json({data:{read:true}},{headers}):fail("not_found",404);
 }catch{return fail("alerts_unavailable",503);}
}
