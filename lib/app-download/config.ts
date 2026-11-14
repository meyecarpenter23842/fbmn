/** Public, Owner-managed Website popup fields. Store listings are never guessed. */
export type AppPlatform = "ios" | "android";
export type AppDownloadConfig = {
  popupEnabled:boolean;buttonEnabled:boolean;firstDelayMs:number;cooldownMinutes:number;
  title:string;message:string;iosUrl:string|null;androidUrl:string|null;revision:number;
};
// Legacy defaults are deliberately unset; live destinations come only from the public Worker.
export const appStoreLinks:Readonly<Record<AppPlatform,string|null>>={ios:null,android:null};

export function validStoreUrl(raw:string|null,platform:AppPlatform):string|null {
  if(!raw||typeof raw!=="string"||raw.length>500)return null;
  try{
    const u=new URL(raw);
    if(u.protocol!=="https:"||u.username||u.password||u.port||u.hash||u.searchParams.has("redirect"))return null;
    if(platform==="ios"){
      if(u.hostname!=="apps.apple.com"||u.pathname.length<3)return null;
    }else if(u.hostname!=="play.google.com"||u.pathname!=="/store/apps/details"||
       !/^[a-zA-Z0-9_.]+$/.test(u.searchParams.get("id")||""))return null;
    return u.toString();
  }catch{return null;}
}
export function getAppStoreLink(platform:AppPlatform,settings?:AppDownloadConfig|null):string|null{
  const raw=settings?(platform==="ios"?settings.iosUrl:settings.androidUrl):appStoreLinks[platform];
  return validStoreUrl(raw,platform);
}
export function parseAppDownloadConfig(raw:unknown):AppDownloadConfig|null{
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
  const o=raw as Record<string,unknown>;
  if(typeof o.popupEnabled!=="boolean"||typeof o.buttonEnabled!=="boolean"||
   !Number.isSafeInteger(o.firstDelayMs)||Number(o.firstDelayMs)<500||Number(o.firstDelayMs)>15000||
   !Number.isSafeInteger(o.cooldownMinutes)||Number(o.cooldownMinutes)<30||Number(o.cooldownMinutes)>1440||
   typeof o.title!=="string"||!o.title.trim()||o.title.length>80||
   typeof o.message!=="string"||!o.message.trim()||o.message.length>240||
   /[<>]/.test(o.title+o.message)||
   !Number.isSafeInteger(o.revision)||Number(o.revision)<1)return null;
  const ios=o.iosUrl==null?null:typeof o.iosUrl==="string"?validStoreUrl(o.iosUrl,"ios"):null;
  const android=o.androidUrl==null?null:typeof o.androidUrl==="string"?validStoreUrl(o.androidUrl,"android"):null;
  if(o.iosUrl!=null&&!ios||o.androidUrl!=null&&!android)return null;
  return {popupEnabled:o.popupEnabled,buttonEnabled:o.buttonEnabled,
    firstDelayMs:Number(o.firstDelayMs),cooldownMinutes:Number(o.cooldownMinutes),
    title:o.title,message:o.message,iosUrl:ios,androidUrl:android,revision:Number(o.revision)};
}
