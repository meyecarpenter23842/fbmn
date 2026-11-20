import {ImageResponse} from "next/og";
import {readFile} from "node:fs/promises";
import {join} from "node:path";

export const runtime="nodejs";
export const revalidate=86400;

// Read the real, source-controlled FBMN logo. No synthetic product images,
// external image services, R2 public access, or user-controlled inputs.
export async function GET(){
 const logo=await readFile(join(process.cwd(),"public","brand","fbmn-mark.svg"));
 const mark="data:image/svg+xml;base64,"+logo.toString("base64");
 return new ImageResponse(
  <div style={{width:"100%",height:"100%",display:"flex",position:"relative",
    alignItems:"center",padding:"68px 78px",
    background:"linear-gradient(115deg, #482078 0%, #7135a8 57%, #a879d4 100%)",
    color:"#ffffff",fontFamily:"sans-serif"}}>
   <div style={{position:"absolute",right:"-85px",top:"-120px",width:"440px",
    height:"440px",borderRadius:"220px",background:"rgba(255,255,255,.09)"}}/>
   <div style={{position:"absolute",right:"130px",bottom:"-185px",width:"450px",
    height:"450px",borderRadius:"225px",background:"rgba(255,255,255,.07)"}}/>
   <div style={{display:"flex",flexDirection:"column",width:"100%",zIndex:1}}>
    <div style={{display:"flex",alignItems:"center",gap:"28px"}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"center",
      width:"174px",height:"174px",borderRadius:"30px",background:"#ffffff",
      boxShadow:"0 18px 40px rgba(31,7,67,.2)"}}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mark} width={152} height={150} alt="Logo Futurebook Miền Nam"/>
     </div>
     <div style={{display:"flex",flexDirection:"column",gap:"12px",flex:1}}>
      <div style={{fontSize:"64px",fontWeight:800,letterSpacing:"-1.5px",
       lineHeight:1.08}}>Futurebook</div>
      <div style={{fontSize:"35px",fontWeight:600,letterSpacing:"1.5px",
       lineHeight:1.2}}>MIỀN NAM</div>
     </div>
    </div>
    <div style={{height:"2px",background:"rgba(255,255,255,.33)",
     margin:"49px 0 34px",width:"100%"}}/>
    <div style={{fontSize:"32px",fontWeight:600,lineHeight:1.3}}>
     Tập vở • Giấy • Văn phòng phẩm
    </div>
    <div style={{fontSize:"24px",marginTop:"14px",opacity:.93}}>
     www.fbmn.vn
    </div>
   </div>
  </div>,
  {
   width:1200,height:630,
   headers:{"Cache-Control":"public, max-age=86400, s-maxage=604800"}
  }
 );
}
