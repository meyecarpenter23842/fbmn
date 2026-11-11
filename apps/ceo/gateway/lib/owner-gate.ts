import "server-only";
import {ceoAuth} from "./auth-server";
type Gate={status:number;token?:string};
const JWT=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
export function workerOrigin():string|null{
 try{const url=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return url.protocol==="https:"&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==="/"?url.origin:null;
 }catch{return null;}
}
/** First-party Neon Auth cookie -> short-lived JWT -> Worker Owner DB grant.
 * Never send JWT or cookie to Flutter, analytics, logs or persistent storage. */
export async function requireOwner():Promise<Gate>{
 const auth=ceoAuth(),base=workerOrigin();
 if(!auth||!base)return {status:503};
 let jwt="";
 try{const response=await auth.token();jwt=response.data?.token||"";}
 catch{return {status:401};}
 if(jwt.length>12000||!JWT.test(jwt))return {status:401};
 try{
  const response=await fetch(base+"/v1/admin/session",{
   cache:"no-store",redirect:"manual",headers:{Authorization:"Bearer "+jwt,Accept:"application/json"},
   signal:AbortSignal.timeout(4500)});
  if(response.status===401)return {status:401};
  if(response.status===403)return {status:403};
  if(response.status!==200)return {status:503};
  const data=await response.json() as {data?:{role?:unknown}};
  return data?.data?.role==="owner"?{status:200,token:jwt}:{status:403};
 }catch{return {status:503};}
}
