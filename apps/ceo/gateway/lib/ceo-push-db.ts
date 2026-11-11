import "server-only";
import {Pool} from "pg";
import type {PoolClient} from "pg";

let pool:Pool|null=null;
export function pushDbConfigured():boolean{
 const url=process.env.FBMN_CEO_PUSH_DATABASE_URL||"";
 try{
  const parsed=new URL(url);
  return ["postgres:","postgresql:"].includes(parsed.protocol)&&
   parsed.hostname.endsWith(".neon.tech")&&!!parsed.username&&!!parsed.password;
 }catch{return false;}
}
export async function withPushDb<T>(run:(db:PoolClient)=>Promise<T>):Promise<T>{
 if(!pushDbConfigured())throw new Error("push_not_configured");
 if(!pool)pool=new Pool({connectionString:process.env.FBMN_CEO_PUSH_DATABASE_URL,
  max:2,connectionTimeoutMillis:4500,idleTimeoutMillis:2000,
  statement_timeout:15000,ssl:{rejectUnauthorized:true}});
 const client=await pool.connect();
 try{return await run(client);}finally{client.release();}
}
