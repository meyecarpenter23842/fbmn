/* DL12C Owner-only Push; tokens exist only transiently in closure, never in storage. */
(()=>{
 "use strict";
 const SW="/ceo/push-sw.js",SCOPE="/ceo/";
 function supported(){
  if(!window.isSecureContext||!("serviceWorker" in navigator)||
    !("PushManager" in window)||!("Notification" in window))return "unsupported";
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||
   (navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  const installed=window.navigator.standalone===true||
   window.matchMedia("(display-mode: standalone)").matches;
  if(ios&&!installed)return "ios_install";
  return "ok";
 }
 function decodeKey(base64){
  const b64=base64.replace(/-/g,"+").replace(/_/g,"/");
  const padded=b64+"=".repeat((4-b64.length%4)%4);
  const binary=atob(padded);
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
 }
 async function ownerToken(){
  const response=await fetch("/api/auth/token",{method:"GET",credentials:"same-origin",
   cache:"no-store",redirect:"error",headers:{Accept:"application/json"}});
  if(!response.ok)throw Error(response.status===401?"login_required":"service_error");
  const json=await response.json();
  const jwt=json.token||(json.data&&json.data.token);
  if(typeof jwt!=="string"||jwt.length>12000||
   !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt))
   throw Error("login_required");
  return jwt;
 }
 async function ceoApi(path,method,body){
  const jwt=await ownerToken();
  const r=await fetch("/api/ceo/push/"+path,{method,credentials:"same-origin",
   cache:"no-store",redirect:"error",headers:{
    Accept:"application/json",Authorization:"Bearer "+jwt,
    ...(body?{"Content-Type":"application/json"}:{})
   },...(body?{body:JSON.stringify(body)}:{})});
  if(!r.ok)throw Error(r.status===401?"login_required":r.status===403?
   "forbidden":"service_error");
  return r.json();
 }
 window.fbmnPushStatus=async()=>{
  const support=supported();
  if(support!=="ok")return support;
  if(Notification.permission==="denied")return "denied";
  try{
   const reg=await navigator.serviceWorker.getRegistration(SCOPE);
   if(reg){
    const sub=await reg.pushManager.getSubscription();
    if(sub){
     // Update last_seen_at for an actively used Owner PWA, and keep an
     // expired or revoked server registration from appearing active.
     try{await ceoApi("subscription","POST",sub.toJSON());}
     catch(error){return error?.message==="login_required"?"login_required":"service_error";}
     return "enabled";
    }
   }
  }catch{return "service_error";}
  return "disabled";
 };
 window.fbmnPushEnable=async()=>{
  const support=supported();
  if(support!=="ok")return support;
  if(Notification.permission==="denied")return "denied";
  // Must be called directly by a user gesture; do not await a JWT first.
  let permission;
  try{permission=await Notification.requestPermission();}catch{return "denied";}
  if(permission!=="granted")return "denied";
  let sub;
  try{
   const cfg=await ceoApi("config","GET");
   const key=cfg?.data?.vapidPublicKey;
   if(typeof key!=="string")return "service_error";
   const reg=await navigator.serviceWorker.register(SW,{scope:SCOPE,updateViaCache:"none"});
   await navigator.serviceWorker.ready;
   sub=await reg.pushManager.getSubscription();
   if(!sub)sub=await reg.pushManager.subscribe({
    userVisibleOnly:true,applicationServerKey:decodeKey(key)});
   await ceoApi("subscription","POST",sub.toJSON());
   return "enabled";
  }catch(error){
   if(sub)try{await sub.unsubscribe();}catch{}
   return error?.message==="login_required"?"login_required":error?.message==="forbidden"?
    "forbidden":"service_error";
  }
 };
 window.fbmnPushDisable=async()=>{
  try{
   const reg=await navigator.serviceWorker.getRegistration(SCOPE);
   const sub=reg&&await reg.pushManager.getSubscription();
   if(sub){
    let serverError=false;
    try{await ceoApi("subscription","DELETE",{endpoint:sub.endpoint});}
    catch{serverError=true;}
    // Revoke local subscription even if server is unreachable; its next send returns 410.
    await sub.unsubscribe();
    if(serverError)return "service_error";
   }
   return "disabled";
  }catch(error){return error?.message==="login_required"?"login_required":"service_error";}
 };
})();
