import {withPushDb} from "@/lib/ceo-push-db";
import {indexReceived} from "@/lib/ceo-mail-index";
import {requireOwner} from "@/lib/owner-gate";
import {parseMailDetail,plainTextFromHtml} from "@/lib/ceo-mail-policy.mjs";
import {mailVisible,resendRequest,recipientForReply} from "@/lib/ceo-mail-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(s:number,c:string)=>Response.json({error:{code:c}},{status:s,headers});
export async function GET(request:Request,ctx:{params:Promise<{id:string}>}){
 const {id}=await ctx.params;
 const q=new URL(request.url).searchParams;
 if([...q.keys()].some(k=>k!=="box")||q.getAll("box").length!==1)return fail(400,"invalid_query");
 const query=parseMailDetail(q.get("box")||"",id);
 if(!query)return fail(400,"invalid_query");
 const gate=await requireOwner(request);
 if(gate.status!==200||!gate.subject)return fail(gate.status,"owner_required");
 const path=query.box==="inbox"?"/emails/receiving/":"/emails/";
 const response=await resendRequest(path+query.id+(query.box==="inbox"?"?html_format=cid":""));
 if(response.status!==200||!response.payload)return fail(response.status,"mail_service_unavailable");
 if(!mailVisible(response.payload,query.box))return fail(404,"not_found");
 const item=response.payload;
 if(query.box==="inbox"){
  // Deep-linked emails must be indexable even when the list was never opened.
  await withPushDb(db=>indexReceived(db,[item])).catch(()=>{});
 }
 return Response.json({data:{id:item.id,from:item.from,to:item.to,subject:item.subject,
  text:typeof item.text==="string"&&item.text.trim()?item.text:plainTextFromHtml(item.html),
  replyTo:query.box==="inbox"?recipientForReply(item):null,
  created_at:item.created_at,status:item.last_event||item.status||"",
  message_id:item.message_id||"",attachments:item.attachments||[]}},{headers});
}
