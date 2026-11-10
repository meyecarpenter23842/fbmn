import {PROVINCES,CUSTOMER_GROUPS,INTERESTS} from "../../apps/admin/lib/contact-options";
export {PROVINCES,CUSTOMER_GROUPS,INTERESTS};
export type ContactRequest={name:string;company:string;email:string;phone:string;province:string;customerGroup:string;interests:string[];message:string;consent:true;website:"";startedAt:number};
export function validateContactRequest(value:unknown,now=Date.now()):{ok:true;data:ContactRequest}|{ok:false;error:string}{
 const fail=(error:string)=>({ok:false as const,error});
 if(!value||typeof value!=="object"||Array.isArray(value))return fail("invalid_payload");
 const v=value as Record<string,unknown>;
 const keys=["name","company","email","phone","province","customerGroup","interests","message","consent","website","startedAt"];
 if(Object.keys(v).some(k=>!keys.includes(k)))return fail("invalid_field");
 const clean=(x:unknown,max:number)=>typeof x==="string"&&x.length<=max?x.trim():null;
 const name=clean(v.name,100),company=clean(v.company,150),email=clean(v.email,254)?.toLowerCase()??null,phone=clean(v.phone,30),message=clean(v.message,2000);
 const province=clean(v.province,2),customerGroup=clean(v.customerGroup,80);
 if(!name||name.length<2||company===null||email===null||phone===null||message===null||
  (!email&&!phone)||(email&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))||
  (phone&&(!/^\+?[0-9 ().-]+$/.test(phone)||phone.replace(/\D/g,"").length<8||phone.replace(/\D/g,"").length>15))||
  !province||!PROVINCES.some(p=>p[0]===province)||!customerGroup||!CUSTOMER_GROUPS.some(g=>g===customerGroup)||
  !Array.isArray(v.interests)||v.interests.length<1||v.interests.length>INTERESTS.length||
  !v.interests.every(x=>typeof x==="string"&&INTERESTS.some(i=>i===x))||new Set(v.interests).size!==v.interests.length)return fail("invalid_fields");
 if(v.consent!==true)return fail("consent_required");
 if(v.website!==""||typeof v.startedAt!=="number"||!Number.isSafeInteger(v.startedAt)||v.startedAt>now-3000||now-v.startedAt>86400000)return fail("anti_spam");
 return {ok:true,data:{name,company,email,phone,province,customerGroup,interests:v.interests as string[],message,consent:true,website:"",startedAt:v.startedAt}};
}
