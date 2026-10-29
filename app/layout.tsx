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
import { AppDownloadProvider } from "@/components/app-download";

export const metadata: Metadata = {
  title: "Futurebook Miền Nam",
  description: "Website Futurebook Miền Nam đang được xây dựng.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body><AppDownloadProvider>{children}</AppDownloadProvider></body>
    </html>
  );
}
