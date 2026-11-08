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
import "./site-footer.css";
import "./app-download.css";
import "./chatbot.css";
import "./glass-foundation.css";
import "./glass-product-detail.css";
import { GlassPageBackdrop } from "@/components/glass-ui";
import { publicDecorativeBackground } from "@/lib/media/decorative-background";
import { AppDownloadProvider } from "@/components/app-download";
import { ChatbotWidget } from "@/components/chatbot-widget";

export const metadata: Metadata = {
  title: "Futurebook Miền Nam",
  description: "Website Futurebook Miền Nam đang được xây dựng.",
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/brand/fbmn-mark.svg?v=20261104", type: "image/svg+xml" }], shortcut: "/favicon.ico", apple: "/brand/fbmn-mark.svg?v=20261104" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <AppDownloadProvider>
          <GlassPageBackdrop className="fb-glass-site"
            decorativeReadPath={publicDecorativeBackground.website ?? undefined}>
            {children}<ChatbotWidget />
          </GlassPageBackdrop>
        </AppDownloadProvider>
      </body>
    </html>
  );
}
