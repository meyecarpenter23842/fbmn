import {parseWebAnalytics} from "@/lib/analytics/web-events";
import {captureWebAnalytics,webAnalyticsEnabled} from "@/lib/analytics/posthog-server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const done=(status:number)=>new Response(null,{status,headers:HEADERS});
export async function POST(request:Request){
 const url=new URL(request.url);
 if(request.headers.get("origin")!==url.origin||
    request.headers.get("sec-fetch-site")==="cross-site")return done(403);
 if(url.search||request.headers.get("content-type")?.split(";")[0]!=="application/json")return done(415);
 if(Number(request.headers.get("content-length")||0)>1024)return done(413);
 let text:string;
 try{text=await request.text();}catch{return done(400);}
 if(text.length>1024)return done(413);
 let value:unknown;
 try{value=JSON.parse(text);}catch{return done(400);}
 const record=parseWebAnalytics(value);
 if(!record)return done(400);
 if(!webAnalyticsEnabled())return done(204);
 const success=await captureWebAnalytics(record);
 return done(success?204:503);
}
