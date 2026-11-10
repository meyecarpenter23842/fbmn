"use client";
import {useState,type FormEvent} from "react";
import ContentToast from "./content-toast";
const blank={name:"",email:"",phone:"",productType:"",specifications:"",quantity:"",desiredDate:"",details:""};
type Fields=typeof blank;
export default function OutsourcingRequestForm(){
 const [fields,setFields]=useState<Fields>(blank);
 const [startedAt,setStartedAt]=useState(()=>Date.now());
 const [consent,setConsent]=useState(false);
 const [website,setWebsite]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [noticeVariant,setNoticeVariant]=useState<"success"|"error">("success");
 const [noticeId,setNoticeId]=useState(0);
 function edit(field:keyof Fields,value:string){setFields(prev=>({...prev,[field]:value}));}
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||!startedAt)return;
  setBusy(true);setNotice("");
  try{
   const response=await fetch("/api/gia-cong",{method:"POST",
    headers:{"Content-Type":"application/json"},cache:"no-store",
    body:JSON.stringify({...fields,consent,website,startedAt})});
   const result=await response.json().catch(()=>null) as {ok?:boolean}|null;
   if(response.status===201&&result?.ok===true){
    setNoticeVariant("success");setNotice("Yêu cầu đã được ghi nhận. Bộ phận phụ trách sẽ xem xét và phản hồi theo thông tin cung cấp.");setNoticeId(v=>v+1);setFields(blank);setConsent(false);setWebsite("");setStartedAt(Date.now());
   }else{setNoticeVariant("error");setNotice(response.status===429?
    "Có quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau.":
    response.status===400?"Vui lòng kiểm tra thông tin, nội dung và xác nhận đồng ý.":
    "Hệ thống chưa tiếp nhận được yêu cầu. Anh/chị vui lòng dùng kênh liên hệ đã công bố.");setNoticeId(v=>v+1);}
  }catch{setNoticeVariant("error");setNotice("Không kết nối được dịch vụ tiếp nhận. Vui lòng thử lại sau.");setNoticeId(v=>v+1);}
  finally{setBusy(false);}
 }
 return <form className="content-contact-form outsourcing-form" onSubmit={submit}>
  <fieldset disabled={busy}>
   <div className="outsourcing-fields">
    <label>Họ tên *<input required autoComplete="name" maxLength={100} value={fields.name} onChange={e=>edit("name",e.target.value)}/></label>
    <label>Email nhận phản hồi *<input required type="email" autoComplete="email" maxLength={254} value={fields.email} onChange={e=>edit("email",e.target.value)}/></label>
    <label>Số điện thoại (không bắt buộc)<input type="tel" autoComplete="tel" maxLength={30} value={fields.phone} onChange={e=>edit("phone",e.target.value)}/></label>
    <label>Loại sản phẩm cần gia công *<input required maxLength={80} value={fields.productType} onChange={e=>edit("productType",e.target.value)} placeholder="Ví dụ: tập vở, sổ, giấy…"/></label>
    <label>Quy cách dự kiến<input maxLength={600} value={fields.specifications} onChange={e=>edit("specifications",e.target.value)} placeholder="Khổ, số trang, chất liệu, bìa…"/></label>
    <label>Số lượng dự kiến<input maxLength={80} value={fields.quantity} onChange={e=>edit("quantity",e.target.value)} placeholder="Nếu đã có dự kiến"/></label>
    <label>Thời gian mong muốn<input maxLength={80} value={fields.desiredDate} onChange={e=>edit("desiredDate",e.target.value)} placeholder="Nếu có yêu cầu"/></label>
   </div>
   <label>Yêu cầu chi tiết *<textarea required rows={4} minLength={10} maxLength={2000} value={fields.details} onChange={e=>edit("details",e.target.value)} placeholder="Mô tả sản phẩm, quy cách và các thông tin cần được tư vấn"/></label>
   <label className="content-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/>
    Tôi đồng ý cung cấp thông tin để Futurebook Miền Nam liên hệ phản hồi yêu cầu này. Không gửi giá NET hoặc thông tin nhạy cảm.</label>
   <div className="outsourcing-honeypot" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>
   <button className="content-button" disabled={busy||!startedAt||!consent} type="submit">
    {busy?"Đang gửi yêu cầu…":"Gửi yêu cầu tư vấn"}</button>
  </fieldset>
  <ContentToast message={notice} variant={noticeVariant} notificationId={noticeId} onClose={()=>setNotice("")}/>
 </form>;
}
