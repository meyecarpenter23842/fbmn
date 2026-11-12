/* DL12C — a real Web Push service worker scoped only to /ceo/.
   No customer PII in payload, notifications, badge, URL, caches or logs. */
// Replace old Flutter offline workers immediately, even with the CEO app open.
self.addEventListener("install",event=>{event.waitUntil(self.skipWaiting());});
self.addEventListener("activate",event=>{event.waitUntil(self.clients.claim());});
const ENTRY="/ceo/index.html";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^[a-f0-9]{36}$/;
function target(payload){
 const type=payload&&payload.type,ref=payload&&payload.id;
 if(!["contact","outsourcing","chat","mail"].includes(type)||typeof ref!=="string"||
    !(type==="chat"?SESSION.test(ref):UUID.test(ref)))return ENTRY;
 return ENTRY+"?tab="+encodeURIComponent(type)+"&id="+encodeURIComponent(ref);
}
self.addEventListener("push",event=>{
 event.waitUntil((async()=>{
  let payload={};
  try{payload=event.data?.json()||{};}catch{}
  const url=target(payload);
  const isTest=payload.type==="test"&&
   typeof payload.nonce==="string"&&/^[A-Za-z0-9_-]{16,32}$/.test(payload.nonce);
  const title=isTest?"Kiểm tra Push từ máy chủ":
   payload.type==="contact"?"Liên hệ mới":
   payload.type==="outsourcing"?"Yêu cầu gia công mới":
   payload.type==="chat"?(payload.returning===true?
    "Khách quay lại nhắn tin":"Hội thoại khách mới") :
   payload.type==="mail"?"Email mới đến":"Thông báo Futurebook";
  const badge=Number.isSafeInteger(payload.badge)?
   Math.min(99,Math.max(0,payload.badge)):0;
  await self.registration.showNotification("Futurebook CEO",{
   body:isTest?"Thiết bị đã nhận được Push thật từ Futurebook.":title,icon:"/ceo/icons/fbmn.svg",badge:"/ceo/icons/fbmn.svg",
   // Distinct inactivity-bucket event tags permit a returning chat to alert again.
   // Only the trusted server-generated hash is accepted; no customer data.
   tag:isTest?"fbmn-ceo-test-"+payload.nonce:
    "fbmn-ceo-"+String(payload.type||"news")+"-"+
     (/^[A-Za-z0-9_-]{8,32}$/.test(payload.event||"")?
       payload.event:String(payload.id||"")),
   renotify:false,data:{url},silent:false
  });
  // A diagnostic Push never overwrites the actual unread app badge.
  if(!isTest&&self.navigator?.setAppBadge)try{
   if(badge>0)await self.navigator.setAppBadge(badge);
   else await self.navigator.clearAppBadge?.();
  }catch{}
  if(isTest){
   // Acknowledgement means showNotification resolved; an accepted provider
   // request alone is NOT proof that this browser received a Push.
   const clients=await self.clients.matchAll({type:"window",includeUncontrolled:true});
   for(const client of clients){
    try{
     const u=new URL(client.url);
     if(u.origin===self.location.origin&&u.pathname.startsWith("/ceo/"))
      client.postMessage({type:"FBMN_PUSH_TEST_RECEIVED",nonce:payload.nonce});
    }catch{}
   }
  }
 })());
});
self.addEventListener("notificationclick",event=>{
 event.notification.close();
 event.waitUntil((async()=>{
  const raw=event.notification.data?.url;
  const url=new URL(typeof raw==="string"?raw:ENTRY,self.location.origin);
  if(url.origin!==self.location.origin||url.pathname!==ENTRY)return;
  const tabs=await self.clients.matchAll({type:"window",includeUncontrolled:true});
  for(const client of tabs){
   if(new URL(client.url).origin===url.origin&&new URL(client.url).pathname.startsWith("/ceo/")){
    await client.navigate(url.href);
    return client.focus();
   }
  }
  return self.clients.openWindow(url.href);
 })());
});
