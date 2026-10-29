import { validateContactInput } from "@/lib/contact/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reject = (status:number,error:string) => Response.json({ok:false,error},{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:Request):Promise<Response> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json") return reject(415,"Chỉ nhận JSON.");
  const origin = request.headers.get("origin");
  if (!origin || origin!==new URL(request.url).origin) return reject(403,"Nguồn không hợp lệ.");
  if (Number(request.headers.get("content-length")||0)>8192) return reject(413,"Nội dung quá lớn.");
  if (!request.body) return reject(400,"Thiếu nội dung.");
  const reader=request.body.getReader(), decoder=new TextDecoder("utf-8",{fatal:true});
  let total=0, raw="";
  try {
    for (;;) {
      const {done,value}=await reader.read(); if(done)break;
      total+=value.byteLength;
      if(total>8192){await reader.cancel();return reject(413,"Nội dung quá lớn.");}
      raw+=decoder.decode(value,{stream:true});
    }
    raw+=decoder.decode();
  } catch { return reject(400,"Nội dung không hợp lệ."); }
  finally {reader.releaseLock();}
  let value:unknown;
  try { value=JSON.parse(raw); } catch { return reject(400,"JSON không hợp lệ."); }
  const checked=validateContactInput(value);
  if(!checked.ok) return reject(400,checked.error);
  // Fail closed until durable storage, anti-spam, rate limiting, consent and retention controls
  // are implemented, reviewed and verified in a separate staging release.
  return reject(503,"Kênh tiếp nhận liên hệ chưa hoạt động.");
}
