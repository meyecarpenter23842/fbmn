// Browser UI acceptance against a locally built Admin; API/auth fixtures only, never customer data.
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
const base="http://127.0.0.1:3100";
const out="artifacts/dl10c";
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const session="a".repeat(36),now="2026-11-10T12:00:00Z";
const item={session,createdAt:now,updatedAt:now,messageCount:2,latest:"Giấy A4 — phản hồi kiểm thử"};
const answer="Dòng một\nDòng hai\n"+"a".repeat(250);
const turn={id:"1",question:"Giấy A4",answer,createdAt:now};
try{
 for(const width of [1440,1280,390,360]){
  const context=await browser.newContext({viewport:{width,height:900},locale:"vi-VN",reducedMotion:"reduce"});
  let deleted=false,search="",dateFrom="",dateTo="",deletes=0,role="owner";
  await context.route("**/api/**",async route=>{
   const request=route.request(),u=new URL(request.url()),path=u.pathname;
   const json=(body,status=200)=>route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
   if(path==="/api/auth/get-session")return json({session:{id:"test-session",token:"fixture",userId:"test-owner",expiresAt:"2099-01-01T00:00:00Z",createdAt:now,updatedAt:now},user:{id:"test-owner",email:"fixture@example.test",name:"UI fixture",emailVerified:true,createdAt:now,updatedAt:now}});
   if(path==="/api/auth/token")return json({token:"test.fixture.token"});
   if(path==="/api/admin/session")return json({data:{role,channels:["public_web"]}});
   if(path==="/api/admin/channels")return json({data:[]});
   if(path==="/api/website/chat-history"){
    assert.equal(request.headers().authorization,"Bearer test.fixture.token");
    if(request.method()==="POST"){
     assert.deepEqual(request.postDataJSON(),{operation:"delete",session});deletes++;deleted=true;
     return json({data:{deleted:true}});
    }
    if(u.searchParams.has("session"))return json({data:{session,page:1,hasMore:false,turns:[turn]}});
    search=u.searchParams.get("q")||"";dateFrom=u.searchParams.get("from")||"";dateTo=u.searchParams.get("to")||"";
    return json({data:{page:1,hasMore:false,conversations:deleted?[]:[item]}});
   }
   return json({error:{code:"fixture_unavailable"}},503);
  });
  const page=await context.newPage();
  try{
   await page.goto(base,{waitUntil:"domcontentloaded"});
   if(width<800)await page.getByRole("button",{name:"Mở menu"}).click();
   await page.getByRole("button",{name:"Quản lý hội thoại",exact:true}).click({timeout:30000});
   await page.getByText(item.latest,{exact:true}).waitFor();
   const detail=page.getByRole("button",{name:"Xem chi tiết"});
   const geometry=await detail.evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,box:el.getBoundingClientRect().width}));
   assert.ok(geometry.width>=80&&geometry.scroll<=geometry.width+2,"detail action must fit text "+JSON.stringify(geometry));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),"no horizontal overflow");
   await page.screenshot({path:out+"/list-"+width+".png",fullPage:true});
   await page.getByLabel("Từ khóa hoặc mã phiên").fill("Giấy A4");
   await page.getByLabel("Từ ngày").fill("2026-11-01");
   await page.getByLabel("Đến ngày").fill("2026-11-10");
   await page.getByRole("button",{name:"Tìm kiếm",exact:true}).click();
   await page.getByText(item.latest,{exact:true}).waitFor();
   assert.equal(search,"Giấy A4");assert.equal(dateFrom,"2026-11-01");assert.equal(dateTo,"2026-11-10");
   await detail.click();
   const dialog=page.getByRole("dialog",{name:"Chi tiết hội thoại"});
   await dialog.getByText("Dòng một",{exact:false}).waitFor();
   const style=await dialog.locator(".dl10c-messages p").last().evaluate(el=>({whiteSpace:getComputedStyle(el).whiteSpace,wrap:getComputedStyle(el).overflowWrap,width:el.clientWidth,scroll:el.scrollWidth}));
   assert.equal(style.whiteSpace,"pre-wrap");assert.equal(style.wrap,"anywhere");
   assert.ok(style.scroll<=style.width+2,"long transcript must wrap");
   await page.screenshot({path:out+"/detail-"+width+".png",fullPage:true});
   await dialog.getByRole("button",{name:"Xóa hội thoại",exact:true}).click();
   assert.equal(deletes,0,"first click must only confirm");
   await dialog.getByRole("button",{name:"Xác nhận xóa vĩnh viễn"}).click();
   await page.getByText("Không có hội thoại phù hợp.",{exact:true}).waitFor();
   assert.equal(deletes,1);
   console.log("DL10C_BROWSER_OK width="+width+" search detail confirm delete");
  }finally{await context.close();}
 }
}finally{await browser.close();}
