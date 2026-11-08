import type {CmsChannel} from "./cms-placement-options";

/** Existing cross-channel records are shared. Website editing must never strip App targets or placements. */
export type CmsChannelPlacements=Partial<Record<CmsChannel,string>>;
export function websiteDraftTargets(existing?:readonly CmsChannel[]):CmsChannel[]{
 if(!existing)return ["public_web"];
 if(!existing.includes("public_web"))throw Error("cms_not_targeted_to_website");
 return [...existing];
}
export function withWebsitePlacement(original:CmsChannelPlacements,websiteSlot:string):CmsChannelPlacements{
 const result={...original};
 if(websiteSlot)result.public_web=websiteSlot;
 else delete result.public_web;
 return result;
}
