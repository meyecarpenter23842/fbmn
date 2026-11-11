// DL12C. No arbitrary endpoints, external redirects, customer PII or staff access.
export const pushKinds=Object.freeze(["chat","contact","outsourcing"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const chat=/^[a-f0-9]{36}$/;
const base64url=/^[A-Za-z0-9_-]+$/;
export function validRef(kind,ref){
 return pushKinds.includes(kind)&&typeof ref==="string"&&
  (kind==="chat"?chat.test(ref):uuid.test(ref));
}
export function pushRoute(kind,ref){
 return validRef(kind,ref)?"/ceo/index.html?tab="+encodeURIComponent(kind)+
  "&id="+encodeURIComponent(ref):"/ceo/index.html";
}
export function pushEndpoint(endpoint){
 if(typeof endpoint!=="string"||endpoint.length>2048)return false;
 try{
  const url=new URL(endpoint);
  if(url.protocol!=="https:"||url.username||url.password||url.hash||url.port)return false;
  const host=url.hostname.toLowerCase();
  // Browser push services only; do not turn Owner registration into SSRF.
  return host==="fcm.googleapis.com"||host==="updates.push.services.mozilla.com"||
   host==="web.push.apple.com"||host==="api.push.apple.com"||
   host.endsWith(".notify.windows.com")||host.endsWith(".push.services.mozilla.com");
 }catch{return false;}
}
export function parseSubscription(body){
 if(!body||typeof body!=="object"||Array.isArray(body)||
  !["endpoint","keys"].every(k=>Object.hasOwn(body,k))||
  Object.keys(body).some(k=>!["endpoint","keys","expirationTime"].includes(k))||
  !pushEndpoint(body.endpoint)||
  !body.keys||typeof body.keys!=="object"||Array.isArray(body.keys)||
  Object.keys(body.keys).some(k=>!["p256dh","auth"].includes(k)))return null;
 const {p256dh,auth}=body.keys;
 if(typeof p256dh!=="string"||p256dh.length<80||p256dh.length>128||
  !base64url.test(p256dh)||typeof auth!=="string"||auth.length<16||
  auth.length>48||!base64url.test(auth))return null;
 return {endpoint:body.endpoint,p256dh,auth};
}
// Retry only targets which have not already accepted this event.
export function pendingTargets(subscriptions,sentEndpoints,occurredAt){
 const sent=new Set(sentEndpoints);
 const timestamp=new Date(occurredAt).getTime();
 return subscriptions.filter(sub=>!sent.has(sub.endpoint)&&
  new Date(sub.created_at).getTime()<=timestamp);
}
export function pushPayload(kind,ref,badge){
 if(!validRef(kind,ref))throw Error("invalid_push_target");
 return JSON.stringify({type:kind,id:ref,badge:Number.isSafeInteger(badge)?
  Math.min(Math.max(badge,0),99):0});
}
export function allowedOrigin(request){
 const origin=request.headers.get("origin");
 if(!origin)return false;
 try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}
}
