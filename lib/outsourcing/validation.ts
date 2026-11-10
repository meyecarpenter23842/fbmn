// DL6: strict public intake DTO; no pricing, stock or customer data may be inferred.
export type OutsourcingRequest={
 name:string;email:string;phone:string;productType:string;specifications:string;
 quantity:string;desiredDate:string;details:string;consent:true;website:"";startedAt:number
};
export type IntakeCheck={ok:true;data:OutsourcingRequest}|{ok:false;error:string};
const EMAIL=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const KEYS=new Set(["name","email","phone","productType","specifications","quantity","desiredDate","details","consent","website","startedAt"]);
function clean(value:unknown,max:number){return typeof value==="string"&&value.length<=max?value.trim():null;}
export function validateOutsourcingRequest(value:unknown,now=Date.now()):IntakeCheck{
 if(!value||typeof value!=="object"||Array.isArray(value))return {ok:false,error:"invalid_payload"};
 const v=value as Record<string,unknown>;
 if(Object.keys(v).some(k=>!KEYS.has(k)))return {ok:false,error:"invalid_field"};
 const name=clean(v.name,120),email=clean(v.email,260)?.toLowerCase()??null;
 const phone=clean(v.phone,40),productType=clean(v.productType,100);
 const specifications=clean(v.specifications,600),quantity=clean(v.quantity,80);
 const desiredDate=clean(v.desiredDate,80),details=clean(v.details,2500);
 if(!name||name.length<2||name.length>100||!email||email.length>254||!EMAIL.test(email)||
    phone===null||(phone!==""&&!/^[0-9+(). \-]{7,30}$/.test(phone))||
    !productType||productType.length<2||productType.length>80||
    specifications===null||quantity===null||desiredDate===null||
    !details||details.length<10||details.length>2000)
  return {ok:false,error:"invalid_fields"};
 if(v.consent!==true)return {ok:false,error:"consent_required"};
 if(v.website!==""||!Number.isSafeInteger(v.startedAt)||typeof v.startedAt!=="number"||
    !Number.isSafeInteger(now)||v.startedAt>now-3000||now-v.startedAt>86400000)
  return {ok:false,error:"anti_spam"};
 return {ok:true,data:{name,email,phone,productType,specifications,quantity,desiredDate,details,
   consent:true,website:"",startedAt:v.startedAt}};
}
