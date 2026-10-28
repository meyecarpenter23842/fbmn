import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contentStore } from "../lib/content/data.ts";
import { toPublicContent } from "../lib/content/public.ts";
import { validateContactDraft } from "../lib/content/contact-validation.ts";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const evidence = () => ({source:"DEMO-source.pdf",verifiedBy:"DEMO QA",verifiedAt:"2026-10-20"});
const approved = () => ({status:"published",evidence:evidence(),approvedBy:"DEMO editor",approvedAt:"2026-10-21"});
const article = () => ({...approved(),id:"DEMO-1",slug:"demo-news",title:"DEMO news",
  summary:"DEMO summary",paragraphs:["DEMO story paragraph"],publishedAt:"2026-10-22T02:00:00.000Z",secretNote:"PRIVATE_ARTICLE"});
const promotion = () => ({...approved(),id:"DEMO-2",slug:"demo-offer",title:"DEMO offer",
  summary:"DEMO summary",detail:"DEMO details",startsAt:"2026-10-20T00:00:00.000Z",
  endsAt:"2026-10-30T23:59:59.000Z",netPrice:123456});
const dealer = () => ({...approved(),id:"DEMO-3",slug:"demo-dealer",title:"DEMO dealer",
  paragraphs:["DEMO instructions"],contactInstructions:"DEMO contact",dealerDiscount:42});
const company = () => ({...approved(),legalName:"DEMO legal",address:"DEMO address",
  phone:"+84 000 000 000",email:"demo@example.test",privateContact:"PRIVATE_PERSON"});
const seed = () => ({mode:"production",company:company(),articles:[article()],
  promotions:[promotion()],dealerInformation:dealer()});
const now = new Date("2026-10-28T00:00:00.000Z");

test("production has zero fabricated news, offers and contact fields", () => {
  assert.equal(contentStore.mode,"production");
  assert.deepEqual(toPublicContent(contentStore,now),
    {company:null,articles:[],promotions:[],dealerInformation:null});
});
test("approved content published only via field allowlist", () => {
  const output=toPublicContent(seed(),now);
  assert.equal(output.articles[0].slug,"demo-news");
  assert.equal(output.promotions[0].slug,"demo-offer");
  assert.equal(output.company.email,"demo@example.test");
  assert.equal(output.dealerInformation.title,"DEMO dealer");
  const json=JSON.stringify(output);
  for(const forbidden of ["privateContact","PRIVATE_PERSON","netPrice","123456","secretNote",
    "PRIVATE_ARTICLE","dealerDiscount","approvedBy","verifiedBy","source"]) {
    assert.equal(json.includes(forbidden),false,forbidden);
  }
});
test("unapproved/draft/unverified news and demo store never publish", () => {
  for(const modify of [
    d=>{d.articles[0].status="draft";}, d=>{d.articles[0].status="review";},
    d=>{d.articles[0].status="archived";},d=>{d.articles[0].evidence=null;},
    d=>{d.articles[0].approvedBy="";},d=>{d.articles[0].evidence.verifiedBy="";},
  ]){const d=seed();modify(d);assert.equal(toPublicContent(d,now).articles.length,0);}
  const d=seed();d.mode="demo";assert.equal(toPublicContent(d,now).articles.length,0);
});
test("future articles and inactive or expired campaigns never publish", () => {
  const d=seed();d.articles[0].publishedAt="2026-11-01T00:00:00.000Z";
  d.promotions[0].startsAt="2026-11-02T00:00:00.000Z";
  assert.equal(toPublicContent(d,now).articles.length,0);
  assert.equal(toPublicContent(d,now).promotions.length,0);
  d.promotions[0].startsAt="2026-10-01T00:00:00.000Z";
  d.promotions[0].endsAt="2026-10-27T00:00:00.000Z";
  assert.equal(toPublicContent(d,now).promotions.length,0);
});
test("duplicates, unreviewed markup and contact edits are rejected", () => {
  const d=seed();d.articles.push({...article(),id:"DEMO-4"});
  d.promotions.push({...promotion(),id:"DEMO-5"});
  assert.equal(toPublicContent(d,now).articles.length,1);
  assert.equal(toPublicContent(d,now).promotions.length,1);
  d.articles[0].paragraphs=["<script>bad</script>"];
  d.articles[1].paragraphs=["<img src=bad>"];
  d.promotions[0].detail="<iframe>bad</iframe>";
  d.promotions[1].detail="<script>bad</script>";
  assert.equal(toPublicContent(d,now).articles.length,0);
  assert.equal(toPublicContent(d,now).promotions.length,0);
  d.company.status="draft";d.dealerInformation.status="review";
  assert.equal(toPublicContent(d,now).company,null);
  assert.equal(toPublicContent(d,now).dealerInformation,null);
});
test("future contact validation requires consent and anti-spam fields", () => {
  const v={name:"DEMO person",email:"demo@example.test",message:"DEMO message longer than ten characters",
    consent:true,website:"",startedAt:10000};
  assert.deepEqual(validateContactDraft(v,14000),[]);
  assert.deepEqual(validateContactDraft(null,14000),["invalid"]);
  assert.ok(validateContactDraft({...v,consent:false},14000).includes("consent"));
  assert.ok(validateContactDraft({...v,website:"bot.invalid"},14000).includes("bot"));
  assert.ok(validateContactDraft({...v,startedAt:13000},14000).includes("timing"));
  assert.ok(validateContactDraft({...v,email:"bad"},14000).includes("email"));
});
test("PR07 routes and responsive nav exist; no fake contact submission", () => {
  for(const slug of ["gioi-thieu","tin-tuc","khuyen-mai","dai-ly","lien-he"]) {
    const source=read("app/"+slug+"/page.tsx");
    assert.match(source,/ContentShell/);
    assert.match(source,/metadata: Metadata/);
    assert.doesNotMatch(source,/DATABASE_URL|R2_SECRET|DEMO-/);
  }
  for(const slug of ["tin-tuc","khuyen-mai"]){
    const source=read("app/"+slug+"/[slug]/page.tsx");
    assert.match(source,/generateMetadata/);
    assert.match(source,/robots: \{ index: false \}/);
  }
  const contact=read("app/lien-he/page.tsx");
  assert.match(contact,/<fieldset disabled>/);
  assert.match(contact,/type="button" className="content-button" disabled/);
  assert.doesNotMatch(contact,/type="submit"|action=|onSubmit=|\/api\/contact/);
  const header=read("components/site-header.tsx");
  for(const slug of ["gioi-thieu","tin-tuc","khuyen-mai","dai-ly","lien-he"]) {
    assert.ok(header.includes('href: "/'+slug+'"'),slug);
  }
  assert.match(read("app/page.tsx"),/Điều hướng trang thông tin/);
  const css=read("app/content.css");
  assert.match(css,/@media \(max-width: 800px\)/);
  assert.doesNotMatch(css,/position:\s*fixed|bottom-nav/);
});
