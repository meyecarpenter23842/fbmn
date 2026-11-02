import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export const runtime="nodejs";
// Public bytes only, verified by public Worker using published-media SQL view.
// No private object key, Cloudflare token or Admin session reaches the browser.
const isUuid=(value:string)=>/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
export async function GET(_request:Request,{params}:{params:Promise<{asset:string}>}){
  const {asset}=await params;
  if(!isUuid(asset))return new Response(null,{status:404,headers:{"Cache-Control":"no-store"}});
  let base:URL;
  try{
    base=new URL(process.env.FBMN_PUBLIC_API_BASE_URL||"");
    if(base.protocol!=="https:"||base.pathname!=="/"||base.search||base.hash||
      base.username||base.password||base.hostname==="localhost"||base.hostname.endsWith(".r2.dev"))
      throw Error("invalid_public_api");
  }catch{return new Response(null,{status:503,headers:{"Cache-Control":"no-store"}});}
  try{
    const response=await fetch(base.origin+"/v1/public/image?id="+encodeURIComponent(asset),{
      redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(7000)});
    if(response.status!==200||response.headers.get("content-type")?.split(";")[0]!=="image/webp"||
      !response.body)
      return new Response(null,{status:response.status===404?404:503,
        headers:{"Cache-Control":"no-store"}});
    if(Number(response.headers.get("content-length")||0)>5*1024*1024)
      return new Response(null,{status:503,headers:{"Cache-Control":"no-store"}});
    return new NextResponse(response.body,{status:200,headers:{
      "Content-Type":"image/webp","Cache-Control":"no-store",
      "X-Content-Type-Options":"nosniff","Cross-Origin-Resource-Policy":"same-origin"}});
  }catch{return new Response(null,{status:503,headers:{"Cache-Control":"no-store"}});}
}
