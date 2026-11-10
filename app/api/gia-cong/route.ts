import {isIP} from "node:net";
import {createIntakeProof} from "@/lib/outsourcing/proxy-proof";
import {validateOutsourcingRequest} from "@/lib/outsourcing/validation";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({ok:false,error:{code}},{status,headers:HEADERS});
function publicApiOrigin(){
 try{const u=new URL(process.env.FBMN_PUBLIC_API_BASE_URL||"");
  return u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/"?u.origin:null;
 }catch{return null;}
}
async function boundedJson(request:Request){
 if(Number(request.headers.get("content-length")||0)>8192||!request.body)return null;
 const reader=request.body.getReader(),decoder=new TextDecoder("utf-8",{fatal:true});
 let raw="",bytes=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;
  bytes+=value.byteLength;if(bytes>8192){await reader.cancel();return null;}
  raw+=decoder.decode(value,{stream:true});}
  raw+=decoder.decode();return JSON.parse(raw) as unknown;
 }catch{return null;}finally{reader.releaseLock();}
}
export async function POST(request:Request){
 if(process.env.FBMN_DL6_ENABLED!=="true")return fail(503,"intake_unavailable");
 const url=new URL(request.url);
 if(url.search)return fail(400,"invalid_query");
 if(request.headers.get("origin")!==url.origin||request.headers.get("sec-fetch-site")==="cross-site")
  return fail(403,"origin_forbidden");
 if(request.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json")
  return fail(415,"invalid_content_type");
 const body=await boundedJson(request),checked=validateOutsourcingRequest(body);
 if(!checked.ok)return fail(400,checked.error);
 const base=publicApiOrigin();if(!base)return fail(503,"intake_unavailable");
 const secret=process.env.FBMN_DL6_PROXY_SECRET||"";
 const visitorIp=request.headers.get("x-vercel-forwarded-for")||"";
 // Vercel overwrites its own canonical visitor header at ingress; never trust user XFF.
 if(process.env.VERCEL!=="1"||!isIP(visitorIp)||!/^[0-9a-f]{64}$/.test(secret))
  return fail(503,"intake_unavailable");
 try{
  const payload=JSON.stringify(checked.data);
  const proof=await createIntakeProof(secret,visitorIp,payload);
  const response=await fetch(base+"/v1/public/outsourcing-requests",{method:"POST",cache:"no-store",
   redirect:"manual",signal:AbortSignal.timeout(10000),
   headers:{"Content-Type":"application/json","Origin":url.origin,
    "X-FBMN-DL6-Visitor":proof.visitor,"X-FBMN-DL6-Time":proof.time,
    "X-FBMN-DL6-Signature":proof.signature},
   body:payload});
  if(response.status===201&&response.headers.get("content-type")?.includes("application/json")){
    const result=await response.json().catch(()=>null) as {ok?:unknown}|null;
    if(result?.ok===true)return Response.json({ok:true},{status:201,headers:HEADERS});
  }
  if(response.status===429)return fail(429,"request_limited");
  return fail(503,"intake_unavailable");
 }catch{return fail(503,"intake_unavailable");}
}
