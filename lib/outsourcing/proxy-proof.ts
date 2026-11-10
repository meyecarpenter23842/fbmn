// DL6 trusted Vercel-to-Worker handoff. Never send raw visitor IP over this hop.
// A 32-byte shared secret (64 hex chars) is configured independently in each runtime.
// HMAC binds the pseudonymous visitor key to payload and a short timestamp window.
const HEX=/^[0-9a-f]{64}$/;
const CLOCK=/^[1-9][0-9]{9}$/;
const encoder=new TextEncoder();
const hex=(buf:ArrayBuffer)=>Array.from(new Uint8Array(buf),x=>x.toString(16).padStart(2,"0")).join("");
function bytes(value:string){return Uint8Array.from(value.match(/../g)!.map(x=>parseInt(x,16)));}
async function key(secret:string){
 if(!HEX.test(secret))throw Error("Missing DL6 proxy secret");
 return crypto.subtle.importKey("raw",bytes(secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);
}
async function payloadHash(body:string){return hex(await crypto.subtle.digest("SHA-256",encoder.encode(body)));}
export async function createIntakeProof(secret:string,visitorIp:string,body:string,now=Date.now()){
 const signingKey=await key(secret);
 const visitor=hex(await crypto.subtle.sign("HMAC",signingKey,encoder.encode(visitorIp)));
 const time=String(Math.floor(now/1000));
 const hash=await payloadHash(body);
 const signature=hex(await crypto.subtle.sign("HMAC",signingKey,encoder.encode(visitor+"."+time+"."+hash)));
 return {visitor,time,signature};
}
export async function verifyIntakeProof(secret:string,headers:Headers,body:string,now=Date.now()){
 const visitor=headers.get("x-fbmn-dl6-visitor")||"";
 const time=headers.get("x-fbmn-dl6-time")||"";
 const signature=headers.get("x-fbmn-dl6-signature")||"";
 if(!HEX.test(secret)||!HEX.test(visitor)||!CLOCK.test(time)||!HEX.test(signature)||
    Math.abs(Math.floor(now/1000)-Number(time))>45)return null;
 const signingKey=await key(secret);
 const hash=await payloadHash(body);
 const valid=await crypto.subtle.verify("HMAC",signingKey,bytes(signature),
   encoder.encode(visitor+"."+time+"."+hash));
 return valid?visitor:null;
}
