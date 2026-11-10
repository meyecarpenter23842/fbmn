// DL7A: same-origin streaming PDF relay. The Public Worker rechecks ready/visible/download rights.
import {catalogueWorkerOrigin} from "@/lib/catalogue/worker-origin";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const MAX=20*1024*1024;
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
 "Cross-Origin-Resource-Policy":"same-origin"};
const fail=(s:number)=>new Response(null,{status:s,headers:HEADERS});
export async function GET(request:Request){
 const u=new URL(request.url),keys=[...u.searchParams.keys()];
 const book=u.searchParams.get("book")||"",download=u.searchParams.get("download")==="1";
 if(keys.length<1||keys.length>2||new Set(keys).size!==keys.length||
    keys.some(x=>!["book","download"].includes(x))||u.searchParams.getAll("book").length!==1||
    !UUID.test(book)||(u.searchParams.has("download")&&u.searchParams.get("download")!=="1"))
  return fail(400);
 const base=catalogueWorkerOrigin();
 if(!base)return fail(503);
 try{
  const remote=await fetch(base+"/v1/public/catalogue-pdf?book="+encodeURIComponent(book)+
   (download?"&download=1":""),{method:"GET",redirect:"manual",cache:"no-store",
    signal:AbortSignal.timeout(20000)});
  const length=remote.headers.get("content-length");
  if(remote.status!==200||remote.headers.get("content-type")?.split(";")[0]!=="application/pdf"||
     !remote.body||!length||!(/^\d+$/).test(length)||
     Number(length)<100||Number(length)>MAX){
   await remote.body?.cancel();
   return fail(remote.status===404?404:503);
  }
  return new Response(remote.body,{status:200,headers:{...HEADERS,
   "Content-Type":"application/pdf","Content-Length":length,
   "Content-Disposition":(download?"attachment":"inline")+
     '; filename="futurebook-catalogue-'+book+'.pdf"'}});
 }catch{return fail(503);}
}
