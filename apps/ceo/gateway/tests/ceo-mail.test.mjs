import test from "node:test";
import assert from "node:assert/strict";
import {addressOf,parseMailboxQuery,parseMailDetail,parseMailSend,
 isCompanyMailbox,mailSignatureHtml,mailSignatureText,MAIL_FACEBOOK,MAIL_LOGO,MAIL_MAX_REQUEST_BYTES,readBoundedMailBody} from "../lib/ceo-mail-policy.mjs";
test("CEO-MAIL01 enforces bounded filters",()=>{
 assert.deepEqual(parseMailboxQuery("?box=inbox&limit=20"),{box:"inbox",limit:20,after:null});
 for(const invalid of ["?box=../../admin","?box=sent&box=inbox","?limit=99","?token=secret","?after=wrong"])
  assert.equal(parseMailboxQuery(invalid),null);
 assert.equal(parseMailDetail("sent","../../../passwd"),null);
});
test("CEO-MAIL01 validates recipient, subject, body, reply ids and disallows spoofing",()=>{
 const correct=parseMailSend({to:"customer@example.com",subject:"Báo giá",text:"Xin chào"});
 assert.equal(correct.to,"customer@example.com");
 for(const body of [
  {to:"wrong",subject:"Hi",text:"Message"},
  {to:"a@example.com",subject:"Hi\nBCC:x@y.com",text:"Hi"},
  {to:"a@example.com",subject:"Hi",text:"Hi",from:"evil@example.com"},
  {to:"a@example.com",subject:"Hi",text:""},
  {to:"a@example.com",subject:"Hi",text:"Message",replyId:"wrong"}
 ])assert.equal(parseMailSend(body),null);
 assert.equal(addressOf("Customer <customer@example.com>"),"customer@example.com");
 assert.equal(addressOf("x@example.com\r\nBcc:bad@example.com"),null);
});
test("CEO-MAIL01 provider mailbox scope and branded html are safe",()=>{
 assert.equal(isCompanyMailbox({to:["info@fbmn.vn"]},"inbox"),true);
 assert.equal(isCompanyMailbox({to:["other@fbmn.vn"]},"inbox"),false);
 assert.equal(isCompanyMailbox({to:["person@example.com"],cc:["info@fbmn.vn"]},"inbox"),true);
 assert.equal(isCompanyMailbox({to:["person@example.com"],bcc:["info@fbmn.vn"]},"inbox"),true);
 const reply=parseMailSend({replyId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",subject:"Re: "+"a".repeat(600),text:"OK"});
 assert.ok(reply&&reply.replyId);
 assert.equal(isCompanyMailbox({from:"Futurebook <info@fbmn.vn>"},"sent"),true);
 const html=mailSignatureHtml('<script>alert("x")</script>\nKiểm tra');
 assert.ok(!html.includes("<script>"));
 assert.ok(html.includes("&lt;script&gt;"));
 assert.ok(html.includes(MAIL_LOGO)&&html.includes(MAIL_FACEBOOK));
 assert.match(mailSignatureText("Test"),/info@fbmn\.vn/);
});

test("CEO-MAIL01 accepts allowed Vietnamese Unicode drafts within the bounded UTF-8 request budget",async()=>{
 const payload={to:"agent@example.com",subject:"Yêu cầu báo giá",text:"ệ".repeat(9000)};
 assert.ok(parseMailSend(payload));
 const json=JSON.stringify(payload);
 assert.ok(Buffer.byteLength(json,"utf8")>18000);
 assert.ok(Buffer.byteLength(json,"utf8")<MAIL_MAX_REQUEST_BYTES);
 const request=new Request("https://ceo.fbmn.vn/api/ceo/mail",{method:"POST",body:json});
 assert.deepEqual(await readBoundedMailBody(request),{text:json});
 const tooLarge=new Request("https://ceo.fbmn.vn/api/ceo/mail",{
  method:"POST",body:JSON.stringify({...payload,text:"ệ".repeat(50000)})});
 assert.deepEqual(await readBoundedMailBody(tooLarge),{tooLarge:true});
});
