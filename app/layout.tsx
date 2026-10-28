import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./desktop.css";
import "./mobile.css";

export const metadata: Metadata = {
  title: "Futurebook Miền Nam",
  description: "Website Futurebook Miền Nam đang được xây dựng.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
