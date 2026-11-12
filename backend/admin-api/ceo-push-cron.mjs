// DL12C — Cloudflare scheduled trigger (not an unauthenticated HTTP route).
const URL="https://ceo.fbmn.vn/api/ceo/push/dispatch";
export async function deliverScheduledPush(env,send=fetch){
 const secret=env?.FBMN_CEO_PUSH_DISPATCH_SECRET;
 if(typeof secret!=="string"||secret.length<32)return false;
 const response=await send(URL,{
  method:"GET",redirect:"manual",cache:"no-store",
  headers:{Authorization:"Bearer "+secret},
  signal:AbortSignal.timeout(20000)
 });
 if(response.status!==200||!response.ok)throw Error("CEO push dispatcher unavailable");
 return true;
}
