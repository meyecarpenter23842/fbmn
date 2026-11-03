import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./admin.css";
import "./activation.css";
import "./import-preview.css";
import "./admin-refinement.css";
import "./catalogue-workspace.css";
import "./catalogue-structure.css";
import "./admin-l01-navigation.css";
import "./admin-controls.css";

export const metadata: Metadata = {
  title: "Quản trị Futurebook Miền Nam",
  description: "Hệ thống quản trị nội bộ Futurebook Miền Nam",
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: [{ url: "/brand/fbmn-official-logo.webp", type: "image/webp" }], apple: "/brand/fbmn-official-logo.webp" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="vi"><body><div className="fb-admin">{children}<div id="fb-admin-toast-root" className="fb-admin-toast-stack" aria-label="Thông báo thao tác"/></div></body></html>;
}
