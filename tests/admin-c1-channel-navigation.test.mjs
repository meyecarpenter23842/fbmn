import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const page=readFileSync("apps/admin/app/page.tsx","utf8");
const navCss=readFileSync("apps/admin/app/admin-l01-navigation.css","utf8");
const roadmap=readFileSync("docs/roadmap.md","utf8");

test("C1 groups existing Website CMS screens underneath one channel heading",()=>{
  assert.match(roadmap,/C1 — Sắp xếp navigation Admin/);
  assert.match(page,/const websiteSections: Array<\{key:Section;label:string;icon:GlyphName\}>/);
  assert.match(page,/\{key:"banners",label:"Banner & Popup",icon:"image"\}/);
  assert.match(page,/\{key:"content",label:"Tin tức & Khuyến mãi",icon:"file"\}/);
  assert.match(page,/<span>Website Futurebook<\/span>/);
  assert.match(page,/aria-controls="website-navigation" aria-expanded=\{websiteMenuExpanded\}/);
  assert.match(page,/id="website-navigation" className=\{\s*"side-submenu-motion"/);
  assert.match(page,/aria-hidden=\{!websiteMenuExpanded\} inert=\{!websiteMenuExpanded\}/);
  assert.match(page,/aria-hidden=\{!productMenuExpanded\} inert=\{!productMenuExpanded\}/);
  assert.doesNotMatch(page,/\{websiteMenuExpanded&&<div/);
  assert.match(page,/websiteSections\.map\(item=>/);
  assert.doesNotMatch(page,/menu\.filter\(item=>\["pricing","banners","content"\]\.includes\(item\.key\)\)/);
  assert.match(page,/menu\.filter\(item=>item\.key==="pricing"\)/);
});

test("C1 preserves both live CMS managers, SKU and price workspaces",()=>{
  assert.match(page,/section==="banners"&&<CmsManager mode="marketing" owner=\{session\?\.role==="owner"\}\/>/);
  assert.match(page,/section==="content"&&<CmsManager mode="editorial" owner=\{session\?\.role==="owner"\}\/>/);
  assert.match(page,/section==="pricing"&&<CatalogueSideWorkspace mode="pricing" onBusyChange=\{setWorkspaceOperationBusy\}\/>/);
  assert.match(page,/section==="media"&&<CatalogueSideWorkspace mode="media" onBusyChange=\{setWorkspaceOperationBusy\}\/>/);
  for(const section of ["products","structure","media","import-products"])
    assert.ok(page.includes('key:"'+section+'"'),"missing common product menu: "+section);
  assert.match(page,/if\(workspaceOperationBusy&&\["media","pricing"\]\.includes\(section\)&&to!==section\)return/);
  assert.match(page,/if\(\["banners","content"\]\.includes\(to\)\)\s*setWebsiteMenuExpanded\(true\)/);
  assert.match(page,/\["banners","content","home-layout","app-download"\]\.includes\(section\)\?"Website Futurebook":"Quản trị"/);
  assert.match(page,/banners:"Banner & Popup",content:"Tin tức & Khuyến mãi"/);
});

test("C1 maintains accessible active states and shared mobile control dimensions",()=>{
  assert.match(page,/aria-current=\{section===item\.key\?"page":undefined\}/);
  assert.match(page,/aria-controls="product-navigation" aria-expanded=\{productMenuExpanded\}/);
  assert.match(page,/aria-controls="website-navigation" aria-expanded=\{websiteMenuExpanded\}/);
  assert.match(page,/onClick=\{\(\)=>navigate\(item\.key\)\}/);
  assert.match(navCss,/\.side-sub-link\{[^}]*font-size:13px/s);
  assert.match(navCss,/@media\(max-width:780px\)\{\.side-group-heading,\.side-sub-link\{min-height:44px\}\}/);
  assert.match(navCss,/\.side-submenu-motion\{display:grid;grid-template-rows:0fr;opacity:0;overflow:hidden/);
  assert.match(navCss,/\.side-submenu-motion\.is-expanded\{grid-template-rows:1fr;opacity:1\}/);
  assert.match(navCss,/--fb-motion-menu,200ms/);
  assert.match(navCss,/@media\(prefers-reduced-motion:reduce\)[^\n]*side-submenu-motion/);
  assert.doesNotMatch(page,/setChannelTargets|setSelectedChannel/);
});
