import {requireOwner} from "@/lib/owner-gate";
import {withPushDb} from "@/lib/ceo-push-db";
import {allowedOrigin,parseSubscription,pushEndpoint} from "@/lib/ceo-push-policy.mjs";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
async function authenticate(request:Request):Promise<{status:number;subject?:string}>{
 if(!allowedOrigin(request))return {status:403}; // same-origin mutation
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return {status:415};
 return await requireOwner(request);
}
async function json(request:Request){
 if(Number(request.headers.get("content-length")||0)>4096)return null;
 const text=await request.text();
 if(text.length>4096)return null;
 try{return JSON.parse(text) as unknown;}catch{return null;}
}
export async function POST(request:Request){
 const owner=await authenticate(request);
 if(owner.status!==200||!owner.subject)return fail(owner.status,"owner_required");
 const sub=parseSubscription(await json(request));
 if(!sub)return fail(400,"invalid_subscription");
 try{
  await withPushDb(async db=>{
   // A device may re-register; never expose endpoint to another request.
   await db.query("INSERT INTO fbmn_catalog_private.ceo_push_subscriptions"+
    "(endpoint,owner_subject,p256dh,auth) VALUES($1,$2,$3,$4)"+
    " ON CONFLICT(endpoint) DO UPDATE SET owner_subject=excluded.owner_subject,"+
    " p256dh=excluded.p256dh,auth=excluded.auth,last_seen_at=now()",
    [sub.endpoint,owner.subject,sub.p256dh,sub.auth]);
  });
  return Response.json({data:{subscribed:true}},{headers});
 }catch{return fail(503,"push_unavailable");}
}
export async function DELETE(request:Request){
 const owner=await authenticate(request);
 if(owner.status!==200||!owner.subject)return fail(owner.status,"owner_required");
 const body=await json(request);
 const endpoint=body&&typeof body==="object"&&"endpoint" in body?body.endpoint:null;
 if(!pushEndpoint(endpoint))return fail(400,"invalid_subscription");
 try{
  await withPushDb(async db=>{
   await db.query("DELETE FROM fbmn_catalog_private.ceo_push_subscriptions WHERE endpoint=$1 AND owner_subject=$2",
    [endpoint,owner.subject]);
  });
  return Response.json({data:{subscribed:false}},{headers});
 }catch{return fail(503,"push_unavailable");}
}
