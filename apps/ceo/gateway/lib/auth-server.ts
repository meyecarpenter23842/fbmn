import "server-only";
import {createNeonAuth} from "@neondatabase/auth/next/server";
export function ceoAuth(){
 const baseUrl=process.env.NEON_AUTH_BASE_URL;
 const secret=process.env.NEON_AUTH_COOKIE_SECRET;
 if(!baseUrl||!secret||secret.length<32)return null;
 try{if(new URL(baseUrl).protocol!=="https:")return null;}catch{return null;}
 // Cache signed session metadata for the Neon-recommended 5 minutes, not 60 seconds.
 // This TTL is NOT the underlying Better Auth session expiration.
 return createNeonAuth({baseUrl,cookies:{secret,sessionDataTtl:300}});
}
