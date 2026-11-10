import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildNewsHubItems} from "../lib/content/news-hub.ts";
import {handleCms} from "../backend/admin-api/cms-service.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const content={
 articles:[
 {slug:"tin-cu",title:"Tin cũ",summary:"Đã duyệt",paragraphs:["Nội dung"],publishedAt:"2026-11-01T00:00:00Z",slot:"news.list"},
 {slug:"tin-noi-bat",title:"Tin nổi bật",summary:"Đã duyệt",paragraphs:["Nội dung"],publishedAt:"2026-11-08T00:00:00Z",slot:"home.news_featured",id:"11111111-1111-4111-8111-111111111111",hasDesktop:true}
 ],
 promotions:[
 {slug:"uu-dai",title:"Khuyến mãi",summary:"Đã duyệt",detail:"Nội dung",publishedAt:"2026-11-06T00:00:00Z",endsAt:"2026-12-01T00:00:00Z",slot:"promotions.list"}
 ]};
test("DL7A one shared board orders approved news and promotions without duplicating entries",()=>{
 const all=buildNewsHubItems(content);
 assert.deepEqual(all.map(x=>x.kind+":"+x.slug),["news:tin-noi-bat","promotions:uu-dai","news:tin-cu"]);
 assert.equal(buildNewsHubItems(content,"news").length,2);
 assert.equal(buildNewsHubItems(content,"promotions").length,1);
 assert.deepEqual(buildNewsHubItems({articles:[],promotions:[]}),[]);
});
test("DL7A live board uses CMS public projection; legacy URLs and featured posts remain",()=>{
 const hub=read("app/bang-tin/page.tsx");
 assert.match(hub,/getPublicContent\(\)/);
 assert.match(hub,/buildNewsHubItems\(content,active\)/);
 assert.match(hub,/loai=tin-tuc/);assert.match(hub,/loai=khuyen-mai/);
 assert.match(hub,/href="\/tin-tuc"/);assert.match(hub,/href="\/khuyen-mai"/);
 assert.match(read("app/tin-tuc/page.tsx"),/const listed=articles;/);
 assert.match(read("app/khuyen-mai/page.tsx"),/const listed=promotions;/);
 const publicAdapter=read("lib/content/adapter.ts");
 assert.match(publicAdapter,/getPublicCms\(\)/);
 assert.match(publicAdapter,/hasDesktop:entry\.hasDesktop/);
 assert.doesNotMatch(hub,/sourceRef|NET|price|approvedBy|R2_KEY/);
});
test("DL7A Admin manages both types in one CMS, with server-side filters and separate create actions",()=>{
 const page=read("apps/admin/app/page.tsx");
 const manager=read("apps/admin/app/cms-manager.tsx");
 assert.match(page,/section==="content"&&<CmsManager mode="editorial"/);
 for(const name of ["Thêm tin tức","Thêm khuyến mãi","Loại bài viết","Trạng thái","setEditorialKind","setEditorialStatus","q.set(\"kind\"","q.set(\"status\"","q.set(\"search\"","websiteCmsPage"])
  assert.ok(manager.includes(name),name);
 assert.match(manager,/CmsEditor item={editing} kind={editing\?\.kind\|\|kind}/);
});
function hit(query){
 let recorded=null;
 const db=async fn=>fn({query:async (sql,values)=>{recorded={sql,values};return {rows:[],rowCount:0};}});
 return handleCms({request:new Request("https://admin.example.test/v1/admin/cms"+query),
  actor:{role:"owner",subject:"owner-test"},db}).then(async r=>({status:r.status,data:await r.json(),recorded}));
}
test("DL7A authenticated CMS list filters in SQL rather than client-only page filtering",async()=>{
 const result=await hit("?mode=editorial&page=2&kind=promotion&status=published&search=Giay");
 assert.equal(result.status,200);
 assert.deepEqual(result.recorded.values,["editorial",50,"promotion","published","Giay"]);
 assert.match(result.recorded.sql,/kind=\$3/);
 assert.match(result.recorded.sql,/status=\$4/);
 assert.match(result.recorded.sql,/strpos\(lower\(title\),lower\(\$5::text\)\)/);
 assert.match(result.recorded.sql,/LIMIT 51 OFFSET \$2/);
});
test("DL7A CMS rejects invalid kinds/statuses/queries before querying DB",async()=>{
 for(const query of ["?mode=editorial&kind=banner","?mode=editorial&status=secret",
 "?mode=marketing&kind=article","?mode=editorial&kind=article&kind=promotion",
 "?mode=editorial&search=%20%20","?mode=editorial&search="+encodeURIComponent("x".repeat(81))]){
  const r=await hit(query);assert.equal(r.status,400,query);assert.equal(r.recorded,null,query);
 }
});
