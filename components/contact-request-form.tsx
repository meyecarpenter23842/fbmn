"use client";
import {useState,type FormEvent} from "react";
import {PROVINCES,CUSTOMER_GROUPS,INTERESTS} from "@/lib/contact/dl9-validation";
import ContentToast from "./content-toast";
const blank={name:"",company:"",email:"",phone:"",province:"",customerGroup:"",interests:[] as string[],message:""};
export default function ContactRequestForm(){
 const [fields,setFields]=useState(blank),[consent,setConsent]=useState(false),[website,setWebsite]=useState("");
 const [startedAt,setStartedAt]=useState(()=>Date.now()),[busy,setBusy]=useState(false);
 const [notice,setNotice]=useState(""),[variant,setVariant]=useState<"success"|"error">("error"),[noticeId,setNoticeId]=useState(0);
 function edit(k:Exclude<keyof typeof blank,"interests">,v:string){setFields(p=>({...p,[k]:v}));}
 function notify(message:string,kind:"success"|"error"){setNotice(message);setVariant(kind);setNoticeId(i=>i+1);}
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;
  if(!fields.email.trim()&&!fields.phone.trim()){notify("Vui lòng nhập email hoặc số điện thoại.","error");return;}
  if(!fields.interests.length){notify("Vui lòng chọn ít nhất một nhóm sản phẩm.","error");return;}
  setBusy(true);
  try{
   const r=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",body:JSON.stringify({...fields,consent,website,startedAt})});
   const result=await r.json().catch(()=>null) as {ok?:boolean}|null;
   if(r.status===201&&result?.ok===true){notify("Đã gửi yêu cầu. Futurebook Miền Nam sẽ liên hệ theo thông tin anh/chị cung cấp.","success");setFields(blank);setConsent(false);setWebsite("");setStartedAt(Date.now());}
   else notify(r.status===429?"Vui lòng thử lại sau ít phút.":r.status===400?"Vui lòng kiểm tra thông tin liên hệ và các lựa chọn.":"Chưa gửi được yêu cầu. Vui lòng thử lại hoặc gửi email liên hệ.","error");
  }catch{notify("Không kết nối được dịch vụ. Vui lòng thử lại.","error");}finally{setBusy(false);}
 }
 return <form className="content-contact-form outsourcing-form" onSubmit={submit}>
  <fieldset disabled={busy}>
   <div className="outsourcing-fields">
    <label>Họ tên *<input required autoComplete="name" maxLength={100} minLength={2} value={fields.name} onChange={e=>edit("name",e.target.value)}/></label>
    <label>Tên đơn vị<input autoComplete="organization" maxLength={150} value={fields.company} onChange={e=>edit("company",e.target.value)}/></label>
    <label>Email<input type="email" autoComplete="email" maxLength={254} value={fields.email} onChange={e=>edit("email",e.target.value)}/></label>
    <label>Số điện thoại<input type="tel" autoComplete="tel" maxLength={30} value={fields.phone} onChange={e=>edit("phone",e.target.value)}/></label>
    <label>Tỉnh/thành *<select required value={fields.province} onChange={e=>edit("province",e.target.value)}><option value="">Chọn tỉnh/thành</option>{PROVINCES.map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label>
    <label>Nhóm khách hàng *<select required value={fields.customerGroup} onChange={e=>edit("customerGroup",e.target.value)}><option value="">Chọn nhóm khách hàng</option>{CUSTOMER_GROUPS.map(g=><option key={g}>{g}</option>)}</select></label>
   </div>
   <p className="content-small-note">Nhập ít nhất email hoặc số điện thoại để nhận phản hồi.</p>
   <fieldset className="contact-interests"><legend>Sản phẩm quan tâm * (chọn nhiều)</legend><div className="contact-interest-grid">{INTERESTS.map(i=><label key={i}><input type="checkbox" checked={fields.interests.includes(i)} onChange={e=>setFields(p=>({...p,interests:e.target.checked?[...p.interests,i]:p.interests.filter(x=>x!==i)}))}/>{i}</label>)}</div></fieldset>
   <label>Nhu cầu tư vấn<textarea rows={3} maxLength={2000} value={fields.message} onChange={e=>edit("message",e.target.value)} placeholder="Mã hàng, số lượng hoặc nhu cầu hợp tác…"/></label>
   <label className="content-consent"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/>Tôi đồng ý để Futurebook Miền Nam sử dụng thông tin này để phản hồi yêu cầu.</label>
   <div className="outsourcing-honeypot" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>
   <button className="content-button" disabled={busy||!consent} type="submit">{busy?"Đang gửi…":"Gửi liên hệ"}</button>
  </fieldset>
  <ContentToast message={notice} variant={variant} notificationId={noticeId} onClose={()=>setNotice("")}/>
 </form>;
}
