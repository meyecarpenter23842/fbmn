import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||"playwright");
const out="artifacts/dl7ct",origin="https://www.fbmn.vn";
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[],failures=[];
const check=async(row,name,fn)=>{try{row.checks[name]=await fn();}catch(e){row.checks[name]={error:String(e)};failures.push(row.width+" "+name+": "+e.message);}};
try{
 for(const width of [1440,1280,768,390,360]){
  const mobile=width<=390;
  const context=await browser.newContext({viewport:{width,height:width>800?900:844},deviceScaleFactor:1,hasTouch:mobile,isMobile:mobile,locale:"vi-VN",reducedMotion:"no-preference"});
  await context.addInitScript(()=>{window.__dl7ct={starts:0,ramps:[]};const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){window.__dl7ct.starts++;return start.apply(this,a)};const ramp=AudioParam.prototype.linearRampToValueAtTime;AudioParam.prototype.linearRampToValueAtTime=function(v,t){window.__dl7ct.ramps.push(v);return ramp.call(this,v,t)};});
  const page=await context.newPage(),row={width,checks:{},pageErrors:[]};results.push(row);
  page.on("pageerror",e=>row.pageErrors.push(e.message));
  const index=()=>Number(new URL(page.url()).searchParams.get("page"));
  const next=page.getByRole("button",{name:"Trang tiếp",exact:true});
  const prev=page.getByRole("button",{name:"Trang trước",exact:true});
  const moved=async(before)=>{await page.waitForFunction(v=>Number(new URL(location.href).searchParams.get("page"))!==v,before,{timeout:5000});await page.waitForTimeout(1100);return index()};
  try{
   const response=await page.goto(origin+"/catalogue",{waitUntil:"networkidle",timeout:45000});assert.equal(response.status(),200);
   const close=page.getByRole("button",{name:"Để sau",exact:true});if(await close.isVisible()){await close.click();await close.waitFor({state:"hidden"});await page.waitForTimeout(300);}
   await page.locator(".fb-catalogue-paper").first().waitFor({state:"attached",timeout:20000});
   const manifest=await (await page.request.get(origin+"/api/catalogue-books")).json();assert.ok(manifest.data.books.length);row.viewerSettings=manifest.data.viewerSettings;row.books=manifest.data.books.length;row.pdfEnabled=manifest.data.books.filter(b=>b.hasPdf).length;
   const host=page.locator(".fb-catalogue-book-host"),shell=page.locator(".fb-catalogue-book-shell");
   await shell.scrollIntoViewIfNeeded();await page.waitForTimeout(250);
   await page.screenshot({path:out+"/catalogue-"+width+".png",fullPage:true});
   await check(row,"layout",async()=>{const v=await host.evaluate(el=>{const rect=el.getBoundingClientRect();const items=[...el.querySelectorAll(".fb-catalogue-paper")].filter(p=>getComputedStyle(p).display!=="none"&&p.getBoundingClientRect().width>0);return {viewport:innerWidth,docWidth:document.documentElement.scrollWidth,bookWidth:Math.round(rect.width),bookHeight:Math.round(rect.height),visible:items.length,leaves:el.querySelectorAll(".fb-catalogue-paper").length,broken:items.filter(p=>{const i=p.querySelector("img");return i?.complete&&!i.naturalWidth}).length}});assert.ok(v.docWidth<=width+1);assert.ok(v.leaves>1);assert.equal(v.broken,0);assert.equal(v.visible,mobile?1:2);if(mobile)assert.ok(v.bookWidth>=width-20);return v});
   await check(row,"next-prev",async()=>{const before=index();await next.click();const after=await moved(before);assert.ok(after>before);if(mobile)assert.equal(after,before+1);await prev.click();const back=await moved(after);assert.equal(back,before);return {before,after,back}});
   await check(row,"audio",async()=>{const v=await page.evaluate(()=>window.__dl7ct);const audio=await page.request.get(origin+"/audio/catalogue-page-turn.wav");assert.equal(audio.status(),200);const bytes=await audio.body();assert.equal(bytes.subarray(0,4).toString(),"RIFF");if(row.viewerSettings.soundEnabled&&row.viewerSettings.soundVolume>0){await page.waitForFunction(()=>window.__dl7ct.starts>0,{timeout:6000});const s=await page.evaluate(()=>window.__dl7ct);assert.ok(s.starts>0);assert.ok(s.ramps.some(x=>Math.abs(x-row.viewerSettings.soundVolume/100*.65)<.002));return {starts:s.starts,volumeRamp:s.ramps,bytes:bytes.length}}return {disabled:true,starts:v.starts,bytes:bytes.length}});
   await check(row,"zoom-index",async()=>{await page.getByRole("button",{name:/Mục lục/}).click();await page.locator(".fb-catalogue-thumb").first().waitFor({state:"visible"});const count=await page.locator(".fb-catalogue-thumb").count();await page.locator(".fb-catalogue-thumb").nth(1).click();await page.getByRole("button",{name:/Phóng to trang chọn/}).click();const dialog=page.getByRole("dialog",{name:"Xem trang phóng to"});await dialog.waitFor({state:"visible"});assert.ok(await dialog.locator("img").isVisible());await dialog.getByRole("button",{name:/Đóng/}).click();await dialog.waitFor({state:"hidden"});return {thumbnails:count,zoom:true}});
   if(width===1440||width===390){
    await check(row,"fullscreen",async()=>{await page.getByRole("button",{name:/Toàn màn hình/}).click();await page.waitForFunction(()=>Boolean(document.fullscreenElement),null,{timeout:5000});await page.getByRole("button",{name:/Thu nhỏ/}).click();await page.waitForFunction(()=>!document.fullscreenElement,null,{timeout:5000});return true});
    await check(row,"keyboard",async()=>{await next.focus();const before=index();await page.keyboard.press("ArrowRight");const after=await moved(before);assert.ok(after>before);await page.keyboard.press("ArrowLeft");await moved(after);return true});
    await check(row,"rapid",async()=>{const before=index();const box=await next.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);for(let i=0;i<5;i++)await page.mouse.click(box.x+box.width/2,box.y+box.height/2);const after=await moved(before);assert.ok(after-before<=(mobile?1:2));return {before,after}});
    await check(row,mobile?"swipe":"drag",async()=>{await page.locator(".fb-catalogue-thumb").first().click();await page.waitForTimeout(200);const before=index();await shell.scrollIntoViewIfNeeded();const box=await host.boundingBox();const x=box.x+box.width-20,y=Math.min(box.y+box.height-20, (await page.evaluate(()=>innerHeight))-20);const end=box.x+box.width*.18;if(mobile){const cdp=await context.newCDPSession(page);await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});for(let i=1;i<=12;i++){await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:x+(end-x)*i/12,y:y-15*i/12}]});await page.waitForTimeout(15)}await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await cdp.detach()}else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(end,y-40,{steps:20});await page.mouse.up()}const after=await moved(before);assert.ok(after>before);return {before,after}});
   }
   if(row.pdfEnabled)await check(row,"pdf",async()=>{const link=page.getByRole("link",{name:"Xem PDF",exact:true}).first();const href=await link.getAttribute("href");const r=await page.request.get(new URL(href,origin).href);assert.equal(r.status(),200);assert.match(r.headers()["content-type"],/application\/pdf/);return true});
   else row.checks.pdf={notTested:"No published PDF in manifest"};
   assert.equal(row.pageErrors.length,0);
  }catch(e){row.error=String(e);failures.push(width+": "+e.message)}finally{await context.close()}
 }
 const context=await browser.newContext({reducedMotion:"reduce",viewport:{width:390,height:844}});
 const page=await context.newPage();const reduced={width:"390 reduced",checks:{}};results.push(reduced);
 await check(reduced,"reduced-motion",async()=>{await page.goto(origin+"/catalogue",{waitUntil:"networkidle"});const close=page.getByRole("button",{name:"Để sau",exact:true});if(await close.isVisible()){await close.click();await close.waitFor({state:"hidden"})}await page.locator(".fb-catalogue-paper").first().waitFor({state:"attached"});const before=Number(new URL(page.url()).searchParams.get("page"));await page.getByRole("button",{name:"Trang tiếp",exact:true}).click();await page.waitForFunction(v=>Number(new URL(location.href).searchParams.get("page"))===v+1,before);return true});
 await context.close();
}finally{await browser.close();await writeFile(out+"/report.json",JSON.stringify({origin,results,failures},null,2));console.log(JSON.stringify({results,failures},null,2))}
if(failures.length)process.exitCode=1;
