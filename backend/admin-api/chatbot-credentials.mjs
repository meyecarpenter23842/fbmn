// Private dedicated R2 bucket; AES-GCM key lives only in the Admin Worker secret.
const hex=/^[0-9a-f]{64}$/;
const encoder=new TextEncoder(),decoder=new TextDecoder("utf-8",{fatal:true});
const keyFor=async secret=>{
 if(!hex.test(secret||""))throw Error("credentials_storage_unavailable");
 return crypto.subtle.importKey("raw",Uint8Array.from(secret.match(/../g),x=>parseInt(x,16)),"AES-GCM",false,["encrypt","decrypt"]);
};
const path=revision=>"chatbot/credential-"+revision;
export function createCredentialStore(bucket,secret){
 if(!bucket||!hex.test(secret||""))return undefined;
 return {
  async read(revision){
   const obj=await bucket.get(path(revision));if(!obj)return undefined;
   if(obj.size>20000)throw Error("credentials_storage_unavailable");
   const bytes=new Uint8Array(await obj.arrayBuffer());
   if(bytes.length<29)throw Error("credentials_storage_unavailable");
   return decoder.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes.slice(0,12),additionalData:encoder.encode(path(revision))},await keyFor(secret),bytes.slice(12)));
  },
  async write(revision,value){
   const iv=crypto.getRandomValues(new Uint8Array(12));
   const cipher=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:encoder.encode(path(revision))},await keyFor(secret),encoder.encode(value)));
   const bytes=new Uint8Array(12+cipher.length);bytes.set(iv);bytes.set(cipher,12);
   await bucket.put(path(revision),bytes,{httpMetadata:{contentType:"application/octet-stream"}});
  }
 };
}
