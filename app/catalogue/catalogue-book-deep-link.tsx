"use client";
import Link from "next/link";

/**
 * A catalogue deep link must reinitialize the existing page-flip viewer.
 * Next's same-route SPA navigation preserves the mounted viewer state, so
 * use a normal document navigation for an unmodified primary click.
 * The real href remains crawlable and modifier/new-tab actions are native.
 */
export default function CatalogueBookDeepLink({bookId,children}:{
 bookId:string;children:React.ReactNode;
}){
 const href="/catalogue?book="+encodeURIComponent(bookId);
 return <Link href={href} prefetch={false} onClick={event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||
    event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  window.location.assign(href);
 }}>{children}</Link>;
}
