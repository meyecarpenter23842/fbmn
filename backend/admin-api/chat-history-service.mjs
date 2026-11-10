// DL10C: private transcript only; never persist request headers, Google payloads or credentials.
const C="fbmn_catalog_private.chat_conversations", T="fbmn_catalog_private.chat_turns";
const SESSION=/^[0-9a-f]{36}$/;
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const ok=data=>Response.json({data},{headers:HEADERS});
const fail=(status,code)=>Response.json({error:{code}},{status,headers:HEADERS});
// Defensive redaction for common credential and IP formats in free text. No metadata is collected.
export function safeChatText(value,max){
 return value.replace(/[\u0000]/g,"")
  .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*/gi,"[đã ẩn]")
  .replace(/(?:private_key|access_token|refresh_token|authorization|password|mật khẩu)\s*["']?\s*[:=]\s*["']?[^\s,}]+/gi,"[đã ẩn]")
  .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi,"[đã ẩn]")
  .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,"[đã ẩn]")
  .replace(/\bya29\.[A-Za-z0-9_-]+/g,"[đã ẩn]")
  .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g,"[đã ẩn]")
  .replace(/(?<![A-Za-z0-9])(?:[a-f0-9]{0,4}:){2,}[a-f0-9:]{0,39}(?![A-Za-z0-9])/gi,"[đã ẩn]")
  .trim().slice(0,max)||"[đã ẩn]";
}
export async function saveChatTurn(client,{session,question,answer}){
 if(!SESSION.test(session))throw Error("invalid_session");
 // One atomic statement: parent upsert and turn insert, no partial transcript.
 await client.query("WITH conversation AS (INSERT INTO "+C+"(session_id) VALUES($1) "+
  "ON CONFLICT(session_id) DO UPDATE SET updated_at=now() RETURNING session_id) "+
  "INSERT INTO "+T+"(session_id,question,answer) SELECT session_id,$2,$3 FROM conversation",
  [session,safeChatText(question,300),answer===null?null:safeChatText(answer,3000)]);
}
const date=v=>new Date(v).toISOString();
function day(v){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return null;
 const d=new Date(v+"T00:00:00Z");
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v?v:null;
}
function parseQuery(url){
 const q=url.searchParams,allowed=["page","q","from","to","session"];
 if([...q.keys()].some(k=>!allowed.includes(k)||q.getAll(k).length!==1))return null;
 const page=q.has("page")?Number(q.get("page")):1,search=(q.get("q")||"").trim();
 const from=q.get("from"),to=q.get("to"),session=q.get("session");
 if(!Number.isSafeInteger(page)||page<1||page>10000||search.length>100||
  (from!==null&&!day(from))||(to!==null&&!day(to))||(from&&to&&from>to)||
  (session!==null&&(!SESSION.test(session)||q.has("q")||from!==null||to!==null)))return null;
 return {page,search,from,to,session};
}
export async function handleChatHistory({request,actor,db}){
 const url=new URL(request.url);
 if(url.pathname!=="/v1/admin/website/chat-history")return fail(404,"not_found");
 if(actor?.role!=="owner")return fail(403,"forbidden");
 if(!["GET","POST"].includes(request.method))return fail(405,"method_not_allowed");
 if(typeof db!=="function")return fail(503,"history_unavailable");
 try{
  if(request.method==="POST"){
   if(url.search||request.headers.get("content-type")?.split(";")[0]!=="application/json"||
    Number(request.headers.get("content-length")||0)>512)return fail(400,"invalid_request");
   const raw=await request.text();if(raw.length>512)return fail(400,"invalid_request");
   let body;try{body=JSON.parse(raw)}catch{return fail(400,"invalid_request");}
   if(!body||Object.keys(body).length!==2||body.operation!=="delete"||
    typeof body.session!=="string"||!SESSION.test(body.session))return fail(400,"invalid_request");
   const deleted=await db(async client=>(await client.query("DELETE FROM "+C+" WHERE session_id=$1 RETURNING session_id",[body.session])).rows.length===1);
   return deleted?ok({deleted:true}):fail(404,"not_found");
  }
  const filter=parseQuery(url);if(!filter)return fail(400,"invalid_query");
  const {page,search,from,to,session}=filter;
  if(session){
   const data=await db(async client=>{
    const rows=(await client.query("SELECT id::text,question,answer,created_at FROM "+T+
     " WHERE session_id=$1 ORDER BY id LIMIT 26 OFFSET $2",[session,(page-1)*25])).rows;
    const exists=rows.length>0||(await client.query("SELECT session_id FROM "+C+" WHERE session_id=$1",[session])).rows.length>0;
    return exists?{session,page,hasMore:rows.length>25,turns:rows.slice(0,25).map(row=>({id:row.id,question:row.question,answer:row.answer,createdAt:date(row.created_at)}))}:null;
   });
   return data?ok(data):fail(404,"not_found");
  }
  const data=await db(async client=>{
   const rows=(await client.query("SELECT c.session_id,c.created_at,c.updated_at, "+
    "(SELECT count(*)+count(answer) FROM "+T+" WHERE session_id=c.session_id)::int AS message_count, "+
    "(SELECT left(coalesce(answer,question),240) FROM "+T+" WHERE session_id=c.session_id ORDER BY id DESC LIMIT 1) AS latest "+
    "FROM "+C+" c WHERE ($1::text='' OR strpos(c.session_id,lower($1))>0 OR EXISTS "+
    "(SELECT 1 FROM "+T+" t WHERE t.session_id=c.session_id AND "+
    "(to_tsvector('simple'::regconfig,t.question || ' ' || coalesce(t.answer,'')) @@ plainto_tsquery('simple'::regconfig,$1) "+
    "OR strpos(lower(t.question || ' ' || coalesce(t.answer,'')),lower($1))>0))) "+
    "AND ($2::date IS NULL OR c.updated_at >= ($2::date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')) "+
    "AND ($3::date IS NULL OR c.updated_at < (($3::date+1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')) "+
    "ORDER BY c.updated_at DESC,c.session_id LIMIT 31 OFFSET $4",[search,from,to,(page-1)*30])).rows;
   return {page,hasMore:rows.length>30,conversations:rows.slice(0,30).map(row=>({session:row.session_id,createdAt:date(row.created_at),updatedAt:date(row.updated_at),messageCount:row.message_count,latest:row.latest}))};
  });
  return ok(data);
 }catch{return fail(503,"history_unavailable");}
}
