import type {Metadata} from "next";

// A single branded 1200x630 PNG is served from the public Website itself.
// Never substitute a generic stock image for an unpublished product photo.
export const SOCIAL_IMAGE_PATH="/api/social-preview";
export const SOCIAL_IMAGE_URL="https://www.fbmn.vn"+SOCIAL_IMAGE_PATH;
const BRAND="Futurebook Miền Nam";
const ORIGIN="https://www.fbmn.vn";

export type SocialShareOptions={
 title:string;
 description:string;
 path:string;
 images?:readonly string[];
 publishedTime?:string;
};

const defaultImage=()=>({
 url:SOCIAL_IMAGE_URL,width:1200,height:630,alt:"Futurebook Miền Nam – tập vở và văn phòng phẩm"
});

/** Share tags always describe the exact canonical page, using approved real
 * photos when available, and the brand card when no approved photo exists.
 * Product photos keep their natural size: dimensions must not be invented.
 */
export function socialShareMetadata({
 title,description,path,images=[],publishedTime
}:SocialShareOptions):Pick<Metadata,"openGraph"|"twitter">{
 const unique=[...new Set(images.filter(value=>typeof value==="string"&&
   value.startsWith("https://")&&value.length<2000))].slice(0,4);
 const socialImages=unique.length?unique:[defaultImage()];
 return {
  openGraph:{
   ...(publishedTime?{type:"article" as const,publishedTime}:{type:"website" as const}),
   title,description,siteName:BRAND,url:new URL(path,ORIGIN).href,
   images:socialImages
  },
  twitter:{
   card:"summary_large_image",title,description,
   images:unique.length?unique:[SOCIAL_IMAGE_URL]
  }
 };
}
