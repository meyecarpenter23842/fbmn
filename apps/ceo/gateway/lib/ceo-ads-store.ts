import "server-only";
import {withPushDb} from "./ceo-push-db";
import {encryptSecret,decryptSecret} from "./ceo-gsc-oauth.mjs";
import type {PoolClient} from "pg";
export type AdsConnection={subject:string;refreshToken:string;customerId:string|null;
 loginCustomerId:string|null;currency:string|null;timeZone:string|null;name:string|null};
type ConnectionRow={owner_subject:string;ciphertext:string;customer_id:string|null;
 login_customer_id:string|null;currency:string|null;time_zone:string|null;customer_name:string|null};
const decode=(r:ConnectionRow,key:Buffer):AdsConnection=>({
 subject:r.owner_subject,refreshToken:decryptSecret(r.ciphertext,key),
 customerId:r.customer_id,loginCustomerId:r.login_customer_id,
 currency:r.currency,timeZone:r.time_zone,name:r.customer_name});
export async function readAdsConnection(owner:string,key:Buffer):Promise<AdsConnection|null>{
 const r=await withPushDb(db=>db.query<ConnectionRow>(
  "SELECT * FROM fbmn_catalog_private.ceo_ads_connections WHERE owner_subject=$1",[owner]));
 return r.rows[0]?decode(r.rows[0],key):null;
}
export async function readCompanyAdsConnection(key:Buffer):Promise<AdsConnection|null>{
 const r=await withPushDb(db=>db.query<ConnectionRow>(
  "SELECT * FROM fbmn_catalog_private.ceo_ads_connections ORDER BY updated_at DESC LIMIT 1"));
 return r.rows[0]?decode(r.rows[0],key):null;
}
export async function saveAdsConnection(subject:string,refresh:string,key:Buffer):Promise<void>{
 const ciphertext=encryptSecret(refresh,key);
 await withPushDb(db=>db.query(
  "INSERT INTO fbmn_catalog_private.ceo_ads_connections "+
  "(owner_subject,ciphertext,updated_at) VALUES($1,$2,now()) "+
  "ON CONFLICT(owner_subject) DO UPDATE SET ciphertext=excluded.ciphertext,"+
  "customer_id=NULL,login_customer_id=NULL,currency=NULL,time_zone=NULL,"+
  "customer_name=NULL,updated_at=now()",[subject,ciphertext]));
}
// Rotated grants must preserve the customer and its currency/timezone.
export async function rotateAdsGrant(subject:string,refresh:string,key:Buffer):Promise<void>{
 const ciphertext=encryptSecret(refresh,key);
 await withPushDb(db=>db.query(
  "UPDATE fbmn_catalog_private.ceo_ads_connections "+
  "SET ciphertext=$2,updated_at=now() WHERE owner_subject=$1",[subject,ciphertext]));
}
export async function chooseAdsCustomer(subject:string,info:{
 id:string;name:string;currency:string;timeZone:string},login:string|null):Promise<boolean>{
 const r=await withPushDb(db=>db.query(
  "UPDATE fbmn_catalog_private.ceo_ads_connections SET "+
  "customer_id=$2,customer_name=$3,currency=$4,time_zone=$5,login_customer_id=$6,updated_at=now() "+
  "WHERE owner_subject=$1",[subject,info.id,info.name,info.currency,info.timeZone,login]));
 return (r.rowCount||0)===1;
}
export async function deleteAdsConnection(subject:string):Promise<void>{
 await withPushDb(db=>db.query(
  "DELETE FROM fbmn_catalog_private.ceo_ads_connections WHERE owner_subject=$1",[subject]));
}
export async function adsDrafts(subject:string):Promise<unknown[]>{
 const r=await withPushDb(db=>db.query(
  "SELECT id::text,kind,name,payload,revision,updated_at "+
  "FROM fbmn_catalog_private.ceo_ads_drafts WHERE owner_subject=$1 "+
  "ORDER BY updated_at DESC LIMIT 100",[subject]));
 return r.rows;
}
export async function saveAdsDraft(subject:string,actor:string,draft:Record<string,unknown>):Promise<string>{
 const r=await withPushDb(db=>db.query<{id:string}>(
  "INSERT INTO fbmn_catalog_private.ceo_ads_drafts "+
  "(owner_subject,actor_subject,kind,name,payload) VALUES($1,$2,$3,$4,$5) "+
  "RETURNING id::text",[subject,actor,draft.kind,draft.name,JSON.stringify(draft)]));
 return r.rows[0].id;
}
export async function removeAdsDraft(subject:string,id:string):Promise<boolean>{
 const r=await withPushDb(db=>db.query(
  "DELETE FROM fbmn_catalog_private.ceo_ads_drafts WHERE owner_subject=$1 AND id=$2::uuid",
  [subject,id]));
 return (r.rowCount||0)===1;
}
export async function auditAds(owner:string,actor:string,action:string,
 customer:string|null,details:object,status:string,requestId:string|null=null):Promise<void>{
 await withPushDb(db=>db.query(
  "INSERT INTO fbmn_catalog_private.ceo_ads_audit "+
  "(owner_subject,actor_subject,action,customer_id,details,status,google_request_id) "+
  "VALUES($1,$2,$3,$4,$5,$6,$7)",
  [owner,actor,action,customer,JSON.stringify(details),status,requestId]));
}
// Fail closed: no Google mutations until an audited, atomic one-use approval flow is deployed.
export async function withAdsApprovalLock<T>(key:string,work:(db:PoolClient)=>Promise<T>):Promise<T>{
 return withPushDb(async db=>{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[key]);
   const out=await work(db);
   await db.query("COMMIT");
   return out;
  }catch(error){await db.query("ROLLBACK");throw error;}
 });
}

export async function adsDraftById(owner:string,id:string):Promise<{
 id:string;revision:number;payload:Record<string,unknown>}|null>{
 const r=await withPushDb(db=>db.query<{
  id:string;revision:number;payload:Record<string,unknown>}>(
  "SELECT id::text,revision,payload FROM fbmn_catalog_private.ceo_ads_drafts "+
  "WHERE owner_subject=$1 AND id=$2::uuid LIMIT 1",[owner,id]));
 return r.rows[0]||null;
}
export async function reserveAdsApproval(owner:string,hash:string,action:string,
 customer:string,currency:string,draftId:string|null,preview:object):Promise<string|null>{
 return withPushDb(async db=>{
  const r=await db.query<{id:string}>(
   "INSERT INTO fbmn_catalog_private.ceo_ads_approvals "+
   "(approval_hash,owner_subject,action,customer_id,currency,draft_id,preview,status) "+
   "VALUES($1,$2,$3,$4,$5,$6::uuid,$7,'in_flight') "+
   "ON CONFLICT DO NOTHING RETURNING id::text",
   [hash,owner,action,customer,currency,draftId,JSON.stringify(preview)]);
  return r.rows[0]?.id??null;
 });
}
export async function finishAdsApproval(id:string,status:"verified"|"failed"|"unknown",
 result:object):Promise<void>{
 await withPushDb(db=>db.query(
  "UPDATE fbmn_catalog_private.ceo_ads_approvals "+
  "SET status=$2,result=$3,updated_at=now() WHERE id=$1::uuid",
  [id,status,JSON.stringify(result)]));
}

export async function updateAdsDraft(subject:string,id:string,revision:number,
 draft:Record<string,unknown>):Promise<boolean>{
 const r=await withPushDb(db=>db.query(
  "UPDATE fbmn_catalog_private.ceo_ads_drafts SET name=$4,kind=$5,payload=$6,"+
  "revision=revision+1,updated_at=now() WHERE id=$2::uuid "+
  "AND owner_subject=$1 AND revision=$3",
  [subject,id,revision,draft.name,draft.kind,JSON.stringify(draft)]));
 return (r.rowCount||0)===1;
}
