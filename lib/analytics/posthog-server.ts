import {websiteCapturePayload,pdfServedPayload,type WebAnalyticsRecord} from "./web-events";

function config(){
 if(process.env.FBMN_WEB_POSTHOG_ENABLED!=="1")return null;
 const key=process.env.FBMN_WEB_POSTHOG_KEY||"";
 const host=process.env.FBMN_WEB_POSTHOG_HOST||"";
 if(!/^[A-Za-z0-9_-]{12,180}$/.test(key))return null;
 if(!["https://us.i.posthog.com","https://eu.i.posthog.com"].includes(host))return null;
 return {key,host};
}
async function forward(payload:object):Promise<boolean>{
 const c=config();
 if(!c)return false;
 try{
  const response=await fetch(c.host+"/capture/",{method:"POST",cache:"no-store",redirect:"manual",
   headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),
   signal:AbortSignal.timeout(3000)});
  return response.ok;
 }catch{return false;}
}
export const webAnalyticsEnabled=()=>Boolean(config());
export async function captureWebAnalytics(record:WebAnalyticsRecord){
 const c=config();return c?forward(websiteCapturePayload(c.key,record)):false;
}
/** Called only AFTER the catalogue PDF proxy has validated a 200 PDF response. */
export async function capturePdfServed(event:"web_pdf_view_served"|"web_pdf_download_served",book_id:string){
 const c=config();return c?forward(pdfServedPayload(c.key,event,book_id,crypto.randomUUID())):false;
}
