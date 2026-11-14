import "server-only";
import {withPushDb} from "./ceo-push-db";
import {decryptSecret,encryptSecret} from "./ceo-gsc-oauth.mjs";

// Refresh tokens are encrypted with AES-256-GCM before storage and owner scoped.
export async function readGscGrant(subject:string,key:Buffer):Promise<string|null>{
 const rows=await withPushDb(async db=>db.query<{ciphertext:string}>(
  "SELECT ciphertext FROM fbmn_catalog_private.ceo_gsc_oauth_grants WHERE owner_subject=$1",
  [subject]));
 const sealed=rows.rows[0]?.ciphertext;
 return sealed?decryptSecret(sealed,key):null;
}
export async function saveGscGrant(subject:string,token:string,key:Buffer):Promise<void>{
 const encrypted=encryptSecret(token,key);
 await withPushDb(async db=>{
  await db.query(
   "INSERT INTO fbmn_catalog_private.ceo_gsc_oauth_grants(owner_subject,ciphertext,updated_at) "+
   "VALUES($1,$2,now()) ON CONFLICT(owner_subject) DO UPDATE "+
   "SET ciphertext=excluded.ciphertext,updated_at=now()",
   [subject,encrypted]);
 });
}
export async function deleteGscGrant(subject:string):Promise<void>{
 await withPushDb(async db=>{
  await db.query("DELETE FROM fbmn_catalog_private.ceo_gsc_oauth_grants "+
   "WHERE owner_subject=$1",[subject]);
 });
}
