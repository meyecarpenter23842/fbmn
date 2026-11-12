import {requireOwner} from "@/lib/owner-gate";
import {withPushDb} from "@/lib/ceo-push-db";
import {allowedOrigin} from "@/lib/ceo-push-policy.mjs";
import {parseReadMark} from "@/lib/ceo-read-policy.mjs";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
// Only writes an Owner read receipt; never modifies 'new' or 'handled' state.
export async function POST(request:Request){
 if(!allowedOrigin(request))return fail(403,"origin_forbidden");
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return fail(415,"invalid_content_type");
 const owner=await requireOwner(request);
 if(owner.status!==200||!owner.subject)return fail(owner.status,"owner_required");
 if(Number(request.headers.get("content-length")||0)>256)return fail(400,"invalid_body");
 let body:unknown;
 try{
  const raw=await request.text();
  if(raw.length>256)return fail(400,"invalid_body");
  body=JSON.parse(raw);
 }catch{return fail(400,"invalid_body");}
 const parsed=parseReadMark(body);
 if(!parsed)return fail(400,"invalid_body");
 const source=parsed.kind==="contact"?
  "fbmn_catalog_private.contact_requests":"fbmn_catalog_private.outsourcing_requests";
 try{
  const viewedAt=await withPushDb(async db=>{
   const inserted=await db.query(
    "INSERT INTO fbmn_catalog_private.ceo_request_reads(owner_subject,kind,request_id) "+
    "SELECT $1,$2,id FROM "+source+" WHERE id=$3::uuid "+
    "ON CONFLICT DO NOTHING RETURNING viewed_at",
    [owner.subject,parsed.kind,parsed.id]);
   const found=inserted.rows[0]??(await db.query(
    "SELECT viewed_at FROM fbmn_catalog_private.ceo_request_reads "+
    "WHERE owner_subject=$1 AND kind=$2 AND request_id=$3::uuid",
    [owner.subject,parsed.kind,parsed.id])).rows[0];
   if(!found)return null;
   // Read receipts must survive for the life of the source request.
   // Age-based pruning reclassifies old 'new' requests as unread again.
   return new Date(found.viewed_at).toISOString();
  });
  if(!viewedAt)return fail(404,"not_found");
  return Response.json({data:{viewedAt}},{headers});
 }catch{return fail(503,"read_receipt_unavailable");}
}
