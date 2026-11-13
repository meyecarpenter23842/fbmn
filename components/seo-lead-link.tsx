"use client";
import Link from "next/link";
import type {ComponentProps,ReactNode} from "react";
import {trackWebEvent} from "@/lib/analytics/web-client";
import type {LeadCtaLocation} from "@/lib/analytics/web-events";
/** Existing native Link semantics/styles; only records public CTA intent. */
export default function SeoLeadLink({location,children,...props}:{
 location:Extract<LeadCtaLocation,"dealer"|"catalogue">;
 children:ReactNode;
}&Omit<ComponentProps<typeof Link>,"children"|"onClick">){
 return <Link {...props} onClick={()=>trackWebEvent("web_lead_cta_click",{cta_location:location})}>
  {children}
 </Link>;
}
