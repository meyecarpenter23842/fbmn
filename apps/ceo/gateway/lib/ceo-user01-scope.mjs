// USER01: strict route/method scope for every browser-facing CEO endpoint.
// Unknown routes remain Owner-only. Call after signed JWT + DB grant verification.
export function ceoScope(url,method="GET"){
 let path;
 try{path=new URL(url).pathname;}catch{return null;}
 if(path==="/api/ceo/session"&&method==="GET")return "ceo.any";
 if(path==="/api/ceo/chat-history"&&method==="GET")return "ceo.conversations";
 if(path==="/api/ceo/contact-requests"&&method==="GET")return "ceo.contacts";
 if(path==="/api/ceo/outsourcing-requests"&&method==="GET")return "ceo.outsourcing";
 if(path==="/api/ceo/statistics"&&method==="GET")return "ceo.statistics";
 if(path==="/api/ceo/ads"&&method==="GET")return "ceo.ads.read";
 if(path==="/api/ceo/ads/drafts"&&method==="GET")return "ceo.ads.read";
 if(path==="/api/ceo/ads/drafts"&&["POST","DELETE"].includes(method))return "ceo.ads.draft";
 if(path==="/api/ceo/ads/oauth/status"&&method==="GET")return "ceo.ads.read";
 if(path==="/api/ceo/ads/oauth/status"&&["POST","DELETE"].includes(method))return "ceo.ads.manage";
 if(path==="/api/ceo/ads/oauth/start"&&method==="POST")return "ceo.ads.manage";
 if(path==="/api/ceo/ads/oauth/complete"&&method==="POST")return "ceo.ads.manage";
 if(path==="/api/ceo/search-console"&&method==="GET")return "ceo.seo";
 if(path==="/api/ceo/gsc/oauth/status"&&method==="GET")return "ceo.seo";
 if(path==="/api/ceo/gsc/oauth/status"&&method==="DELETE")return "ceo.gsc.manage";
 if(path.startsWith("/api/ceo/gsc/oauth/")&&method==="POST")return "ceo.gsc.manage";
 if(path==="/api/ceo/mail/webhook")return null;
 if(path==="/api/ceo/mail"&&method==="POST")return "ceo.mail.send";
 if((path==="/api/ceo/mail"||/^\/api\/ceo\/mail\/[a-zA-Z0-9-]+$/.test(path))&&method==="GET")return "ceo.mail.read";
 if(path==="/api/ceo/alerts"&&["GET","POST"].includes(method))return "ceo.notifications";
 if(path==="/api/ceo/reads"&&method==="POST")return "ceo.notifications";
 if(/^\/api\/ceo\/push\/(config|subscription|test)$/.test(path)&&["GET","POST","DELETE"].includes(method))return "ceo.notifications";
 return null;
}
export function canAccessCeo(role,permissions,scope){
 if(role==="owner")return true;
 if(!Array.isArray(permissions)||!permissions.every(p=>typeof p==="string"))return false;
 if(scope==="ceo.any")return permissions.some(p=>p.startsWith("ceo."));
 return Boolean(scope&&permissions.includes(scope));
}
