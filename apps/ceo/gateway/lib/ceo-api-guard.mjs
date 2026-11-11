// No generic proxy URLs or actions. CEO DL12A is read-only.
const sections=new Set(["chat-history","contact-requests","outsourcing-requests"]);
const SESSION=/^[a-f0-9]{36}$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const day=s=>{if(!DATE.test(s))return false;const d=new Date(s+"T00:00:00Z");return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===s;};
export function ceoReadTarget(section,search){
 if(!sections.has(section)||typeof search!=="string"||search.length>600)return null;
 const q=new URLSearchParams(search.startsWith("?")?search.slice(1):search);
 const allowed=section==="chat-history"?new Set(["page","session","q","from","to"]):new Set(["page"]);
 if([...q.keys()].some(k=>!allowed.has(k)||q.getAll(k).length!==1))return null;
 const page=q.get("page")||"1";
 if(!/^[1-9][0-9]{0,2}$/.test(page)||Number(page)>(section==="chat-history"?999:100))return null;
 if(section==="chat-history"){
  const sid=q.get("session"),term=q.get("q"),from=q.get("from"),to=q.get("to");
  if(sid&&(!SESSION.test(sid)||term!==null||from!==null||to!==null))return null;
  if(term!==null&&term.length>100)return null;
  if((from!==null&&!day(from))||(to!==null&&!day(to))||(from&&to&&from>to))return null;
 }
 return "/v1/admin/website/"+section+(q.size?"?"+q.toString():"");
}
