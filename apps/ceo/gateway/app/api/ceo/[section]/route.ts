import {requireOwner,workerOrigin} from "@/lib/owner-gate";
import {ceoReadTarget} from "@/lib/ceo-api-guard.mjs";
import {withPushDb} from "@/lib/ceo-push-db";
import {readRequestIds,attachReadReceipts} from "@/lib/ceo-read-policy.mjs";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","Content-Type":"application/json; charset=utf-8",
 "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
export async function GET(request:Request,context:{params:Promise<{section:string}>}){
 const {section}=await context.params;
 const url=new URL(request.url);
 const target=ceoReadTarget(section,url.search);
 if(!target)return fail(400,"invalid_query");
 const gate=await requireOwner(request);
 if(gate.status!==200||!gate.token)return fail(gate.status,"owner_required");
 const origin=workerOrigin();
 if(!origin)return fail(503,"service_unavailable");
 try{
  const response=await fetch(origin+target,{method:"GET",cache:"no-store",redirect:"manual",
    signal:AbortSignal.timeout(10000),headers:{Authorization:"Bearer "+gate.token,Accept:"application/json"}});
  if(![200,400,401,403,404,429,503].includes(response.status)||
    !response.headers.get("content-type")?.includes("application/json"))
   return fail(503,"service_unavailable");
  const raw=await response.text();
  if(raw.length>500000)return fail(503,"service_unavailable");
  if(response.status===200&&(section==="contact-requests"||section==="outsourcing-requests")){
   if(!gate.subject)return fail(401,"owner_required");
   let payload:unknown;
   try{payload=JSON.parse(raw);}catch{return fail(503,"service_unavailable");}
   const ids=readRequestIds(payload);
   if(ids===null)return fail(503,"service_unavailable");
   try{
    const kind=section==="contact-requests"?"contact":"outsourcing";
    const rows=ids.length===0?[]:(await withPushDb(db=>db.query(
     "SELECT request_id::text AS id,viewed_at FROM fbmn_catalog_private.ceo_request_reads "+
     "WHERE owner_subject=$1 AND kind=$2 AND request_id=ANY($3::uuid[])",
     [gate.subject,kind,ids]))).rows;
    return Response.json(attachReadReceipts(payload,rows),{status:200,headers});
   }catch{return fail(503,"read_receipt_unavailable");}
  }
  return new Response(raw,{status:response.status,headers});
 }catch{return fail(503,"service_unavailable");}
}
// POST/DELETE are intentionally not implemented by the CEO read-only gateway.
