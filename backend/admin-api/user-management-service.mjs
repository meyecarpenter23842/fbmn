import {allowed,PERMISSIONS,CHANNELS,ROLES,validStaffPayload} from "./user-permissions.mjs";
const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
const fail=(status,code)=>reply(status,{error:{code}});
function staffError(error){
 if(error?.code==="40001"||error?.code==="23505")return fail(409,"version_conflict");
 if(error?.code==="P0002")return fail(404,"auth_user_not_found");
 if(error?.code==="22023"||error?.code==="22P02"||error?.code==="23503")return fail(400,"invalid_grant");
 if(error?.code==="42501")return fail(403,"forbidden");
 return fail(503,"users_unavailable");
}
export async function handleStaffUsers({request,actor,db}){
 if(!allowed(actor,"admin.users.manage"))return fail(403,"forbidden");
 const path=new URL(request.url).pathname;
 if(path==="/v1/admin/users" && request.method==="GET"){
   try{
     const result=await db(client=>client.query("SELECT fbmn_admin.user01_list_staff($1) AS users",[actor.subject]));
     return reply(200,{data:{users:result.rows?.[0]?.users??[],roles:ROLES,permissions:PERMISSIONS,channels:CHANNELS}});
   }catch(error){return staffError(error);}
 }
 if(!["/v1/admin/users","/v1/admin/users/preflight"].includes(path)||
    !["POST","PATCH"].includes(request.method))return fail(405,"method_not_allowed");
 if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))return fail(415,"invalid_content_type");
 let body;
 try{
   const raw=await request.text();
   if(raw.length>12000)return fail(413,"payload_too_large");
   body=JSON.parse(raw);
 }catch{return fail(400,"invalid_json");}
 const update=request.method==="PATCH";
 if(!validStaffPayload(body,{update})||
    typeof body.email!=="string"||body.email.length>200||
    !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(body.email)||
    (update&&typeof body.name!=="undefined"))return fail(400,"invalid_grant");
 if(path.endsWith("/preflight"))return update?fail(405,"method_not_allowed"):reply(200,{data:{allowed:true}});
 try{
   const result=await db(client=>client.query(
     "SELECT fbmn_admin.user01_save_staff($1,$2,$3,$4,$5::text[],$6::text[],$7::integer) AS saved",
     [actor.subject,body.email.trim().toLowerCase(),body.role,body.enabled,body.permissions,body.channels,update?body.revision:null]
   ));
   return reply(200,{data:result.rows?.[0]?.saved});
 }catch(error){return staffError(error);}
}
