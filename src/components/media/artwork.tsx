"use client";

import Image from "next/image";
import { useState } from "react";
import type { MediaType } from "@/lib/media/types";
import { cn } from "@/lib/utils";
import { FallbackCover } from "./fallback-cover";

interface ArtworkProps {
  src?: string | null;
  title: string;
  type: MediaType;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  /** Hide the title on the fallback cover (e.g. when a caption sits right below). */
  compactFallback?: boolean;
}

/**
 * Artwork that fills its (aspect-ratio'd) parent: shimmer while loading,
 * soft crossfade when ready, typographic cover when missing or broken.
 */
export function Artwork({ src, title, type, sizes, priority, className, imageClassName, compactFallback }: ArtworkProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const showImage = Boolean(src) && status !== "error";

  return (
    <div className={cn("@container absolute inset-0 overflow-hidden bg-elevated-2", className)}>
      {showImage ? (
        <>
          {status === "loading" && <div aria-hidden className="skeleton absolute inset-0" />}
          <Image
            src={src!}
            alt={title}
            fill
            sizes={sizes}
            priority={priority}
            draggable={false}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            className={cn(
              "object-cover transition-opacity duration-500 ease-(--ease-out-soft) select-none [-webkit-touch-callout:none]",
              status === "loaded" ? "opacity-100" : "opacity-0",
              imageClassName,
            )}
          />
        </>
      ) : (
        <FallbackCover title={title} type={type} compact={compactFallback} />
      )}
    </div>
  );
}
