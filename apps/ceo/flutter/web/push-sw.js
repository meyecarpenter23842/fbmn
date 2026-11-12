/* DL12C — a real Web Push service worker scoped only to /ceo/.
   No customer PII in payload, notifications, badge, URL, caches or logs. */
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
  const title=payload.type==="contact"?"Liên hệ mới":
   payload.type==="outsourcing"?"Yêu cầu gia công mới":
   payload.type==="chat"?"Hội thoại khách mới":
   payload.type==="mail"?"Email mới đến":"Thông báo Futurebook";
  const badge=Number.isSafeInteger(payload.badge)?
   Math.min(99,Math.max(0,payload.badge)):0;
  await self.registration.showNotification("Futurebook CEO",{
   body:title,icon:"/ceo/icons/fbmn.svg",badge:"/ceo/icons/fbmn.svg",
   tag:"fbmn-ceo-"+String(payload.type||"news")+"-"+String(payload.id||""),
   renotify:false,data:{url},silent:false
  });
  if(self.navigator?.setAppBadge)try{
   if(badge>0)await self.navigator.setAppBadge(badge);
   else await self.navigator.clearAppBadge?.();
  }catch{}
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
