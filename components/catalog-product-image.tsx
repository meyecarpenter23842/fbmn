"use client";

import Image from "next/image";
import { useState } from "react";

export function CatalogProductImage({ src, alt, className = "" }: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || src === failed) {
    return <div className={"catalog-empty-image " + className} role="img"
      aria-label={"Chưa có ảnh chính thức: " + alt}>
      <span aria-hidden="true">▤</span>
      <small>Ảnh chính thức đang cập nhật</small>
    </div>;
  }
  return <Image src={src} alt={alt} fill sizes="(max-width: 700px) 50vw, 300px"
    unoptimized className={"catalog-real-image " + className} onError={() => setFailed(src)}/>;
}
