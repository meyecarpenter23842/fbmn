import {validateOutsourcingRequest} from "../../lib/outsourcing/validation.ts";

const HEADERS={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",
 "X-Content-Type-Options":"nosniff","Vary":"Origin"};
const fail=(status,code)=>Response.json({ok:false,error:{code}},{status,headers:HEADERS});
async function limitedJson(request){
 if(request.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json")return null;
 if(Number(request.headers.get("content-length")||0)>8192||!request.body)return null;
 const reader=request.body.getReader(),decoder=new TextDecoder("utf-8",{fatal:true});
 let size=0,raw="";
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
   if(size>8192){await reader.cancel();return null;}raw+=decoder.decode(value,{stream:true});}
   raw+=decoder.decode();return JSON.parse(raw);
 }catch{return null;}finally{reader.releaseLock();}
}
export async function handleOutsourcingRequest({request,enabled,allowedOrigins,submit,verifyProxy,limitVisitor}){
 const url=new URL(request.url);
 if(url.pathname!=="/v1/public/outsourcing-requests")return fail(404,"not_found");
 if(!enabled||typeof submit!=="function"||typeof verifyProxy!=="function"||
    typeof limitVisitor!=="function")return fail(503,"intake_unavailable");
 const origin=request.headers.get("Origin");
 if(!origin||!allowedOrigins.includes(origin))return fail(403,"origin_forbidden");
 if(url.search)return fail(400,"invalid_query");
 if(request.method!=="POST")return fail(405,"method_not_allowed");
 const body=await limitedJson(request),validated=validateOutsourcingRequest(body);
 if(!validated.ok)return fail(400,validated.error);
 try{
  const visitor=await verifyProxy(request,JSON.stringify(validated.data));
  if(!visitor)return fail(403,"untrusted_proxy");
  const limit=await limitVisitor(visitor);
  if(limit?.success!==true)return fail(429,"request_limited");
  await submit(validated.data);
  return Response.json({ok:true},{status:201,headers:HEADERS});
 }catch(error){
  if(error?.code==="P0001")return fail(429,"request_limited");
  return fail(503,"intake_unavailable");
 }
}
