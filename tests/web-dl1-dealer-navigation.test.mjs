import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const header=source("components/site-header.tsx"),footer=source("components/site-footer.tsx");
const css=source("app/rebaseline.css");

test("DL1 top navigation has exactly six Owner-approved links in order",()=>{
 const nav=header.split("const desktopNavigation = [")[1]?.split("] as const;")[0];
 assert.ok(nav,"Main menu definition must exist");
 assert.deepEqual([...nav.matchAll(/label: "([^"]+)"/g)].map(m=>m[1]),[
  "Trang chủ","Sản phẩm","Gia công","Bảng tin","Catalogue","Liên hệ"
 ]);
 assert.deepEqual([...nav.matchAll(/href: "([^"]+)"/g)].map(m=>m[1]),[
  "/#home","/san-pham","/gia-cong","/bang-tin","/catalogue","/lien-he"
 ]);
 assert.doesNotMatch(nav,/Giới thiệu|Khuyến mãi|Dành cho đại lý|Tin tức/);
 assert.doesNotMatch(header,/<Link className="ref-navigation__catalog"/);
 assert.doesNotMatch(header,/<AppDownloadMenuButton/);
 assert.match(header,/href="\/lien-he#thong-tin-lien-he"/);
 assert.match(header,/ref-navigation__dealer-cta-mobile/);
 assert.match(header,/aria-current=\{active \? "page" : undefined\}/);
});

test("DL1 preserves live SKU search and highlights editorial legacy paths",()=>{
 assert.match(header,/action="\/san-pham" method="get"/);
 assert.match(header,/name="q"/);
 assert.match(header,/item\.href === "\/bang-tin" \? pathname === "\/bang-tin"/);
 assert.match(header,/pathname\.startsWith\("\/tin-tuc"\)/);
 assert.match(header,/pathname\.startsWith\("\/khuyen-mai"\)/);
 assert.match(header,/pathname\.startsWith\("\/danh-muc\/"\)/);
 assert.doesNotMatch(header,/Giỏ hàng chưa mở|Tài khoản sẽ mở khi/);
 assert.match(source("app/layout.tsx"),/<AppDownloadProvider>/);
 assert.match(footer,/<AppDownloadMenuButton/);
});

test("DL1 dealer-friendly landing pages use honest approved links and existing SiteShell",()=>{
 const targets=[
  ["app/gia-cong/page.tsx","Gia công",["/san-pham","/lien-he#thong-tin-lien-he"]],
  ["app/bang-tin/page.tsx","Bảng tin",["/tin-tuc","/khuyen-mai"]],
  ["app/catalogue/page.tsx","Catalogue",["/san-pham","/lien-he#thong-tin-lien-he"]]
 ];
 for(const [path,title,links] of targets){
  const html=source(path);
  assert.match(html,/<ContentShell>/);
  assert.match(html,/metadata: Metadata/);
  assert.ok(html.includes(title),path);
  assert.match(html,/<PageHeading/);
  assert.match(html,/<ContentBreadcrumb/);
  for(const link of links)assert.ok(html.includes('href="'+link+'"'),path+" "+link);
  assert.doesNotMatch(html,/https?:\/\/.*\.pdf|NET_PRICE|R2_SECRET|<form/);
 }
 const contact=source("app/lien-he/page.tsx");
 assert.match(contact,/id="thong-tin-lien-he"/);
 assert.match(contact,/fieldset disabled/);
 assert.match(contact,/Fanpage/);
 for(const old of ["app/dai-ly/page.tsx","app/gioi-thieu/page.tsx","app/tin-tuc/page.tsx","app/khuyen-mai/page.tsx"])
  assert.match(source(old),/<ContentShell>/,old);
 assert.match(source("app/dai-ly/page.tsx"),/href="\/lien-he#thong-tin-lien-he"/);
});

test("DL1 theme, mobile access, reduced motion and secondary app discovery remain intact",()=>{
 assert.match(css,/\.ref-header__dealer-cta\s*\{[^}]*var\(--fb-control-height-compact\)/s);
 assert.match(css,/\.ref-navigation__dealer-cta-mobile\s*\{[^}]*var\(--fb-control-height-touch\)/s);
 assert.match(css,/\.ref-navigation__dealer-cta-mobile:focus-visible/);
 assert.match(css,/\.ref-navigation__link--active/);
 assert.match(css,/\.ref-navigation--open/);
 assert.match(css,/prefers-reduced-motion: reduce/);
 assert.match(footer,/href="\/gia-cong"/);
 assert.match(footer,/href="\/bang-tin"/);
 assert.match(footer,/href="\/catalogue"/);
 assert.match(footer,/href="\/dai-ly"/);
 assert.match(footer,/href="\/gioi-thieu"/);
 assert.doesNotMatch(header+footer,/NET_PRICE|r2_key|pricebook/i);
});
