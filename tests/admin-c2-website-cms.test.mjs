import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websiteDraftTargets,withWebsitePlacement} from "../apps/admin/app/cms-website-policy.ts";
import {websiteCmsPage} from "../apps/admin/app/cms-website-list.ts";
import {CMS_PLACEMENTS} from "../backend/admin-api/cms-placement-contract.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const manager=read("apps/admin/app/cms-manager.tsx");
const webSlots=read("apps/admin/app/cms-website-placement.tsx");
const preview=read("apps/admin/app/cms-visual-preview.tsx");
const media=read("apps/admin/app/cms-media-editor.tsx");

test("C2 new drafts belong to Website; legacy Web/App record retains exact App targets",()=>{
 assert.deepEqual(websiteDraftTargets(),["public_web"]);
 const existing=["dealer_app","public_web","consumer_app"];
 const next=websiteDraftTargets(existing);
 assert.deepEqual(next,existing);
 assert.notStrictEqual(next,existing);
 assert.throws(()=>websiteDraftTargets(["dealer_app"]),/cms_not_targeted_to_website/);
});

test("C2 changing Website placement never drops or rewrites legacy App slots",()=>{
 const original={public_web:"home.hero",dealer_app:"home.banner",consumer_app:"home.banner"};
 const moved=withWebsitePlacement(original,"home.after_products");
 assert.deepEqual(moved,{...original,public_web:"home.after_products"});
 assert.deepEqual(withWebsitePlacement(original,""),{dealer_app:"home.banner",consumer_app:"home.banner"});
 assert.deepEqual(original,{public_web:"home.hero",dealer_app:"home.banner",consumer_app:"home.banner"});
});

test("C2 page adapter paginates only Website across mixed backend pages, no missing entries",async()=>{
 const dataset=Array.from({length:125},(_,id)=>({
  id,channel_targets:id%2===0?["public_web","dealer_app"]:["dealer_app"]
 }));
 const calls=[];
 const readPage=async page=>{
  calls.push(page);
  return {items:dataset.slice((page-1)*50,page*50),page,hasNext:page*50<dataset.length};
 };
 const first=await websiteCmsPage(1,readPage);
 assert.deepEqual(first.items.map(i=>i.id),dataset.filter(i=>i.channel_targets.includes("public_web")).slice(0,50).map(i=>i.id));
 assert.equal(first.hasNext,true);
 const second=await websiteCmsPage(2,readPage);
 assert.deepEqual(second.items.map(i=>i.id),dataset.filter(i=>i.channel_targets.includes("public_web")).slice(50).map(i=>i.id));
 assert.equal(second.items.length,13);
 assert.equal(second.hasNext,false);
 assert.ok(calls.length<=6);
});
test("C2 page adapter fails visibly on invalid backend pages and preserves honest empty state",async()=>{
 const empty=await websiteCmsPage(1,async page=>({
  page,hasNext:false,items:[{channel_targets:["dealer_app"]}]
 }));
 assert.deepEqual(empty,{items:[],hasNext:false});
 await assert.rejects(websiteCmsPage(1,async()=>({page:5,items:[],hasNext:false})),/không hợp lệ/);
 await assert.rejects(websiteCmsPage(0,async()=>({page:1,items:[],hasNext:false})),/không hợp lệ/);
});

test("C2 placement options are exactly public_web slots, grouped by real Website area",()=>{
 assert.match(webSlots,/CMS_SLOTS\[kind\]\.public_web/);
 assert.match(webSlots,/AREA_ORDER=\["home","category","news","promotions","all"\]/);
 for(const [kind,channels] of Object.entries(CMS_PLACEMENTS)){
  for(const slot of channels.public_web)assert.ok(
   read("apps/admin/app/cms-placement-options.ts").includes('value:"'+slot+'"'),kind+"/"+slot
  );
 }
 assert.match(webSlots,/Chọn trang trước, rồi chọn đúng khu vực/);
 assert.match(webSlots,/onChange\(e\.target\.value\)/);
});

test("C2 Website editor removes all App channel checkboxes and uses only Website media/preview",()=>{
 assert.match(manager,/channelTargets:websiteDraftTargets\(\)/);
 assert.match(manager,/channelTargets:websiteDraftTargets\(item\.channel_targets\)/);
 assert.match(manager,/withWebsitePlacement\(draft\.placements,value\)/);
 assert.match(manager,/CmsWebsitePlacement kind=\{draft\.kind\}/);
 assert.doesNotMatch(manager,/cms-channels|toggleChannel|CHANNELS\.map|Kênh hiển thị/);
 assert.match(manager,/channels=\{\["public_web"\]\} pending=\{pendingImages\}/);
 assert.match(manager,/channelTargets=\{\["public_web"\]\} placements=\{draft\.placements\}/);
 assert.match(manager,/channel="public_web" device=\{previewDevice\} webOnly/);
 assert.match(preview,/webOnly\?<span className="cms-preview-surface">Website Futurebook/);
 assert.match(media,/websiteOnly\?"Ảnh Website: Desktop và Mobile"/);
});

test("C2 protects legacy mixed-channel records and keeps publication fail-closed",()=>{
 assert.match(manager,/Bản ghi cũ còn liên kết App/);
 assert.match(manager,/item\.channel_targets\.some\(ch=>ch!=="public_web"\)/);
 assert.match(manager,/cmsWebsiteSlotLabel\(item\.kind,item\.placements\?\.public_web\|\|""\)/);
 assert.match(manager,/websiteCmsPage<CmsSummary>\(page/);
 assert.match(manager,/Chờ kết nối Website/);
 assert.doesNotMatch(manager,/section==="banners"&&<CmsManager/); // routing stays in Admin shell
 const page=read("apps/admin/app/page.tsx");
 assert.match(page,/section==="banners"&&<CmsManager mode="marketing"/);
 assert.match(page,/section==="content"&&<CmsManager mode="editorial"/);
 assert.match(manager,/role="tablist"/);
 assert.match(manager,/cms-wizard-footer/);
});
