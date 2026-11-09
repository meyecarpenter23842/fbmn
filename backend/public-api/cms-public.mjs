// C4: public CMS JSON DTO projection. No private actor, sourceRef, audit or R2 key.
import {CMS_PLACEMENTS} from "../admin-api/cms-placement-contract.mjs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KINDS=new Set(["banner","popup","article","promotion"]);
const ISO=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/;
function validDate(s){return typeof s==="string"&&ISO.test(s)&&Number.isFinite(Date.parse(s));}
function str(v,max,{empty=false}={}){
 if(typeof v!=="string"||v.length>max||(!empty&&!v.trim())||/<\/?[a-z][^>]*>/i.test(v))
  throw Error("Invalid public CMS value");
 return v;
}
function boundedInt(value,lo,hi){
 if(!Number.isSafeInteger(value)||value<lo||value>hi)throw Error("Invalid public CMS integer");
 return value;
}
export function projectPublicCms(raw){
 if(!Array.isArray(raw)||raw.length>500)throw Error("Invalid public CMS snapshot");
 const seen=new Set();
 return raw.map(row=>{
  if(!row||typeof row!=="object"||Array.isArray(row)||!KINDS.has(row.kind)||
     !UUID.test(row.id)||!SLUG.test(row.slug)||row.slug.length>100||
     !CMS_PLACEMENTS[row.kind].public_web.includes(row.slot)||
     !validDate(row.publishedAt)||
     (row.startsAt!=null&&!validDate(row.startsAt))||
     (row.endsAt!=null&&!validDate(row.endsAt)))throw Error("Invalid public CMS row");
  const key=row.kind+":"+row.slug;
  if(seen.has(key))throw Error("Duplicate public CMS row");
  seen.add(key);
  const paragraphs=row.paragraphs;
  if(!Array.isArray(paragraphs)||paragraphs.length>30||
     !paragraphs.every(p=>typeof p==="string"))throw Error("Invalid public CMS paragraphs");
  if(["article","promotion"].includes(row.kind)&&paragraphs.length===0)
   throw Error("Missing public CMS text");
  const result={
   id:row.id,kind:row.kind,slug:row.slug,title:str(row.title,160),
   summary:str(row.summary,400,{empty:true}),
   paragraphs:paragraphs.map(p=>str(p,3000)),
   ctaUrl:row.ctaUrl==null?null:str(row.ctaUrl,500,{empty:true}),
   slot:row.slot,sortOrder:boundedInt(row.sortOrder,0,10000),
   publishedAt:row.publishedAt,
   startsAt:row.startsAt??null,endsAt:row.endsAt??null,
   hasDesktop:row.hasDesktop===true,hasMobile:row.hasMobile===true,
   popupDelaySeconds:boundedInt(row.popupDelaySeconds,0,120),
   popupCooldownMinutes:boundedInt(row.popupCooldownMinutes,0,43200),
   popupMaxPerSession:boundedInt(row.popupMaxPerSession,1,20),
  };
  if(row.kind==="banner"&&row.slot==="home.hero"&&row.slides!==undefined){
   if(!Array.isArray(row.slides)||row.slides.length<1||row.slides.length>5||
      !row.slides.includes(1)||new Set(row.slides).size!==row.slides.length||
      row.slides.some(n=>!Number.isInteger(n)||n<1||n>5))
     throw Error("Invalid CMS hero slides");
   const m=row.motion;
   if(!m||typeof m!=="object"||Array.isArray(m)||
      typeof m.enabled!=="boolean"||typeof m.autoplay!=="boolean"||
      !["fade","slide","fade-slide"].includes(m.effect))
     throw Error("Invalid CMS motion");
   result.slides=[...row.slides];
   result.motion={enabled:m.enabled,autoplay:m.autoplay,effect:m.effect,
    intervalMs:boundedInt(m.intervalMs,3000,15000),
    durationMs:boundedInt(m.durationMs,300,800)};
  }
  if(row.kind==="promotion"&&!result.endsAt)throw Error("Promotion without expiry");
  if(["banner","popup"].includes(row.kind)&&(!result.hasDesktop||!result.hasMobile))
   throw Error("Missing public CMS images");
  // ctaUrl is text, never rendered as HTML or fetched by Worker.
  if(result.ctaUrl&& !/^\/(?!\/)(?!.*\.\.)[^\\]*$/.test(result.ctaUrl)){
   try{const u=new URL(result.ctaUrl);
    if(u.protocol!=="https:"||u.username||u.password||u.hash||u.href!==result.ctaUrl)throw Error();
   }catch{throw Error("Invalid public CMS action URL");}
  }
  return result;
 }).sort((a,b)=>a.sortOrder-b.sortOrder||a.publishedAt.localeCompare(b.publishedAt)||a.id.localeCompare(b.id));
}
