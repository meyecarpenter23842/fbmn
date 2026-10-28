import type { ReactNode } from "react";
import Link from "next/link";

export type IconName =
  | "menu" | "x" | "search" | "cart" | "user" | "arrow" | "chevron"
  | "book" | "sparkles" | "pencil" | "shield" | "heart" | "package";

const drawings: Record<IconName, ReactNode> = {
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  x: <><path d="M18 6 6 18M6 6l12 12" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  cart: <><circle cx="9" cy="20" r="1" /><circle cx="19" cy="20" r="1" /><path d="M2 3h2l3 13h13l2-10H5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  arrow: <><path d="M5 12h14m-7-7 7 7-7 7" /></>,
  chevron: <><path d="m9 18 6-6-6-6" /></>,
  book: <><path d="M12 7a8 8 0 0 0-9-2v15a8 8 0 0 1 9 2 8 8 0 0 1 9-2V5a8 8 0 0 0-9 2Zm0 0v15" /></>,
  sparkles: <><path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3Zm7 14 .5 1.5L21 19l-1.5.5L19 21l-.5-1.5L17 19l1.5-.5L19 17Z" /></>,
  pencil: <><path d="m4 20 4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Zm9.5-12.5 3 3" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3-10 2 2 4-4" /></>,
  heart: <><path d="M20.8 8.6c0 5-8.8 11-8.8 11s-8.8-6-8.8-11a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2Z" /></>,
  package: <><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm-9 5 9 5 9-5M12 12v10m-5-17 9 5" /></>,
};

export function Icon({ name, size = 20, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      {drawings[name]}
    </svg>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={["container", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={["pill", className].filter(Boolean).join(" ")}>{children}</span>;
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="preview-badge">{children}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <article className={["ui-card", className].filter(Boolean).join(" ")}>{children}</article>;
}

export function ButtonLink({
  children,
  href,
  tone = "pink",
  className = "",
}: { children: ReactNode; href: string; tone?: "pink" | "purple"; className?: string }) {
  return <Link className={["button-link", "button-link--" + tone, className].filter(Boolean).join(" ")} href={href}>{children}</Link>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={["skeleton", className].filter(Boolean).join(" ")} />;
}
