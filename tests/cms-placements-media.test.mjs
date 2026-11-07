import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleCmsMedia} from "../backend/admin-api/cms-media-service.mjs";
import {CMS_PLACEMENTS,validCmsPlacements,cmsPlacementIsReady,validatePopupFrequency} from "../backend/admin-api/cms-placement-contract.mjs";

const ID="11111111-1111-4111-8111-111111111111";
const WEBP="UklGRpACAABXRUJQVlA4IIQCAABQDACdASpQAFAAPu1yr1KppqQipnZqATAdiUAaaLD+gNBXz+LNJ4Bv7v4AygeAGkCmTeKx7ARW1l527xCL2PR6L6nm8kEueORWQ9pDlbSHzJg+pPLUVcg/HMbs5ojtXCgxuRVkBpox2Y24AAD+W+sfH4SfXeD0Y7OkpF3CbibiUYiTPJzhyLykXN/oPM7PxxsTGcr5USLJaECoWxt14q+zhL5l+toxlLD8FYqJwIFHMg620MsTdSyAluCclEzztbR+zbNSdpqfBlXjlD/P0Dg76zyvk/BX0r1xxNMcUfcrKOqmuSV2FyfN3dZrBmT0rdEW3RYK7nvuj4A87X0qGnnR8qvEPE7YhR/wZGt8U66vnKnql1g+S7XJnCzUhW1K/bw2dJXEcJt2BhJor6JcD/aJx/ZVvgJSV19gjLruyWB0mzHvRCrpEahM9/pAygtpfQ2pXi3BTwVHhbM/dOP1wRhpJ6T80dOjfHvuJrEyQ3NJRn+92fWeb+v4qJ+tKtHPNH6hmeugLw2W6om3/GiPjo5zFuSQo3NstSANFaO3ODjrPZUQ1Jo3jFUROCxXNmjAuVKCG16ghHAiG6yROpPwQzlf0MItIbbEO3PWCaAzLBMTEGihyZEMjY6FBL2+vQOy+UB53VRZtwdQrqgFJ0HQEF/vD5UmUCdZwf76Bo9npRvlg06KXLpuujf5Drrq8iBDrTW555K98mJcVlcdnKRTzvGDr2MAPt1c4Nvyg899YBQ1HGXKB/OX1lJzYUuhOSRdi14dvp+OQ7sZERGm3rLdfA7+grpgNmtj36xT9mN+E3sEK7VT4VBcXJx4sKoIAfdApagI45PUFBvRvAb+NQmR+GH7SAAAAA==";
function fixture({failCommitAck=false}={}){
 const asset=new Map(),audit=[];
 const entry={id:ID,status:"draft",revision:1,channel_targets:["public_web"]};
 const r2={get:async key=>{const b=asset.get(key);return b?{body:new Blob([b]).stream(),size:b.byteLength}:null;},
  put:async(key,bytes)=>{asset.set(key,bytes);},delete:async key=>asset.delete(key)};
 const media=new Map();
 const db=async work=>work({query:async (sql,params=[])=>{
  if(sql==="COMMIT"&&failCommitAck)throw Error("Lost COMMIT acknowledgement");
  if(["BEGIN","COMMIT","ROLLBACK"].includes(sql))return {rows:[],rowCount:0};
  if(sql.includes("SELECT * FROM fbmn_catalog_private.cms_entries"))
   return {rows:[{...entry}],rowCount:1};
  if(sql.includes("SELECT r2_key FROM fbmn_catalog_private.cms_entry_media")&&sql.includes("FOR UPDATE")){
   const r=media.get(params[1]+"/"+params[2]);
   return {rows:r?[{r2_key:r.r2_key}]:[],rowCount:r?1:0};
  }
  if(sql.includes("INSERT INTO fbmn_catalog_private.cms_entry_media")){
   const value={channel:params[1],device:params[2],r2_key:params[3],width:params[4],
    height:params[5],updated_at:new Date().toISOString()};
   media.set(params[1]+"/"+params[2],value);
   return {rows:[],rowCount:1};
  }
  if(sql.includes("UPDATE fbmn_catalog_private.cms_entries")){
   entry.revision++;
   return {rows:[{revision:entry.revision}],rowCount:1};
  }
  if(sql.includes("INSERT INTO fbmn_catalog_private.cms_entry_audit")){
   audit.push(params);
   return {rows:[],rowCount:1};
  }
  if(sql.includes("SELECT channel,device,width,height,updated_at FROM fbmn_catalog_private.cms_entry_media")){
   return {rows:[...media.values()],rowCount:media.size};
  }
  if(sql.includes("SELECT r2_key FROM fbmn_catalog_private.cms_entry_media")){
   const r=media.get(params[1]+"/"+params[2]);
   return {rows:r?[{r2_key:r.r2_key}]:[],rowCount:r?1:0};
  }
  throw Error("Unexpected query "+sql);
 }});
 const hit=(action,method="GET",{query="",headers={},body}={})=>
  handleCmsMedia({request:new Request("https://admin.worker/v1/admin/cms/"+action+query,{method,headers,...(body?{body}:{})}),
   db,r2,actor:{subject:"owner-subject",role:"owner"},action});
 return {entry,asset,media,audit,hit};
}
test("CMS upload of real WebP stores private channel/device image and audits revision",async()=>{
 const f=fixture();
 const bytes=Buffer.from(WEBP,"base64");
 assert.ok(bytes.length>100);
 const upload=()=>f.hit("image-upload","POST",{
  headers:{"content-type":"image/webp","x-cms-id":ID,"x-cms-channel":"public_web",
   "x-cms-device":"desktop","x-cms-revision":"1"},body:bytes
 });
 const res=await upload();
 assert.equal(res.status,200);
 const saved=(await res.json()).data;
 assert.equal(saved.revision,2);
 assert.equal(saved.width,80);assert.equal(saved.height,80);
 assert.equal(f.audit.length,1);
 assert.equal(f.media.size,1);
 assert.equal(f.asset.size,1);
 assert.equal((await upload()).status,409,"stale edit must not overwrite");
 const listed=await f.hit("assets","GET",{query:"?id="+ID});
 assert.equal((await listed.json()).data.items.length,1);
 const image=await f.hit("image","GET",{query:"?id="+ID+"&channel=public_web&device=desktop"});
 assert.equal(image.status,200);
 assert.equal(image.headers.get("content-type"),"image/webp");
 assert.equal((await image.arrayBuffer()).byteLength,bytes.length);
});
test("CMS keeps R2 bytes when COMMIT acknowledgement is uncertain",async()=>{
 const f=fixture({failCommitAck:true});
 const bytes=Buffer.from(WEBP,"base64");
 const result=await f.hit("image-upload","POST",{
  headers:{"content-type":"image/webp","x-cms-id":ID,"x-cms-channel":"public_web",
   "x-cms-device":"mobile","x-cms-revision":"1"},body:bytes
 });
 assert.equal(result.status,503,"a missing ACK must report failure");
 assert.equal(f.asset.size,1,"deleting R2 here would corrupt a committed media reference");
 assert.equal(f.media.size,1);
 const image=await f.hit("image","GET",{query:"?id="+ID+"&channel=public_web&device=mobile"});
 assert.equal(image.status,200);
 assert.equal((await image.arrayBuffer()).byteLength,bytes.length);
});

test("CMS media rejects wrong channel, bad image, published edit and unsafe query",async()=>{
 const f=fixture();
 const bytes=Buffer.from(WEBP,"base64");
 const base={"content-type":"image/webp","x-cms-id":ID,"x-cms-channel":"dealer_app",
  "x-cms-device":"desktop","x-cms-revision":"1"};
 assert.equal((await f.hit("image-upload","POST",{headers:base,body:bytes})).status,400);
 assert.equal(f.asset.size,0);
 assert.equal((await f.hit("image-upload","POST",{
  headers:{...base,"x-cms-channel":"public_web"},body:Buffer.alloc(180,0)
 })).status,400);
 f.entry.status="published";
 assert.equal((await f.hit("image-upload","POST",{
  headers:{...base,"x-cms-channel":"public_web"},body:bytes
 })).status,409);
 assert.equal((await f.hit("image","GET",{query:"?id="+ID+"&channel=public_web&device=bad"})).status,400);
 assert.equal((await f.hit("assets","GET",{query:"?id="+ID+"&extra=1"})).status,400);
});
test("CMS allowed positions and frequencies are strict per channel and kind",()=>{
 assert.equal(validCmsPlacements("banner",["public_web"],{public_web:"home.hero"}),true);
 assert.equal(validCmsPlacements("popup",["public_web"],{public_web:"home.hero"}),false);
 assert.equal(validCmsPlacements("banner",["public_web"],{dealer_app:"home.banner"}),false);
 assert.equal(cmsPlacementIsReady("banner",["public_web"],{}),false);
 assert.equal(cmsPlacementIsReady("banner",["public_web"],{public_web:"home.hero"}),true);
 assert.equal(validatePopupFrequency({popupDelaySeconds:3,popupCooldownMinutes:1440,popupMaxPerSession:1}),true);
 assert.equal(validatePopupFrequency({popupDelaySeconds:121,popupCooldownMinutes:0,popupMaxPerSession:1}),false);
 const ui=readFileSync("apps/admin/app/cms-placement-options.ts","utf8");
 for(const channel of ["public_web","dealer_app","consumer_app"])
  for(const kind of ["banner","popup","article","promotion"])
   for(const slot of CMS_PLACEMENTS[kind][channel])assert.ok(ui.includes('value:"'+slot+'"'),kind+"/"+channel+"/"+slot);
});
test("CMS private migration never exposes R2 keys to public roles",()=>{
 const s=readFileSync("backend/neon/migrations/20261104_adm03b_cms_placements_media.up.sql","utf8");
 assert.match(s,/CREATE TABLE fbmn_catalog_private.cms_entry_media/);
 assert.match(s,/REVOKE ALL ON fbmn_catalog_private.cms_entry_media FROM PUBLIC/);
 assert.doesNotMatch(s,/GRANT .*fbmn_public/);
 assert.match(s,/ADD COLUMN placements jsonb/);
 assert.match(s,/media_upload/);
 const ui=readFileSync("apps/admin/app/cms-manager.tsx","utf8");
 const route=readFileSync("apps/admin/app/api/cms/[[...path]]/route.ts","utf8");
 assert.match(ui,/CmsMediaEditor/);
 assert.match(ui,/cms-error-state/);
 assert.match(ui,/Chờ kết nối Web\/App/);
 assert.match(route,/cms_worker_not_deployed/);
 assert.match(route,/image\/webp/);
});

test("CMS wizard stages image before creating record and uploads serially on Save",()=>{
 const editor=readFileSync("apps/admin/app/cms-manager.tsx","utf8");
 const media=readFileSync("apps/admin/app/cms-media-editor.tsx","utf8");
 const modal=readFileSync("apps/admin/app/product-modal.tsx","utf8");
 const style=readFileSync("apps/admin/app/cms-manager.css","utf8");
 assert.match(editor,/const \[pendingImages,setPendingImages\]=useState<CmsPendingImages>\(\{\}\)/);
 assert.match(editor,/URL\.createObjectURL\(file\)/);
 assert.match(editor,/if\(busy\|\|operationLock\.current\)return/);
 assert.match(editor,/const result=await cmsApi/);
 assert.match(editor,/const files=Object\.entries\(pendingImages\)/);
 assert.match(editor,/for\(const \[key,pending\] of files\)/);
 assert.match(editor,/await uploadCmsImage\(current\.id,current\.revision/);
 assert.match(editor,/current=\{\.\.\.current,revision\}/);
 assert.match(editor,/dirtyRef\.current=false/);
 assert.match(editor,/Bản nháp/);
 assert.match(media,/channels\.length===0/);
 assert.match(media,/onStage\(ch,device,file\)/);
 assert.match(media,/pending\[key\]/);
 assert.match(media,/saveBusy|recordId/);
 assert.match(media,/convertToWebP/);
 assert.match(media,/image\/webp/);
 assert.match(modal,/footer\?:\(close:\(\)=>void\)=>ReactNode/);
 assert.match(modal,/className="fb-product-modal-footer"/);
 assert.match(editor,/role="tablist"/);
 assert.match(editor,/role="tabpanel"/);
 assert.match(editor,/footer=\{requestClose=>/);
 assert.match(editor,/form=\{editorFormId\}/);
 assert.match(style,/\.cms-wizard-tabs\{position:sticky;top:0/);
 assert.doesNotMatch(media,/Lưu bản nháp trước để kích hoạt/);
});
test("CMS preview shows selected or saved R2 assets and distinct layouts per device/placement",()=>{
 const preview=readFileSync("apps/admin/app/cms-visual-preview.tsx","utf8");
 const media=readFileSync("apps/admin/app/cms-media-editor.tsx","utf8");
 assert.match(preview,/cmsMediaKey\(current,device\)/);
 assert.match(preview,/CmsImagePreview/);
 assert.match(preview,/slot==="home\.after_products"/);
 assert.match(preview,/slot==="category\.header"/);
 assert.match(preview,/cms-simulation-popup-backdrop/);
 assert.match(preview,/cms-simulation--mobile/);
 assert.match(preview,/Chưa chọn vị trí/);
 assert.match(preview,/Mô phỏng vị trí/);
 assert.match(media,/URL\.revokeObjectURL/);
});
