"use client";
import {useState} from "react";
import {CMS_SLOTS} from "./cms-placement-options";
import type {CmsKind,CmsSlot} from "./cms-placement-options";

/** C2 Website only: derive page groups from the existing public_web allowlist.
 * Never manufacture placement codes or reuse a native App layout.
 */
const AREA_LABELS:Record<string,string>={
 home:"Trang chủ",category:"Danh mục sản phẩm",all:"Toàn Website",
 news:"Tin tức",promotions:"Khuyến mãi"
};
const AREA_ORDER=["home","category","news","promotions","all"];
export type CmsWebArea={code:string;label:string;slots:CmsSlot[]};
export function cmsWebsiteAreas(kind:CmsKind):CmsWebArea[]{
 const slots=CMS_SLOTS[kind].public_web;
 return AREA_ORDER.map(code=>({
  code,label:AREA_LABELS[code],
  slots:slots.filter(slot=>slot.value.startsWith(code+"."))
 })).filter(area=>area.slots.length>0);
}
export function cmsWebsiteSlotLabel(kind:CmsKind,value:string){
 return CMS_SLOTS[kind].public_web.find(slot=>slot.value===value)?.label??"Chưa chọn vị trí";
}
export default function CmsWebsitePlacement({kind,value,onChange,disabled}:{
 kind:CmsKind;value:string;onChange:(value:string)=>void;disabled:boolean;
}){
 const groups=cmsWebsiteAreas(kind);
 const currentArea=groups.find(area=>area.slots.some(slot=>slot.value===value))?.code??"";
 const [chosenArea,setChosenArea]=useState("");
 const area=currentArea||(groups.some(item=>item.code===chosenArea)?chosenArea:"");
 const slots=groups.find(group=>group.code===area)?.slots??[];
 const selected=slots.find(slot=>slot.value===value);
 return <fieldset className="cms-placement-grid cms-wide">
  <legend>Vị trí trên Website Futurebook</legend>
  <p>Chọn trang trước, rồi chọn đúng khu vực đã quy định trong Website. Đây là cấu hình bản nháp, không tự xuất hiện trên trang đang chạy.</p>
  <div className="cms-form-grid">
   <label>Trang hiển thị
    <select value={area} disabled={disabled} onChange={e=>{
     setChosenArea(e.target.value);onChange("");
    }} aria-label="Trang hiển thị trên Website">
     <option value="">Chọn trang</option>
     {groups.map(group=><option value={group.code} key={group.code}>{group.label}</option>)}
    </select>
   </label>
   <label>Vị trí trong trang
    <select value={value} disabled={disabled||!area} onChange={e=>onChange(e.target.value)}
     aria-label="Vị trí hiển thị trên Website">
     <option value="">Chọn vị trí (có thể lưu nháp trước)</option>
     {slots.map(slot=><option value={slot.value} key={slot.value}>{slot.label}</option>)}
    </select>
   </label>
  </div>
  {selected&&<small>{selected.description}</small>}
 </fieldset>;
}
