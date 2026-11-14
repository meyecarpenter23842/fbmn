// DL8: read-only PRODUCTION browser regression; never submit real customer forms.
// Metrics are single laboratory observations, NOT field Core Web Vitals or UAT.
import {chromium,webkit} from "playwright";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import {mkdir,writeFile,appendFile} from "node:fs/promises";
const require=createRequire(import.meta.url);
const axeSource=readFileSync(require.resolve("axe-core/axe.min.js"),"utf8");
const base=process.env.DL8_BASE_URL||"https://www.fbmn.vn";
if(base!=="https://www.fbmn.vn")throw Error("Only audited, allowlisted public Futurebook origin");
const out="artifacts/dl8", rows=[],findings=[];
const all=[["home","/"],["products","/san-pham"],["catalogue","/catalogue"],
 ["dealer","/dai-ly"],["outsourcing","/gia-cong"],["contact","/lien-he"],
 ["policy","/policy"],["news","/bang-tin"],
 ["product","/san-pham/sku-3ac08ff247847c1e77bfccb0e806ed29"]];
const core=new Set(["home","products","catalogue","contact","outsourcing","product"]);
const setups=[
 {browser:"chromium",width:1440,paths:all},
 {browser:"chromium",width:390,paths:all},
 {browser:"chromium",width:768,paths:all.filter(x=>core.has(x[0]))},
 {browser:"chromium",width:360,paths:all.filter(x=>["home","contact","catalogue"].includes(x[0]))},
 {browser:"webkit",width:1280,paths:all.filter(x=>core.has(x[0]))},
 {browser:"webkit",width:360,paths:all.filter(x=>core.has(x[0]))}
];
await mkdir(out,{recursive:true});
const opened={};
try{
 for(const setup of setups){
  const key=setup.browser;
  if(!opened[key])opened[key]=await (key==="chromium"?chromium:webkit).launch({headless:true});
  const context=await opened[key].newContext({viewport:{width:setup.width,height:850},
   locale:"vi-VN",reducedMotion:"reduce",deviceScaleFactor:1,
   isMobile:setup.width<=390,hasTouch:setup.width<=390});
  for(const [name,path] of setup.paths){
   const page=await context.newPage(),issues=[];
   let blockedWrites=0,imageRequests=0;
   // read-only: block ALL writes, including PostHog event capture. These tests
   // must not create leads, push receipts, chat turns, email or marketing events.
   await page.route("**/*",route=>{
    if(["POST","PUT","PATCH","DELETE"].includes(route.request().method())){
     blockedWrites++;return route.abort();
    }
    return route.continue();
   });
   page.on("request",request=>{if(request.resourceType()==="image")imageRequests++;});
   page.on("pageerror",error=>issues.push(String(error.message).slice(0,180)));
   await page.addInitScript(()=>{
    window.__dl8={lcp:null,cls:0};
    try{
     new PerformanceObserver(list=>{
      for(const e of list.getEntries())window.__dl8.lcp=Math.round(e.startTime);
     }).observe({type:"largest-contentful-paint",buffered:true});
     new PerformanceObserver(list=>{
      for(const e of list.getEntries())if(!e.hadRecentInput)window.__dl8.cls+=e.value;
     }).observe({type:"layout-shift",buffered:true});
    }catch{}
   });
   try{
    const response=await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:35000});
    await page.waitForTimeout(1100);
    const actual=await page.evaluate(()=>{
     const nav=performance.getEntriesByType("navigation")[0];
     return {title:document.title,
      canonical:document.querySelector('link[rel="canonical"]')?.href||"",
      metaRobots:document.querySelector('meta[name="robots"]')?.content||"",
      h1:document.querySelectorAll("h1").length,
      overflow:document.documentElement.scrollWidth>window.innerWidth+3,
      brokenImages:[...document.images].filter(x=>x.complete&&x.currentSrc&&!x.naturalWidth).length,
      loadedImages:[...document.images].filter(x=>x.complete&&x.naturalWidth>0).length,
      ttfbMs:nav?Math.round(nav.responseStart):null,
      lcpMs:window.__dl8.lcp,
      cls:Number(window.__dl8.cls.toFixed(3)),
      contactFields:document.querySelector('form.content-contact-form')
        ?{provinces:document.querySelectorAll('form.content-contact-form select option').length,
          consent:!!document.querySelector('form.content-contact-form input[type="checkbox"][required]')}
        :null
     };
    });
    const item={browser:key,width:setup.width,name,path,status:response?.status()??null,
     ...actual,imageRequests,blockedWrites,pageErrors:issues};
    if(item.status!==200)findings.push({severity:item.status>=500?"P0":"P1",
     location:key+" "+setup.width+" "+path,detail:"HTTP "+item.status});
    if(item.overflow)findings.push({severity:"P1",location:key+" "+setup.width+" "+path,
     detail:"Document viewport horizontal overflow"});
    if(item.brokenImages)findings.push({severity:"P2",location:key+" "+setup.width+" "+path,
     detail:String(item.brokenImages)+" broken loaded images"});
    if(issues.length)findings.push({severity:"P2",location:key+" "+setup.width+" "+path,
     detail:"Runtime page errors: "+issues.slice(0,2).join(" | ")});
    if(name==="contact"&&item.contactFields&&
      (item.contactFields.provinces<35||!item.contactFields.consent))
     findings.push({severity:"P1",location:key+" "+setup.width+" "+path,
      detail:"Contact form is missing 34-province selector or required consent"});
    if(core.has(name)&&[360,390,1280,1440].includes(setup.width)){
     try{
      await page.addScriptTag({content:axeSource});
      const violations=await page.evaluate(async()=>{
       const report=await window.axe.run(document,{runOnly:{
        type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa"]}});
       return report.violations.map(v=>({id:v.id,impact:v.impact,
        nodes:v.nodes.length,description:v.description.slice(0,130)}));
      });
      item.axe=violations;
      for(const violation of violations)
       findings.push({severity:["critical","serious"].includes(violation.impact)?"P1":"P2",
        location:key+" "+setup.width+" "+path,
        detail:"A11y "+violation.id+" ("+violation.impact+"): "+violation.nodes+" elements"});
     }catch(e){findings.push({severity:"UNVERIFIED",location:key+" "+path,
      detail:"axe scan failed: "+String(e).slice(0,150)});}
    }
    rows.push(item);
    if(["home","products","catalogue","contact"].includes(name)&&[360,390,1440].includes(setup.width))
     await page.screenshot({path:out+"/"+key+"-"+name+"-"+setup.width+".png",
      animations:"disabled",timeout:15000}).catch(()=>{});
   }catch(e){rows.push({browser:key,width:setup.width,name,path,error:String(e).slice(0,220)});
    findings.push({severity:"P1",location:key+" "+setup.width+" "+path,
     detail:"Browser navigation failed: "+String(e).slice(0,150)});
   }finally{await page.close();}
  }
  await context.close();
 }
}finally{
 for(const browser of Object.values(opened))await browser.close();
}
const totals={pages:rows.length,p0:findings.filter(x=>x.severity==="P0").length,
 p1:findings.filter(x=>x.severity==="P1").length,
 p2:findings.filter(x=>x.severity==="P2").length,
 unverified:findings.filter(x=>x.severity==="UNVERIFIED").length};
const report={generatedAt:new Date().toISOString(),base,commit:process.env.GITHUB_SHA||null,
 notes:["READ ONLY: all non-GET requests blocked; no customer lead, chat, email, receipt or analytics event submitted.",
  "One Chromium/WebKit laboratory observation per page; not a Safari/iPhone device UAT.",
  "LCP, CLS and TTFB are rough local observations; no CrUX p75 or INP claim.",
  "Axe WCAG violations require human review; automated tests cannot prove accessibility.",
  "Browser results reflect live production, which may be older than this PR."],
 totals,rows,findings};
await writeFile(out+"/report.json",JSON.stringify(report,null,2)+"\n");
const lines=["# DL8 public Website browser regression", "",
 "Audit: "+report.generatedAt, "Site: "+base,"Source: "+(report.commit||"unknown"),"",
 "Browsers: Chromium + WebKit; 360, 390, 768, 1280, 1440 px; reduced motion.",
 "Total observations: "+totals.pages+"; P0="+totals.p0+" P1="+totals.p1+" P2="+totals.p2+" unverified="+totals.unverified,"",
 "| Browser | Width | Page | HTTP | TTFB (ms) | LCP (ms) | CLS | Overflow | Broken images |",
 "|---|---:|---|---:|---:|---:|---:|---|---:|",
 ...rows.map(r=>"| "+r.browser+" | "+r.width+" | "+r.name+
  " | "+(r.status??"error")+" | "+(r.ttfbMs??"—")+" | "+(r.lcpMs??"—")+
  " | "+(r.cls??"—")+" | "+(r.overflow===undefined?"—":r.overflow?"YES":"no")+
  " | "+(r.brokenImages??"—")+" |"),
 "","## Findings",...findings.slice(0,100).map(f=>"- **"+f.severity+"** "+f.location+": "+f.detail),
 "","## Limitations",...report.notes.map(x=>"- "+x)];
const markdown=lines.join("\n")+"\n";
await writeFile(out+"/report.md",markdown);
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,markdown.slice(0,50000));
console.log(markdown.slice(0,14000));
// Fail only for outages of known public pages, not advisory accessibility/perf data.
if(rows.some(x=>x.error||x.status>=500||x.status===404))process.exitCode=1;
