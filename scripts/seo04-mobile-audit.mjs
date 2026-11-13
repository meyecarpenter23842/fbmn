// SEO04: advisory public Chromium lab, NOT field CWV (CrUX / real-user INP).
import {chromium} from "playwright";
import {mkdir,writeFile,appendFile} from "node:fs/promises";

const origin=process.env.SEO04_BASE_URL||"https://www.fbmn.vn";
if(!["https://www.fbmn.vn","https://fbmn-web.vercel.app"].includes(origin))
 throw Error("Only approved Futurebook public HTTPS origins");
const output="artifacts/seo04";
const routes=[["home","/"],["products","/san-pham"],
 ["song-natural","/san-pham/sku-3ac08ff247847c1e77bfccb0e806ed29"],
 ["dealer","/dai-ly"],["outsourcing","/gia-cong"]];
const rows=[];
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:width<700?844:900},
   locale:"vi-VN",reducedMotion:"reduce",deviceScaleFactor:1});
  for(const [name,path] of routes){
   const page=await ctx.newPage();
   const requests=[];
   page.on("request",r=>requests.push(r.resourceType()));
   await page.addInitScript(()=>{
    window.__seo04={lcp:null,cls:0};
    try{
     new PerformanceObserver(list=>{
      for(const e of list.getEntries())window.__seo04.lcp=Math.round(e.startTime);
     }).observe({type:"largest-contentful-paint",buffered:true});
     new PerformanceObserver(list=>{
      for(const e of list.getEntries())if(!e.hadRecentInput)window.__seo04.cls+=e.value;
     }).observe({type:"layout-shift",buffered:true});
    }catch{}
   });
   try{
    const r=await page.goto(origin+path,{waitUntil:"domcontentloaded",timeout:35000});
    await page.waitForTimeout(1900);
    const data=await page.evaluate(()=>{
     const nav=performance.getEntriesByType("navigation")[0];
     return {
      title:document.title,
      canonical:document.querySelector('link[rel="canonical"]')?.getAttribute("href")||null,
      robots:document.querySelector('meta[name="robots"]')?.getAttribute("content")||null,
      ttfbMs:nav?Math.round(nav.responseStart):null,
      domContentLoadedMs:nav?Math.round(nav.domContentLoadedEventEnd):null,
      lcpMs:window.__seo04.lcp,
      cls:Number(window.__seo04.cls.toFixed(3)),
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth+3,
      loadedImages:[...document.images].filter(i=>i.complete&&i.naturalWidth>0).length,
      brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).length
     };
    });
    rows.push({name,path,width,status:r?.status()??null,...data,
     imageRequests:requests.filter(t=>t==="image").length,
     scriptRequests:requests.filter(t=>t==="script").length});
    if(width===390&&(name==="home"||name==="song-natural"))
     await page.screenshot({path:output+"/"+name+"-390.png",animations:"disabled",
      fullPage:true,timeout:20000});
   }catch(error){rows.push({name,path,width,error:String(error).slice(0,250)});}
   finally{await page.close();}
  }
  await ctx.close();
 }
}finally{await browser.close();}
const notes=[
 "A single Chromium lab observation, NOT CrUX/Search Console field Core Web Vitals.",
 "LCP/CLS are observed for ~2 seconds; no reliable INP or p75 collected.",
 "Do not infer speed improvement from different cache/network conditions.",
 "Only public URLs; authenticated Owner Admin save requires a separate session."
];
const report={origin,at:new Date().toISOString(),commit:process.env.GITHUB_SHA||null,notes,rows};
await writeFile(output+"/report.json",JSON.stringify(report,null,2)+"\n");
const lines=["# SEO04 mobile/desktop lab baseline","",origin,"",
 "| Route | Width | HTTP | TTFB ms | LCP ms | CLS | Image requests | Overflow |",
 "|---|---:|---:|---:|---:|---:|---:|---|",
 ...rows.map(r=>"| "+r.name+" | "+r.width+" | "+(r.status??"error")+" | "+
  (r.ttfbMs??"—")+" | "+(r.lcpMs??"—")+" | "+(r.cls??"—")+" | "+
  (r.imageRequests??"—")+" | "+(r.horizontalOverflow===undefined?"—":r.horizontalOverflow?"YES":"no")+" |"),
 "","## Limitations",...notes.map(v=>"- "+v)];
const summary=lines.join("\n")+"\n";
await writeFile(output+"/report.md",summary);
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
console.log(summary);
