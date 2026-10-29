import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Quản trị Futurebook Miền Nam",
  description: "Hệ thống quản trị nội bộ Futurebook Miền Nam",
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="vi"><body><div className="fb-admin">{children}</div></body></html>;
}
