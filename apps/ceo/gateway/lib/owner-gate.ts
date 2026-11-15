import "server-only";
import {ceoAuth} from "./auth-server";
import {readBearerJwt} from "./bearer-jwt.mjs";
import {ceoScope,canAccessCeo} from "./ceo-user01-scope.mjs";
type Gate={status:number;token?:string;subject?:string;role?:string;permissions?:string[]};
const JWT=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
export function workerOrigin():string|null{
 try{const url=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return url.protocol==="https:"&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==="/"?url.origin:null;
 }catch{return null;}
}
/** Short-lived same-origin Neon browser bearer (or server cookie fallback) -> Worker.
 * The Worker verifies JWT and Owner DB grants. Never log or persist credentials. */
export async function requireOwner(request?:Request,verifiedScope?:string):Promise<Gate>{
 const base=workerOrigin();
 if(!base)return {status:503};
 // Prefer same-origin, in-memory Neon JWT provided by the Flutter client,
 // matching the working Futurebook Admin flow. The Worker validates claims
 // and queries actual Owner grants; never authorize using client JWT claims.
 const supplied=request?.headers.get("authorization");
 if(supplied!==null&&supplied!==undefined&&!readBearerJwt(supplied))
  return {status:401};
 let jwt=readBearerJwt(supplied)||"";
 if(!jwt){
  const auth=ceoAuth();
  if(!auth)return {status:503};
  try{const response=await auth.token();jwt=response.data?.token||"";}
  catch{return {status:401};}
 }
 if(jwt.length>12000||!JWT.test(jwt))return {status:401};
 try{
  const response=await fetch(base+"/v1/admin/session",{
   cache:"no-store",redirect:"manual",headers:{Authorization:"Bearer "+jwt,Accept:"application/json"},
   signal:AbortSignal.timeout(4500)});
  if(response.status===401)return {status:401};
  if(response.status===403)return {status:403};
  if(response.status!==200)return {status:503};
  const data=await response.json() as {data?:{role?:unknown;permissions?:unknown}};
  const role=typeof data?.data?.role==="string"?data.data.role:"";
  const permissions=Array.isArray(data?.data?.permissions)&&data.data.permissions.every((p:unknown)=>typeof p==="string")
    ?data.data.permissions as string[]:[];
  // For read receipts only, the handler validates the JSON kind before this call.
  const scope=verifiedScope??(request?ceoScope(request.url,request.method):null);
  if(!canAccessCeo(role,permissions,scope))return {status:403};
  // Worker has verified the JWT signature and Owner DB grant.
  // The token sub is used only to associate/revoke this owner's devices.
  try{
   const claims=JSON.parse(Buffer.from(jwt.split(".")[1],"base64url").toString("utf8")) as {sub?:unknown};
   if(typeof claims.sub!=="string"||claims.sub.length<1||claims.sub.length>200)
    return {status:401};
   return {status:200,token:jwt,subject:claims.sub,role,permissions};
  }catch{return {status:401};}
 }catch{return {status:503};}
}
