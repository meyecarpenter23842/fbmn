import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./desktop.css";
import "./mobile.css";
import "./rebaseline.css";
import "./category-navigation.css";
import "./catalog.css";
import "./catalog-search.css";
import "./content.css";
import "./cms-public.css";
import "./site-footer.css";
import "./app-download.css";
import "./chatbot.css";
import "./glass-foundation.css";
import "./glass-product-detail.css";
import { GlassPageBackdrop } from "@/components/glass-ui";
import { publicDecorativeBackground } from "@/lib/media/decorative-background";
import { AppDownloadProvider } from "@/components/app-download";
import { ChatbotWidget } from "@/components/chatbot-widget";
import CmsPopupRuntime from "@/components/cms-popup-runtime";
import WebAnalytics from "@/components/web-analytics";
import {SeoJsonLd} from "@/lib/seo/json-ld";
import {organizationSchema} from "@/lib/seo/structured-data";
import {socialShareMetadata} from "@/lib/seo/social-share";

export const metadata: Metadata = {
  title: "Futurebook Miền Nam",
  description: "Tập vở, sổ, giấy và văn phòng phẩm Futurebook Miền Nam. Khám phá sản phẩm, catalogue và liên hệ hợp tác.",
  metadataBase: new URL("https://www.fbmn.vn"),
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/favicon-96.png", type: "image/png", sizes: "96x96" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  ...socialShareMetadata({
    title:"Futurebook Miền Nam",
    description:"Tập vở, sổ, giấy và văn phòng phẩm Futurebook Miền Nam. Khám phá sản phẩm, catalogue và liên hệ hợp tác.",
    path:"/"
  }),
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>
        <SeoJsonLd data={organizationSchema()}/>
        <AppDownloadProvider>
          <GlassPageBackdrop className="fb-glass-site"
            decorativeReadPath={publicDecorativeBackground.website ?? undefined}>
            {children}<WebAnalytics/><ChatbotWidget />
            {process.env.FBMN_CMS_PUBLIC_ENABLED==="true"&&<CmsPopupRuntime/>}
          </GlassPageBackdrop>
        </AppDownloadProvider>
      </body>
    </html>
  );
}
