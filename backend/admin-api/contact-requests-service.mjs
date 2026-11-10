// DL6 Owner inbox. Only private, permission-checked Admin routes can read PII.
const TABLE="fbmn_catalog_private.contact_requests";
const AUDIT="fbmn_catalog_private.contact_request_audit";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const ok=data=>Response.json({data},{headers:HEADERS});
const fail=(status,code)=>Response.json({error:{code}},{status,headers:HEADERS});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LIST="SELECT id::text,name,company,email,phone,province,customer_group,interests,message,"+
 "status,consent_at,created_at,updated_at FROM "+TABLE+" ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET $1";
function item(row){return {id:String(row.id),name:String(row.name),email:String(row.email),
 phone:String(row.phone),company:String(row.company),province:String(row.province),customerGroup:String(row.customer_group),interests:row.interests,message:String(row.message),
 status:String(row.status),consentAt:new Date(row.consent_at).toISOString(),
 createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString()};}
async function readJson(request){
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json"||
    Number(request.headers.get("content-length")||0)>2048)return null;
 const text=await request.text();if(text.length>2048)return null;
 try{return JSON.parse(text)}catch{return null;}
}
export async function handleContactRequests({request,actor,db}){
 const url=new URL(request.url);
 if(url.pathname!=="/v1/admin/website/contact-requests")return fail(404,"not_found");
 if(actor?.role!=="owner")return fail(403,"forbidden");
 if(!["GET","POST"].includes(request.method))return fail(405,"method_not_allowed");
 if(typeof db!=="function")return fail(503,"inbox_unavailable");
 try{
  if(request.method==="GET"){
   if([...url.searchParams.keys()].some(k=>k!=="page")||url.searchParams.getAll("page").length>1)
    return fail(400,"invalid_query");
   const page=url.searchParams.has("page")?Number(url.searchParams.get("page")):1;
   if(!Number.isSafeInteger(page)||page<1||page>100)return fail(400,"invalid_page");
   const data=await db(async client=>{
    await client.query("BEGIN");
    try{
     // 90-day minimization is performed whenever Owner reads the inbox.
     const expired=await client.query("DELETE FROM "+TABLE+
       " WHERE created_at<now()-interval '90 days' RETURNING id");
     for(const row of expired.rows)await client.query(
       "INSERT INTO "+AUDIT+"(request_id,operation,actor_subject) VALUES($1,'expire',$2)",
       [row.id,actor.subject]);
     const result=await client.query(LIST,[(page-1)*50]);
     await client.query("COMMIT");
     return {requests:result.rows.slice(0,50).map(item),page,hasMore:result.rows.length>50};
    }catch(e){await client.query("ROLLBACK");throw e;}
   });
   return ok(data);
  }
  if(url.search)return fail(400,"invalid_query");
  const body=await readJson(request);
  if(!body||typeof body!=="object"||Array.isArray(body)||
     typeof body.id!=="string"||!UUID.test(body.id)||!["set_status","delete"].includes(body.operation)||
     !["new","handled"].includes(body.expectedStatus))return fail(400,"invalid_operation");
  if(body.operation==="set_status"&&(!["new","handled"].includes(body.status)||
     Object.keys(body).some(k=>!["id","operation","expectedStatus","status"].includes(k))))
    return fail(400,"invalid_status");
  if(body.operation==="delete"&&Object.keys(body).some(k=>!["id","operation","expectedStatus"].includes(k)))
    return fail(400,"invalid_operation");
  const data=await db(async client=>{
   await client.query("BEGIN");
   try{
    const current=(await client.query("SELECT status FROM "+TABLE+" WHERE id=$1 FOR UPDATE",[body.id])).rows[0];
    if(!current){await client.query("ROLLBACK");return {error:"not_found"};}
    if(current.status!==body.expectedStatus){await client.query("ROLLBACK");return {error:"revision_conflict"};}
    if(body.operation==="delete"){
     await client.query("DELETE FROM "+TABLE+" WHERE id=$1",[body.id]);
     await client.query("INSERT INTO "+AUDIT+"(request_id,operation,actor_subject) VALUES($1,'delete',$2)",
       [body.id,actor.subject]);
     await client.query("COMMIT");return {deleted:true};
    }
    if(body.status===current.status){await client.query("COMMIT");return {id:body.id,status:current.status};}
    await client.query("UPDATE "+TABLE+" SET status=$2,updated_by=$3,updated_at=now() WHERE id=$1",
      [body.id,body.status,actor.subject]);
    await client.query("INSERT INTO "+AUDIT+"(request_id,operation,actor_subject) VALUES($1,$2,$3)",
      [body.id,body.status==="handled"?"handled":"reopen",actor.subject]);
    await client.query("COMMIT");return {id:body.id,status:body.status};
   }catch(e){await client.query("ROLLBACK");throw e;}
  });
  if(data.error)return fail(data.error==="not_found"?404:409,data.error);
  return ok(data);
 }catch{return fail(503,"inbox_unavailable");}
}
