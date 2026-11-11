import type {ReactNode} from "react";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Futurebook CEO",robots:{index:false,follow:false,nocache:true}};
export default function RootLayout({children}:{children:ReactNode}) {
 return <html lang="vi"><body style={{margin:0,fontFamily:"system-ui,sans-serif"}}>{children}</body></html>;
}
