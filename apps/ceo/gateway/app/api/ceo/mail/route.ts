import {requireOwner} from "@/lib/owner-gate";
import {allowedOrigin} from "@/lib/ceo-push-policy.mjs";
import {parseMailboxQuery,parseMailSend,mailSignatureHtml,mailSignatureText,MAIL_FROM,MAIL_MAX_REQUEST_BYTES,MAIL_MAX_ATTACHMENT_REQUEST_BYTES,readBoundedMailBody} from "@/lib/ceo-mail-policy.mjs";
import {resendRequest,mailVisible,recipientForReply} from "@/lib/ceo-mail-service";
import {randomUUID} from "node:crypto";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
export async function GET(request:Request){
 const params=parseMailboxQuery(new URL(request.url).search);
 if(!params)return fail(400,"invalid_query");
 const gate=await requireOwner(request);
 if(gate.status!==200||!gate.subject)return fail(gate.status,"owner_required");
 const q=new URLSearchParams({limit:String(params.limit)});
 if(params.after)q.set("after",params.after);
 const path=params.box==="inbox"?"/emails/receiving":"/emails";
 const upstream=await resendRequest(path+"?"+q);
 if(upstream.status!==200||!upstream.payload)return fail(upstream.status,"mail_service_unavailable");
 const list=upstream.payload.data;
 if(!Array.isArray(list))return fail(503,"mail_service_unavailable");
 const items=list.filter(item=>mailVisible(item,params.box)).map(item=>{
  const value=item as Record<string,unknown>;
  return {id:value.id,from:value.from,to:value.to,subject:value.subject,
   created_at:value.created_at,status:value.last_event||value.status||"",
   message_id:value.message_id||"",attachment_count:Array.isArray(value.attachments)?value.attachments.length:0};
 });
 return Response.json({data:{items,hasMore:upstream.payload.has_more===true,
  nextCursor:list.length?String((list.at(-1) as {id?:unknown}).id||""):null}},{headers});
}
export async function POST(request:Request){
 if(!allowedOrigin(request))return fail(403,"origin_forbidden");
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return fail(415,"invalid_content_type");
 const lengthHeader=request.headers.get("content-length");
 if(lengthHeader!==null&&(!/^\d+$/.test(lengthHeader)||Number(lengthHeader)>MAIL_MAX_ATTACHMENT_REQUEST_BYTES))
  return fail(413,"body_too_large");
 const gate=await requireOwner(request);
 if(gate.status!==200||!gate.subject)return fail(gate.status,"owner_required");
 const raw=await readBoundedMailBody(request,MAIL_MAX_ATTACHMENT_REQUEST_BYTES);
 if(!raw)return fail(400,"invalid_body");
 if("tooLarge" in raw)return fail(413,"body_too_large");
 let body:unknown;try{body=JSON.parse(raw.text);}catch{return fail(400,"invalid_body");}
 if((body===null||typeof body!=="object"||!Array.isArray((body as {attachments?:unknown}).attachments))&&
   Buffer.byteLength(raw.text,"utf8")>MAIL_MAX_REQUEST_BYTES)return fail(413,"body_too_large");
 const parsed=parseMailSend(body);
 if(!parsed)return fail(400,"invalid_body");
 let to=parsed.to,subject=parsed.subject,replyHeaders:Record<string,string>|undefined;
 if(parsed.replyId){
  const parent=await resendRequest("/emails/receiving/"+parsed.replyId+"?html_format=cid");
  if(parent.status!==200||!parent.payload||!mailVisible(parent.payload,"inbox"))
   return fail(parent.status===200?404:parent.status,"reply_not_found");
  to=recipientForReply(parent.payload);
  if(!to||to===MAIL_FROM)return fail(400,"invalid_recipient");
  const originalSubject=String(parent.payload.subject||"").trim().slice(0,150);
  subject=/^re:/i.test(originalSubject)?originalSubject:"Re: "+originalSubject;
  const messageId=parent.payload.message_id;
  if(typeof messageId==="string"&&/^<[^<>\r\n]{1,230}>$/.test(messageId))
   replyHeaders={"In-Reply-To":messageId,References:messageId};
 }
 if(!to)return fail(400,"invalid_recipient");
 const sent=await resendRequest("/emails",{method:"POST",requestId:parsed.requestId||randomUUID(),
  body:{from:"Futurebook Miền Nam <"+MAIL_FROM+">",to:[to],reply_to:MAIL_FROM,subject,
   html:mailSignatureHtml(parsed.text),text:mailSignatureText(parsed.text),
   ...(parsed.attachments.length?{attachments:parsed.attachments}:{}),
   ...(replyHeaders?{headers:replyHeaders}:{})}});
 if(sent.status!==200||typeof sent.payload?.id!=="string")return fail(sent.status,"mail_send_failed");
 return Response.json({data:{id:sent.payload.id,status:"queued"}},{status:201,headers});
}
