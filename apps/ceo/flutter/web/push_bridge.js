/* DL12C/CEO-MAIL03: Owner-only Push. Persist consent, never credentials.
   A device opt-in survives PWA restarts; explicit Off revokes it. */
(()=>{
 "use strict";
 const SW="/ceo/push-sw.js",SCOPE="/ceo/",PREFERENCE="fbmn-ceo-push-opt-in-v1";
 // Invalidate an in-flight resubscribe before Off or logout can revoke delivery.
 let pushGeneration=0;
 async function cleanupCancelled(sub){
  if(!sub)return;
  // A POST may have overtaken DELETE: remove both server and browser state.
  try{await ceoApi("subscription","DELETE",{endpoint:sub.endpoint});}catch{}
  try{await sub.unsubscribe();}catch{}
 }

 function remembered(){
  try{return window.localStorage?.getItem(PREFERENCE)==="1";}catch{return false;}
 }
 function remember(value){
  try{
   if(value)window.localStorage?.setItem(PREFERENCE,"1");
   else window.localStorage?.removeItem(PREFERENCE);
  }catch{/* Browser privacy mode may restrict local storage. */}
 }
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
 function stateError(error){
  return error?.message==="login_required"?"login_required":
   error?.message==="forbidden"?"forbidden":"service_error";
 }
 async function registerAndSync(generation=pushGeneration){
  if(generation!==pushGeneration)return "disabled";
  const cfg=await ceoApi("config","GET");
  if(generation!==pushGeneration)return "disabled";
  const key=cfg?.data?.vapidPublicKey;
  if(typeof key!=="string"||key.length<40)throw Error("service_error");
  // Flutter/PWA updates may replace the service worker for /ceo/.
  const reg=await navigator.serviceWorker.register(SW,{scope:SCOPE,updateViaCache:"none"});
  await navigator.serviceWorker.ready;
  if(generation!==pushGeneration)return "disabled";
  let sub=await reg.pushManager.getSubscription();
  if(generation!==pushGeneration)return "disabled";
  if(!sub)sub=await reg.pushManager.subscribe({
   userVisibleOnly:true,applicationServerKey:decodeKey(key)});
  if(generation!==pushGeneration){
   await cleanupCancelled(sub);return "disabled";
  }
  // Reconcile existing device with server on every login/restart, without a prompt.
  try{await ceoApi("subscription","POST",sub.toJSON());}
  catch(error){
   if(generation!==pushGeneration)await cleanupCancelled(sub);
   throw error;
  }
  if(generation!==pushGeneration){
   await cleanupCancelled(sub);return "disabled";
  }
  remember(true);
  return "enabled";
 }
 window.fbmnPushStatus=async()=>{
  const generation=pushGeneration;
  const support=supported();
  if(support!=="ok")return support;
  if(Notification.permission==="denied")return "denied";
  if(Notification.permission!=="granted")return "disabled";
  try{
   const reg=await navigator.serviceWorker.getRegistration(SCOPE);
   const sub=reg?await reg.pushManager.getSubscription():null;
   if(generation!==pushGeneration)return "disabled";
   // Adopt pre-upgrade subscriptions, and recreate those lost during PWA updates.
   if(remembered()||sub)return await registerAndSync(generation);
   return "disabled";
  }catch(error){return stateError(error);}
 };
 window.fbmnPushEnable=async()=>{
  const generation=pushGeneration;
  const support=supported();
  if(support!=="ok")return support;
  if(Notification.permission==="denied")return "denied";
  // Keep the browser prompt in the direct user-gesture chain.
  let permission;
  try{permission=await Notification.requestPermission();}catch{return "denied";}
  if(permission!=="granted")return "denied";
  if(generation!==pushGeneration)return "disabled";
  // Persist the user's positive choice even during a transient backend outage.
  remember(true);
  try{return await registerAndSync(generation);}catch(error){return stateError(error);}
 };
 async function revoke(preservePreference){
  // The check must happen before the first await, so pending restores abort.
  pushGeneration++;
  if(!preservePreference)remember(false);
  try{
   const reg=await navigator.serviceWorker.getRegistration(SCOPE);
   const sub=reg&&await reg.pushManager.getSubscription();
   if(sub){
    if(preservePreference)remember(true); // A subsequent Owner login restores consent.
    let serverError=false;
    try{await ceoApi("subscription","DELETE",{endpoint:sub.endpoint});}
    catch{serverError=true;}
    // Revoke local push even if the server is down; its next dispatch returns 410.
    await sub.unsubscribe();
    if(serverError)return "service_error";
   }
   return "disabled";
  }catch(error){return stateError(error);}
 }
 window.fbmnPushDisable=()=>revoke(false);
 // Logout revokes live device delivery, but does not erase the explicit user preference.
 window.fbmnPushLogout=()=>revoke(true);
})();
