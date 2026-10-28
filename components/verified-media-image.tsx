"use client";

import { useState } from "react";
import Image from "next/image";
import type { ReactNode } from "react";
import type { ApprovedMedia } from "@/lib/media/r2";
import { getApprovedMediaUrl } from "@/lib/media/r2";

interface Props {
  asset: ApprovedMedia | null;
  fallback: ReactNode;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Never render an external image without approved metadata and trusted media
 * origin. On network errors retain the existing approved UI placeholder.
 */
export function VerifiedMediaImage({
  asset, fallback, className, priority = false, sizes = "100vw",
}: Props) {
  const src = getApprovedMediaUrl(asset, process.env.NEXT_PUBLIC_MEDIA_BASE_URL);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src || !asset) return <>{fallback}</>;

  return (
    <Image
      unoptimized
      src={src}
      width={asset.width}
      height={asset.height}
      alt={asset.alt}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
