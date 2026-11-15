import {requireOwner} from "@/lib/owner-gate";
import {allowedOrigin} from "@/lib/ceo-push-policy.mjs";
import {validateDraft} from "@/lib/ceo-ads-policy.mjs";
import {adsOAuthConfig} from "@/lib/ceo-ads-oauth.mjs";
import {readCompanyAdsConnection,adsDrafts,saveAdsDraft,
 removeAdsDraft,updateAdsDraft,auditAds} from "@/lib/ceo-ads-store";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",
 "X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
async function draftOwner(gate:{role?:string;subject?:string}):Promise<string>{
 if(gate.role==="owner")return gate.subject!;
 const config=adsOAuthConfig();
 if(config.status!=="ready")throw new Error("ads_not_configured");
 const row=await readCompanyAdsConnection(config.key);
 if(!row)throw new Error("ads_disconnected");
 return row.subject;
}
export async function GET(request:Request){
 const gate=await requireOwner(request);
 if(gate.status!==200||!gate.subject)return fail(gate.status,"unauthorized");
 try{
  const subject=await draftOwner(gate);
  return Response.json({data:{drafts:await adsDrafts(subject)}},{headers});
 }catch{return fail(503,"ads_storage_unavailable");}
}
export async function POST(request:Request){
 if(!allowedOrigin(request))return fail(403,"forbidden_origin");
 const gate=await requireOwner(request);
 if(gate.status!==200||!gate.subject)return fail(gate.status,"unauthorized");
 if(Number(request.headers.get("content-length")||0)>12000)return fail(413,"payload_too_large");
 let b:unknown;try{b=await request.json();}catch{return fail(400,"invalid_body");}
 const draft=validateDraft(b);
 if(!draft)return fail(400,"invalid_draft");
 try{
  const subject=await draftOwner(gate);
  const id=await saveAdsDraft(subject,gate.subject,draft);
  await auditAds(subject,gate.subject,"draft.create",null,{kind:draft.kind,id},"success");
  return Response.json({data:{id,kind:draft.kind,status:"draft"}},{status:201,headers});
 }catch{return fail(503,"ads_storage_unavailable");}
}
export async function DELETE(request:Request){
 if(!allowedOrigin(request))return fail(403,"forbidden_origin");
 const gate=await requireOwner(request);
 if(gate.status!==200||!gate.subject)return fail(gate.status,"unauthorized");
 const id=new URL(request.url).searchParams.get("id");
 if(!id||!/^[0-9a-fA-F-]{36}$/.test(id))return fail(400,"invalid_draft_id");
 try{
  const subject=await draftOwner(gate);
  const ok=await removeAdsDraft(subject,id);
  if(ok)await auditAds(subject,gate.subject,"draft.delete",null,{id},"success");
  return Response.json({data:{deleted:ok}},{headers});
 }catch{return fail(503,"ads_storage_unavailable");}
}

export async function PATCH(request:Request){
 if(!allowedOrigin(request))return fail(403,"forbidden_origin");
 const gate=await requireOwner(request);
 if(gate.status!==200||!gate.subject)return fail(gate.status,"unauthorized");
 if(Number(request.headers.get("content-length")||0)>12000)return fail(413,"payload_too_large");
 const id=new URL(request.url).searchParams.get("id");
 if(!id||!/^[0-9a-fA-F-]{36}$/.test(id))return fail(400,"invalid_draft_id");
 let data:unknown;try{data=await request.json();}catch{return fail(400,"invalid_body");}
 if(!data||typeof data!=="object"||Array.isArray(data))return fail(400,"invalid_body");
 const body=data as {revision?:unknown;draft?:unknown};
 if(!Number.isInteger(body.revision)||Number(body.revision)<1||
  Number(body.revision)>100000)return fail(400,"invalid_revision");
 const draft=validateDraft(body.draft);
 if(!draft)return fail(400,"invalid_draft");
 try{
  const subject=await draftOwner(gate);
  const ok=await updateAdsDraft(subject,id,Number(body.revision),draft);
  if(!ok)return fail(409,"draft_changed_or_missing");
  await auditAds(subject,gate.subject,"draft.update",null,{kind:draft.kind,id},"success");
  return Response.json({data:{updated:true}},{headers});
 }catch{return fail(503,"ads_storage_unavailable");}
}
