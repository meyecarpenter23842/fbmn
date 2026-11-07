/**
 * Futurebook L07 CMS placement allowlist.
 * A channel slot is a semantic location, never a CSS selector or client URL.
 * Frontends implement slots independently; a slot does not imply it is live.
 */
export const CMS_PLACEMENTS=Object.freeze({
 banner:Object.freeze({
  public_web:Object.freeze(["home.hero","home.after_products","category.header"]),
  dealer_app:Object.freeze(["home.banner"]),
  consumer_app:Object.freeze(["home.banner"])
 }),
 popup:Object.freeze({
  public_web:Object.freeze(["home.entry","category.entry","all.entry"]),
  dealer_app:Object.freeze(["home.entry"]),
  consumer_app:Object.freeze(["home.entry"])
 }),
 article:Object.freeze({
  public_web:Object.freeze(["news.list","home.news_featured"]),
  dealer_app:Object.freeze(["news.list"]),
  consumer_app:Object.freeze(["news.list"])
 }),
 promotion:Object.freeze({
  public_web:Object.freeze(["promotions.list","home.promotion_featured"]),
  dealer_app:Object.freeze(["promotions.list"]),
  consumer_app:Object.freeze(["promotions.list"])
 })
});
const SAFE_CH=new Set(["public_web","dealer_app","consumer_app"]);
export function validCmsPlacements(kind,channels,placements){
 if(!Array.isArray(channels) || channels.some(c=>!SAFE_CH.has(c))||
  !placements||typeof placements!=="object"||Array.isArray(placements))return false;
 const allowed=CMS_PLACEMENTS[kind];
 if(!allowed)return false;
 if(Object.keys(placements).some(c=>!channels.includes(c)))return false;
 return Object.entries(placements).every(([channel,slot])=>
  typeof slot==="string"&&allowed[channel]?.includes(slot));
}
export function cmsPlacementIsReady(kind,channels,placements) {
 return validCmsPlacements(kind,channels,placements)&&
  channels.length>0&&channels.every(ch=>typeof placements[ch]==="string");
}
export function validatePopupFrequency(input){
 return Number.isSafeInteger(input?.popupDelaySeconds)&&input.popupDelaySeconds>=0&&input.popupDelaySeconds<=120&&
  Number.isSafeInteger(input?.popupCooldownMinutes)&&input.popupCooldownMinutes>=0&&input.popupCooldownMinutes<=43200&&
  Number.isSafeInteger(input?.popupMaxPerSession)&&input.popupMaxPerSession>=1&&input.popupMaxPerSession<=20;
}
