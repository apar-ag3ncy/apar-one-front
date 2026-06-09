"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

interface PhotoSlotProps {
  /** Image file, e.g. /work/<slug>/1.jpg */
  src: string;
  placeholder?: string;
  radius?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Project image frame. Shows the photo at `src`; until a file exists there it
 * shows the editorial drop-zone placeholder (so dropping the file into
 * /public/work/<slug>/ is all that's needed — mirrors the logo/video pattern).
 */
export function PhotoSlot({
  src,
  placeholder = "Drop an image",
  radius = 12,
  className,
  style,
}: PhotoSlotProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Cached images can finish before React attaches onLoad — check on mount too.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete) {
      if (img.naturalWidth > 0) setLoaded(true);
      else setFailed(true);
    }
  }, []);

  return (
    <div
      className={cn("img-slot", !loaded && "ph-img", className)}
      style={{ borderRadius: `${radius}px`, ...style }}
      aria-label={placeholder}
    >
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          className="photo-slot-img"
          src={src}
          alt={placeholder}
          loading="lazy"
          data-loaded={loaded ? "true" : "false"}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {!loaded && <span className="img-slot-cap">{placeholder}</span>}
    </div>
  );
}
