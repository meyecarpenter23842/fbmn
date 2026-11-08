export const dynamic="force-dynamic";
export const runtime="nodejs";
const MAX=5*1024*1024;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
 "Cross-Origin-Resource-Policy":"same-origin"};
const fail=(status:number)=>new Response(null,{status,headers});
export async function GET(request:Request){
 if(process.env.FBMN_CMS_PUBLIC_ENABLED!=="true"||
    process.env.FBMN_PUBLIC_API_ENABLED!=="true")return fail(404);
 const url=new URL(request.url);
 if(url.searchParams.size!==2||url.searchParams.getAll("id").length!==1||
    url.searchParams.getAll("device").length!==1)return fail(400);
 const id=url.searchParams.get("id")||"",device=url.searchParams.get("device")||"";
 if(!UUID.test(id)||!["desktop","mobile"].includes(device))return fail(400);
 let origin;
 try{
  const base=new URL(process.env.FBMN_PUBLIC_API_BASE_URL??"");
  if(base.protocol!=="https:"||base.username||base.password||base.search||base.hash||
     base.port||base.pathname!=="/"||!base.hostname||
     /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/i.test(base.hostname)||
     base.hostname.endsWith(".r2.dev")||base.hostname.endsWith(".internal")||
     base.hostname.endsWith(".invalid"))throw Error();
  origin=base.origin;
 }catch{return fail(503);}
 try{
  const response=await fetch(origin+"/v1/public/cms/image?id="+encodeURIComponent(id)+
   "&device="+device,{method:"GET",redirect:"manual",cache:"no-store",
   signal:AbortSignal.timeout(7000)});
  if(response.status!==200||response.headers.get("content-type")?.split(";")[0]!=="image/webp"||
     !response.body)return fail(response.status===404?404:503);
  const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
  try{
   while(true){
    const {done,value}=await reader.read();if(done)break;
    size+=value.byteLength;
    if(size>MAX){await reader.cancel();return fail(503);}
    chunks.push(value);
   }
  }finally{reader.releaseLock();}
  if(size<100)return fail(404);
  const out=new Uint8Array(size);let off=0;
  for(const chunk of chunks){out.set(chunk,off);off+=chunk.length;}
  return new Response(out,{status:200,headers:{...headers,"Content-Type":"image/webp"}});
 }catch{return fail(503);}
}
