import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Quản trị Futurebook Miền Nam",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="fb-admin">{children}</div>;
}
