"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

interface PhotoSlotProps {
  /** Image file, e.g. /work/<slug>/1.jpg. Omit when the file doesn't exist yet
   *  to show the placeholder without firing a 404. */
  src?: string;
  placeholder?: string;
  radius?: number;
  /** Aspect-ratio hint (e.g. "4/5") used before the image loads, to reserve the
   *  right cell shape and avoid layout shift. Once loaded, the image's true
   *  natural ratio takes over. */
  ratio?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Project image frame. Shows the photo at `src`; until a file exists there it
 * shows the editorial drop-zone placeholder (so dropping the file into
 * /public/work/<slug>/ is all that's needed - mirrors the logo/video pattern).
 *
 * The frame sizes itself to the photo's TRUE aspect ratio (natural once loaded,
 * the `ratio` hint before that), so the image fills it edge-to-edge with NO
 * cropping - whatever shape the photo is, the grid cell matches it. This
 * overrides the gallery's default fixed cell ratio.
 */
export function PhotoSlot({
  src,
  placeholder = "Drop an image",
  radius = 12,
  ratio,
  className,
  style,
}: PhotoSlotProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [natRatio, setNatRatio] = useState<string>();

  const onReady = (img: HTMLImageElement) => {
    setLoaded(true);
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNatRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
    }
  };

  // Cached images can finish before React attaches onLoad - check on mount too.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete) {
      if (img.naturalWidth > 0) onReady(img);
      else setFailed(true);
    }
  }, []);

  // Natural ratio wins once known; fall back to the hint; otherwise leave the
  // cell's CSS default (keeps the placeholder shape when there's no image).
  const aspectRatio = natRatio ?? ratio;

  return (
    <div
      className={cn("img-slot", !loaded && "ph-img", className)}
      style={{ borderRadius: `${radius}px`, ...style, ...(aspectRatio ? { aspectRatio } : null) }}
      aria-label={placeholder}
    >
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          className="photo-slot-img"
          src={src}
          alt={placeholder}
          loading="lazy"
          decoding="async"
          data-loaded={loaded ? "true" : "false"}
          onLoad={(e) => onReady(e.currentTarget)}
          onError={() => setFailed(true)}
        />
      )}
      {!loaded && <span className="img-slot-cap">{placeholder}</span>}
    </div>
  );
}
