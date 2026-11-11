// CEO-MAIL01: narrow input contract; never let callers choose provider URLs or sender identity.
const EMAIL=/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MAIL_FROM="info@fbmn.vn";
export function addressOf(value){
 if(typeof value!=="string"||value.length>320||/[\r\n]/.test(value))return null;
 const input=value.trim();
 const address=input.includes("<")&&input.endsWith(">")?
   input.slice(input.lastIndexOf("<")+1,-1).trim():input;
 return EMAIL.test(address)?address.toLowerCase():null;
}
export function parseMailboxQuery(search){
 const q=new URLSearchParams(search.startsWith("?")?search.slice(1):search);
 if([...q.keys()].some(k=>!["box","after","limit"].includes(k)||q.getAll(k).length!==1))return null;
 const box=q.get("box")||"inbox",limit=q.get("limit")||"20",after=q.get("after");
 if(!["inbox","sent"].includes(box)||!/^(?:[1-9]|1[0-9]|20)$/.test(limit)||
 (after!==null&&!UUID.test(after)))return null;
 return {box,limit:Number(limit),after:after?.toLowerCase()||null};
}
export function parseMailDetail(box,id){
 if(!["inbox","sent"].includes(box)||!UUID.test(id))return null;
 return {box,id:id.toLowerCase()};
}
export function parseMailSend(raw){
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||
   Object.keys(raw).some(k=>!["to","subject","text","replyId","requestId"].includes(k)))return null;
 const text=raw.text,subject=raw.subject,replyId=raw.replyId,requestId=raw.requestId;
 if(typeof text!=="string"||!text.trim()||text.length>12000||
   typeof subject!=="string"||!subject.trim()||(!replyId&&subject.length>180)||(replyId&&subject.length>2000)||
   /[\r\n]/.test(subject)||raw.to!==undefined&&typeof raw.to!=="string"||
   replyId!==undefined&&(!UUID.test(replyId)||typeof replyId!=="string")||
   requestId!==undefined&&(typeof requestId!=="string"||!/^[a-z0-9_-]{12,100}$/i.test(requestId)))return null;
 const to=replyId?null:addressOf(raw.to);
 if(!replyId&&!to)return null;
 return {to,subject:subject.trim(),text:text.trim(),replyId:replyId||null,requestId:requestId||null};
}
export function isCompanyMailbox(item,box){
 if(!item||typeof item!=="object")return false;
 if(box==="inbox")return ["to","cc","bcc"].some(field=>
  Array.isArray(item[field])&&item[field].some(x=>addressOf(x)===MAIL_FROM));
 return addressOf(item.from)===MAIL_FROM;
}
export function escapeMailHtml(text){
 return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
export const MAIL_FACEBOOK="https://www.facebook.com/futurebook.miennam";
export const MAIL_LOGO="https://www.fbmn.vn/brand/fbmn-transparent-logo.webp";
export function mailSignatureHtml(content){
 const body=escapeMailHtml(content).replace(/\n/g,"<br>");
 return '<div style="font:14px/1.65 Arial,sans-serif;color:#242034;max-width:620px">'+
  '<div style="white-space:normal">'+body+'</div>'+
  '<table role="presentation" cellspacing="0" cellpadding="0" style="border-top:1px solid #e5d7f1;margin-top:28px;padding-top:16px;width:100%"><tr>'+
  '<td style="vertical-align:top;width:140px;padding-right:14px"><img src="'+MAIL_LOGO+
  '" alt="Futurebook Miền Nam" width="132" style="display:block;max-width:100%;height:auto;border:0"></td>'+
  '<td style="vertical-align:top;font:12px/1.65 Arial,sans-serif;color:#5b5266">'+
  '<strong style="font-size:14px;color:#6d249e">FUTUREBOOK MIỀN NAM</strong><br>'+
  '1092A Lê Đức Anh (QL01A), P. Tân Tạo, TP. Hồ Chí Minh<br>'+
  'Email: <a href="mailto:info@fbmn.vn" style="color:#6d249e">info@fbmn.vn</a><br>'+
  'Website: <a href="https://www.fbmn.vn" style="color:#6d249e">www.fbmn.vn</a><br>'+
  '<a href="'+MAIL_FACEBOOK+'" style="color:#6d249e;text-decoration:none">'+
  '<span style="display:inline-block;background:#1877F2;color:#fff;border-radius:4px;width:17px;line-height:17px;text-align:center;font-weight:bold">f</span>&nbsp; Facebook Futurebook</a>'+
  '</td></tr></table></div>';
}
export function mailSignatureText(content){
 return content+'\n\n---\nFUTUREBOOK MIỀN NAM\n1092A Lê Đức Anh (QL01A), P. Tân Tạo, TP. Hồ Chí Minh\ninfo@fbmn.vn | https://www.fbmn.vn\nFacebook: '+MAIL_FACEBOOK;
}

export function plainTextFromHtml(html){
 if(typeof html!=="string")return "";
 return html.slice(0,250000)
  .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi," ")
  .replace(/<\s*br\s*\/?>/gi,"\n")
  .replace(/<\s*\/(p|div|tr|li|h[1-6])\s*>/gi,"\n")
  .replace(/<[^>]*>/g," ")
  .replace(/&nbsp;/gi," ").replace(/&lt;/gi,"<")
  .replace(/&gt;/gi,">").replace(/&quot;/gi,'"')
  .replace(/&#39;|&apos;/gi,"'").replace(/&amp;/gi,"&")
  .replace(/\n[ \t]+/g,"\n").replace(/\n{3,}/g,"\n\n").trim().slice(0,80000);
}
