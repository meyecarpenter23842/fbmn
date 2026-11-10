import {isIP} from "node:net";
import {createIntakeProof} from "@/lib/outsourcing/proxy-proof";
import {CHAT_PATH,CHAT_PROOF_PREFIX,readChatRequest} from "@/lib/chatbot/chat-request";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=40;
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({ok:false,error:{code}},{status,headers:HEADERS});
export async function POST(request:Request){
 const url=new URL(request.url);
 if(url.search)return fail(400,"invalid_query");
 if(request.headers.get("origin")!==url.origin||request.headers.get("sec-fetch-site")==="cross-site")return fail(403,"origin_forbidden");
 const data=await readChatRequest(request);if(!data)return fail(400,"invalid_request");
 const secret=process.env.FBMN_DL6_PROXY_SECRET||"",ip=request.headers.get("x-vercel-forwarded-for")||"";
 if(process.env.VERCEL!=="1"||!isIP(ip)||!/^[0-9a-f]{64}$/.test(secret))return fail(503,"chat_unavailable");
 try{
  const base=new URL(process.env.FBMN_PUBLIC_API_BASE_URL||"");
  if(base.protocol!=="https:"||base.username||base.password||base.search||base.hash||base.pathname!=="/")return fail(503,"chat_unavailable");
  const payload=JSON.stringify(data),proof=await createIntakeProof(secret,ip,CHAT_PROOF_PREFIX+payload);
  const response=await fetch(base.origin+CHAT_PATH,{method:"POST",cache:"no-store",redirect:"error",signal:AbortSignal.timeout(32000),
   headers:{"Content-Type":"application/json",Origin:url.origin,"X-FBMN-DL6-Visitor":proof.visitor,"X-FBMN-DL6-Time":proof.time,"X-FBMN-DL6-Signature":proof.signature},body:payload});
  if(response.status===429)return fail(429,"request_limited");
  if(!response.ok||!response.headers.get("content-type")?.includes("application/json"))return fail(503,"chat_unavailable");
  const result=await response.json() as {ok?:unknown;text?:unknown};
  if(result.ok!==true||typeof result.text!=="string"||!result.text.trim()||result.text.length>3000)return fail(503,"chat_unavailable");
  return Response.json({ok:true,text:result.text},{headers:HEADERS});
 }catch{return fail(503,"chat_unavailable");}
}
