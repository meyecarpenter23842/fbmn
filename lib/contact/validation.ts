export type ContactInput = { name: string; email: string; message: string; consent: true; website: string; startedAt: number };
export function validateContactInput(value: unknown, now = Date.now()): {ok: true; data: ContactInput} | {ok:false; error:string} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {ok:false,error:"Dữ liệu không hợp lệ."};
  const v = value as Record<string,unknown>;
  if (Object.keys(v).some(k=>!["name","email","message","consent","website","startedAt"].includes(k))) return {ok:false,error:"Trường không hợp lệ."};
  if (typeof v.name!=="string" || typeof v.email!=="string" || typeof v.message!=="string" || typeof v.website!=="string" || typeof v.startedAt!=="number" || v.consent!==true) return {ok:false,error:"Thiếu thông tin đồng ý liên hệ."};
  const name=v.name.trim(), email=v.email.trim().toLowerCase(), message=v.message.trim();
  if (name.length<2 || name.length>100 || email.length>254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || message.length<10 || message.length>2000) return {ok:false,error:"Tên, email hoặc nội dung không hợp lệ."};
  if(v.website || !Number.isSafeInteger(v.startedAt) || v.startedAt>now || now-v.startedAt<2500 || now-v.startedAt>86_400_000) return {ok:false,error:"Yêu cầu không hợp lệ."};
  return {ok:true,data:{name,email,message,consent:true,website:"",startedAt:v.startedAt}};
}
