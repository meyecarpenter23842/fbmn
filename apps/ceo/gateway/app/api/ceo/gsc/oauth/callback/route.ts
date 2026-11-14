import {randomBytes} from "node:crypto";
import {oauthConfig,verifyCallback,makeCompletionTicket} from "@/lib/ceo-gsc-oauth.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex","X-Frame-Options":"DENY"};
const LANDING="https://ceo.fbmn.vn/ceo/index.html?tab=4&gsc=";
const clear="fbmn_gsc_oauth=; Path=/api/ceo/gsc/oauth/callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
function finish(reason:string){
 return new Response(null,{status:303,headers:{...noStore,Location:LANDING+reason,"Set-Cookie":clear}});
}
function cookieValue(header:string|null){
 const value=header?.split(";").map(s=>s.trim()).find(s=>s.startsWith("fbmn_gsc_oauth="));
 return value?.slice("fbmn_gsc_oauth=".length)||"";
}
const htmlTemplate="<!doctype html><html lang=\"vi\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex,nofollow\"><title>Futurebook CEO · Xác nhận Google</title><style>\n*{box-sizing:border-box}body{margin:0;min-height:100vh;background:linear-gradient(145deg,#f8f3fe,#fff);font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#271c33;display:grid;place-items:center;padding:18px}\nmain{max-width:480px;width:100%;padding:28px 23px;border:1px solid #e7d9f2;border-radius:18px;box-shadow:0 12px 35px #54217d16;background:#fff;text-align:center}\n.symbol{margin:auto auto 16px;width:58px;height:58px;border-radius:16px;background:#f4edfa;display:grid;place-items:center;color:#6d249e;font-size:27px;font-weight:800}h1{font-size:20px;line-height:1.4;margin:0 0 12px}p{font-size:14px;line-height:1.6;color:#635a6c;margin:0 0 19px}:root{--fb-control-height-compact:36px;--fb-control-height-touch:44px;--fb-control-font-size:13px;--fb-control-radius:9px;--fb-ui-primary:#6d249e}\nbutton{width:100%;min-height:var(--fb-control-height-compact);border-radius:var(--fb-control-radius);border:0;background:var(--fb-ui-primary);color:#fff;font-size:var(--fb-control-font-size);font-weight:700;cursor:pointer;transition:background .19s}button:hover{background:#572080}button:disabled{opacity:.65;cursor:wait}\n@media(max-width:780px){button{min-height:var(--fb-control-height-touch)}}a{color:#6d249e;font-size:13px;display:inline-block;margin-top:18px}#message{font-size:13px;min-height:22px;margin-top:12px;color:#5c476b}\n</style></head><body><main><div class=\"symbol\">F</div><h1>Xác nhận kết nối Google</h1><p>Google đã chuyển quyền đọc Search Console về Futurebook. Anh bấm xác nhận để lưu kết nối vào tài khoản Owner CEO.</p><button type=\"button\" id=\"confirm\">Xác nhận kết nối</button><div id=\"message\" role=\"status\" aria-live=\"polite\"></div><a href=\"/ceo/index.html?tab=4\">Quay lại Thống kê CEO</a></main>\n<script nonce=\"__NONCE__\">\n\"use strict\";\nhistory.replaceState(null,\"\",\"/api/ceo/gsc/oauth/callback\");\nconst ticket=\"__TICKET__\";\nconst button=document.getElementById(\"confirm\"),message=document.getElementById(\"message\");\nconst landing=\"/ceo/index.html?tab=4&gsc=\";\nconst safe=new Set([\"connected\",\"login\",\"invalid\",\"config\",\"token\",\"permission\",\"google_api\",\"storage\"]);\nasync function jwt(){\n const validated=value=>typeof value===\"string\"&&\n  /^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$/.test(value)?value:null;\n async function fetchToken(){\n  const response=await fetch(\"/api/auth/token\",{credentials:\"same-origin\",cache:\"no-store\",headers:{\"Accept\":\"application/json\"}});\n  if(!response.ok)return null;\n  const json=await response.json().catch(()=>({}));\n  return validated(json?.token??json?.data?.token??null);\n }\n let token=await fetchToken();\n if(!token){\n  const response=await fetch(\"/api/auth/get-session\",{credentials:\"same-origin\",cache:\"no-store\",headers:{\"Accept\":\"application/json\"}});\n  if(response.ok){\n   const json=await response.json().catch(()=>({}));\n   const wrapped=json?.data&&typeof json.data===\"object\"?json.data:json;\n   token=validated(wrapped?.session?.access_token??wrapped?.session?.accessToken??null);\n  }\n  if(!token)token=await fetchToken();\n }\n return token;\n}\nbutton.addEventListener(\"click\",async()=>{\n button.disabled=true;\n message.textContent=\"Đang xác thực phiên Owner và kết nối Search Console...\";\n try{\n  const token=await jwt();\n  if(!token){location.replace(landing+\"login\");return;}\n  const response=await fetch(\"/api/ceo/gsc/oauth/complete\",{\n   method:\"POST\",credentials:\"same-origin\",cache:\"no-store\",\n   headers:{\"Accept\":\"application/json\",\"Content-Type\":\"application/json\",\"Authorization\":\"Bearer \"+token},\n   body:JSON.stringify({ticket})\n  });\n  const data=await response.json().catch(()=>({}));\n  const result=typeof data?.status===\"string\"&&safe.has(data.status)?data.status:\"error\";\n  location.replace(landing+(response.ok?result:result===\"connected\"?\"error\":result));\n }catch{\n  message.textContent=\"Không thể hoàn tất kết nối. Anh thử lại hoặc quay về CEO.\";\n  button.disabled=false;\n }\n});\n</script></body></html>";
function confirm(ticket:string){
 const nonce=randomBytes(16).toString("base64");
 const body=htmlTemplate.replace("__NONCE__",nonce).replace("__TICKET__",ticket);
 return new Response(body,{status:200,headers:{
  ...noStore,"Content-Type":"text/html; charset=utf-8","Set-Cookie":clear,
  "Content-Security-Policy":"default-src 'none'; script-src 'nonce-"+nonce+
   "'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
 }});
}
// Google redirects without a browser JWT/cookie. Verify sealed state and show
// an explicit Owner confirmation screen; do NOT save any grant during this GET.
// The POST /complete requires a fresh Owner bearer bound to this OAuth state.
export async function GET(request:Request){
 const url=new URL(request.url);
 if(url.origin!=="https://ceo.fbmn.vn")return finish("invalid");
 if(url.searchParams.get("error"))return finish("cancelled");
 if(url.searchParams.getAll("state").length!==1||
    url.searchParams.getAll("code").length!==1||
    Number(request.headers.get("content-length")||0)>4096)return finish("invalid");
 let config;
 try{config=oauthConfig();}catch{return finish("config");}
 if(config.status!=="ready")return finish("config");
 const verified=verifyCallback(config,{
  code:url.searchParams.get("code"),state:url.searchParams.get("state")
 },cookieValue(request.headers.get("cookie")));
 if(!verified)return finish("invalid");
 try{return confirm(makeCompletionTicket(config,verified));}
 catch{return finish("invalid");}
}
