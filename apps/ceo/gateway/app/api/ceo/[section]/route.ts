import {requireOwner,workerOrigin} from "@/lib/owner-gate";
import {ceoReadTarget} from "@/lib/ceo-api-guard.mjs";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","Content-Type":"application/json; charset=utf-8",
 "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
export async function GET(request:Request,context:{params:Promise<{section:string}>}){
 const {section}=await context.params;
 const url=new URL(request.url);
 const target=ceoReadTarget(section,url.search);
 if(!target)return fail(400,"invalid_query");
 const gate=await requireOwner();
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
  return new Response(raw,{status:response.status,headers});
 }catch{return fail(503,"service_unavailable");}
}
// POST/DELETE are intentionally not implemented by the CEO read-only gateway.
